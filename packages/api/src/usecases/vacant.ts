/** 日付範囲 */
export type DateRange = {
	startDate: string
	endDate: string
}

/** 空き期間 */
export type VacantPeriod = {
	startDate: string
	endDate: string
	days: number
	isLongWeekend: boolean
}

const MAX_VACANT_DAYS = 30

/**
 * 占有済み日程と祝日から空き期間を計算する。
 * minDays以上の連続した空き日を空き期間として返す。
 * 月をまたぐ期間は月境界で分割し、最大30日に制限する。
 */
export function calculateVacantPeriods(
	occupiedRanges: DateRange[],
	holidayDates: Set<string>,
	rangeStart: string,
	rangeEnd: string,
	minDays = 3,
): VacantPeriod[] {
	const occupied = buildOccupiedSet(occupiedRanges)

	const rawGaps: { start: Date; end: Date }[] = []
	const current = toDate(rangeStart)
	const end = toDate(rangeEnd)
	let periodStart: Date | null = null

	while (current <= end) {
		const dateStr = toDateStr(current)

		if (!occupied.has(dateStr)) {
			if (!periodStart) {
				periodStart = new Date(current)
			}
		} else if (periodStart) {
			const periodEnd = new Date(current)
			periodEnd.setDate(periodEnd.getDate() - 1)
			rawGaps.push({ start: periodStart, end: periodEnd })
			periodStart = null
		}

		current.setDate(current.getDate() + 1)
	}

	if (periodStart) {
		rawGaps.push({ start: periodStart, end: toDate(rangeEnd) })
	}

	// 月境界で分割し、最大日数を適用してからフィルタ
	const periods: VacantPeriod[] = []
	for (const gap of rawGaps) {
		const chunks = splitByMonth(gap.start, gap.end)
		for (const chunk of chunks) {
			for (const sub of splitByMaxDays(chunk.start, chunk.end, MAX_VACANT_DAYS)) {
				tryAddPeriod(periods, sub.start, sub.end, holidayDates, minDays)
			}
		}
	}

	return periods
}

/** 月境界で期間を分割する */
function splitByMonth(
	start: Date,
	end: Date,
): { start: Date; end: Date }[] {
	const chunks: { start: Date; end: Date }[] = []
	let chunkStart = new Date(start)

	while (chunkStart <= end) {
		// この月の末日を求める
		const monthEnd = new Date(chunkStart.getFullYear(), chunkStart.getMonth() + 1, 0)
		const chunkEnd = monthEnd < end ? monthEnd : new Date(end)
		chunks.push({ start: new Date(chunkStart), end: chunkEnd })
		// 翌月1日へ
		chunkStart = new Date(monthEnd)
		chunkStart.setDate(chunkStart.getDate() + 1)
	}

	return chunks
}

/** 最大日数で期間を分割する */
function splitByMaxDays(
	start: Date,
	end: Date,
	maxDays: number,
): { start: Date; end: Date }[] {
	const chunks: { start: Date; end: Date }[] = []
	let chunkStart = new Date(start)

	while (chunkStart <= end) {
		const chunkEnd = new Date(chunkStart)
		chunkEnd.setDate(chunkEnd.getDate() + maxDays - 1)
		const actualEnd = chunkEnd < end ? chunkEnd : new Date(end)
		chunks.push({ start: new Date(chunkStart), end: actualEnd })
		chunkStart = new Date(actualEnd)
		chunkStart.setDate(chunkStart.getDate() + 1)
	}

	return chunks
}

function buildOccupiedSet(ranges: DateRange[]): Set<string> {
	const occupied = new Set<string>()
	for (const range of ranges) {
		const current = toDate(range.startDate)
		const end = toDate(range.endDate)
		while (current <= end) {
			occupied.add(toDateStr(current))
			current.setDate(current.getDate() + 1)
		}
	}
	return occupied
}

function tryAddPeriod(
	periods: VacantPeriod[],
	start: Date,
	end: Date,
	holidayDates: Set<string>,
	minDays: number,
): void {
	const days = daysBetween(start, end)
	if (days >= minDays && containsWeekendOrHoliday(start, end, holidayDates)) {
		periods.push({
			startDate: toDateStr(start),
			endDate: toDateStr(end),
			days,
			isLongWeekend: checkIsLongWeekend(start, end, holidayDates),
		})
	}
}

/** 期間内に週末（土日）または祝日が含まれるか */
function containsWeekendOrHoliday(start: Date, end: Date, holidayDates: Set<string>): boolean {
	const current = new Date(start)
	while (current <= end) {
		const dow = current.getDay()
		if (dow === 0 || dow === 6) return true
		if (holidayDates.has(toDateStr(current))) return true
		current.setDate(current.getDate() + 1)
	}
	return false
}

/** 連休判定: 3〜5日で週末+祝日を含む */
function checkIsLongWeekend(start: Date, end: Date, holidayDates: Set<string>): boolean {
	const days = daysBetween(start, end)
	if (days > 5) return false

	let hasWeekend = false
	let hasHoliday = false
	const current = new Date(start)

	while (current <= end) {
		const dow = current.getDay()
		if (dow === 0 || dow === 6) hasWeekend = true
		if (holidayDates.has(toDateStr(current))) hasHoliday = true
		current.setDate(current.getDate() + 1)
	}

	return hasWeekend && hasHoliday
}

function daysBetween(start: Date, end: Date): number {
	return Math.round((end.getTime() - start.getTime()) / (86400 * 1000)) + 1
}

function toDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

function toDateStr(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
