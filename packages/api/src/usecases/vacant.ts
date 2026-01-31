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

/**
 * 占有済み日程と祝日から空き期間を計算する。
 * minDays以上の連続した空き日を空き期間として返す。
 */
export function calculateVacantPeriods(
	occupiedRanges: DateRange[],
	holidayDates: Set<string>,
	rangeStart: string,
	rangeEnd: string,
	minDays = 3,
): VacantPeriod[] {
	const occupied = buildOccupiedSet(occupiedRanges)

	const periods: VacantPeriod[] = []
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
			tryAddPeriod(periods, periodStart, periodEnd, holidayDates, minDays)
			periodStart = null
		}

		current.setDate(current.getDate() + 1)
	}

	if (periodStart) {
		tryAddPeriod(periods, periodStart, toDate(rangeEnd), holidayDates, minDays)
	}

	return periods
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
