import type { CalendarItem } from '@sukima/api/src/usecases/calendar'

export type MonthGroup = {
	year: number
	month: number
	label: string
	items: CalendarItem[]
}

export type WeekGroup = {
	weekStart: string
	weekEnd: string
	label: string
	items: CalendarItem[]
}

export type ViewMode = 'weekly' | 'monthly' | 'compressed'

/** アイテムのソート用日付を返す */
export function getItemSortDate(item: CalendarItem): string {
	switch (item.type) {
		case 'event':
		case 'blocked':
		case 'vacant':
		case 'external':
			return item.startDate
		case 'holiday':
			return item.date
		case 'idea_trip':
		case 'idea_monthly':
			return `${item.year}-${String(item.month).padStart(2, '0')}-01`
	}
}

/** アイテムの年月を取得する */
function getItemYearMonth(item: CalendarItem): { year: number; month: number } {
	const dateStr = getItemSortDate(item)
	const year = Number.parseInt(dateStr.slice(0, 4), 10)
	const month = Number.parseInt(dateStr.slice(5, 7), 10)
	return { year, month }
}

/** 月ごとにグループ化（fillGaps=trueで空の月も含める） */
export function groupByMonth(items: CalendarItem[], fillGaps = false): MonthGroup[] {
	const groups = new Map<string, MonthGroup>()

	for (const item of items) {
		const { year, month } = getItemYearMonth(item)
		const key = `${year}-${String(month).padStart(2, '0')}`

		if (!groups.has(key)) {
			groups.set(key, {
				year,
				month,
				label: `${year}年${month}月`,
				items: [],
			})
		}
		groups.get(key)!.items.push(item)
	}

	const sorted = Array.from(groups.values()).sort(
		(a, b) => a.year * 100 + a.month - (b.year * 100 + b.month),
	)

	if (!fillGaps || sorted.length < 2) return sorted

	// 最初と最後の月の間の空月を補完
	const first = sorted[0]
	const last = sorted[sorted.length - 1]
	const all: MonthGroup[] = []

	let y = first.year
	let m = first.month
	while (y < last.year || (y === last.year && m <= last.month)) {
		const key = `${y}-${String(m).padStart(2, '0')}`
		const existing = groups.get(key)
		all.push(existing ?? { year: y, month: m, label: `${y}年${m}月`, items: [] })
		m++
		if (m > 12) {
			m = 1
			y++
		}
	}

	return all
}

/** 週ごとにグループ化 */
export function groupByWeek(items: CalendarItem[]): WeekGroup[] {
	const groups = new Map<string, WeekGroup>()

	for (const item of items) {
		const dateStr = getItemSortDate(item)
		const date = new Date(dateStr)
		const weekStart = getWeekStart(date)
		const weekEnd = new Date(weekStart)
		weekEnd.setDate(weekEnd.getDate() + 6)
		const key = toDateStr(weekStart)

		if (!groups.has(key)) {
			const startMonth = weekStart.getMonth() + 1
			const startDay = weekStart.getDate()
			const endMonth = weekEnd.getMonth() + 1
			const endDay = weekEnd.getDate()

			groups.set(key, {
				weekStart: key,
				weekEnd: toDateStr(weekEnd),
				label: `${startMonth}/${startDay}〜${endMonth}/${endDay}`,
				items: [],
			})
		}
		groups.get(key)!.items.push(item)
	}

	return Array.from(groups.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

/** 日付の距離から表示モードを判定 */
export function getViewMode(dateStr: string): ViewMode {
	const now = new Date()
	const target = new Date(dateStr)
	const diffMonths =
		(target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())

	if (diffMonths <= 3) return 'weekly'
	if (diffMonths <= 12) return 'monthly'
	return 'compressed'
}

/** アイテムを表示モード別にグループ化 */
export function splitByViewMode(items: CalendarItem[]): {
	weekly: CalendarItem[]
	monthly: CalendarItem[]
	compressed: CalendarItem[]
} {
	const weekly: CalendarItem[] = []
	const monthly: CalendarItem[] = []
	const compressed: CalendarItem[] = []

	for (const item of items) {
		const mode = getViewMode(getItemSortDate(item))
		switch (mode) {
			case 'weekly':
				weekly.push(item)
				break
			case 'monthly':
				monthly.push(item)
				break
			case 'compressed':
				compressed.push(item)
				break
		}
	}

	return { weekly, monthly, compressed }
}

/** YYYY-MM-DD を YYYY年M月D日 に変換 */
export function formatDateJa(dateStr: string): string {
	const [y, m, d] = dateStr.split('-').map(Number)
	return `${y}年${m}月${d}日`
}

function getWeekStart(date: Date): Date {
	const d = new Date(date)
	const day = d.getDay()
	// 月曜始まり
	const diff = day === 0 ? -6 : 1 - day
	d.setDate(d.getDate() + diff)
	return d
}

function toDateStr(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
