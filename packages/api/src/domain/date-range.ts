/**
 * 日付範囲（DateRange）に関する純粋関数ドメインロジック
 *
 * 期間の分割、占有日付セット生成、週末・祝日判定などを提供する。
 * すべて純粋関数で、副作用なし、immutableを志向。
 */

import {
	addDays,
	daysBetween,
	enumerateDateStrings,
	getLastDayOfMonth,
	isHoliday,
	isWeekend,
	parseDate,
} from './calendar-date'

/** 日付範囲 */
export type DateRange = {
	startDate: string
	endDate: string
}

/**
 * 複数の日付範囲から占有済み日付のSetを構築
 *
 * 複数の予定・ブロック期間から、すべての日付をフラットなSetに展開する。
 */
export function buildOccupiedSet(ranges: DateRange[]): Set<string> {
	const occupied = new Set<string>()

	for (const range of ranges) {
		const start = parseDate(range.startDate)
		const end = parseDate(range.endDate)
		const dateStrings = enumerateDateStrings(start, end)

		for (const dateStr of dateStrings) {
			occupied.add(dateStr)
		}
	}

	return occupied
}

/**
 * 日付範囲を月境界で分割
 *
 * 例: 2024-01-25 〜 2024-03-05
 *   → [(2024-01-25 〜 2024-01-31), (2024-02-01 〜 2024-02-29), (2024-03-01 〜 2024-03-05)]
 */
export function splitByMonth(start: Date, end: Date): Array<{ start: Date; end: Date }> {
	const chunks: Array<{ start: Date; end: Date }> = []
	let chunkStart = new Date(start)

	while (chunkStart <= end) {
		// この月の末日を取得
		const monthEnd = getLastDayOfMonth(chunkStart.getFullYear(), chunkStart.getMonth() + 1)
		const chunkEnd = monthEnd < end ? monthEnd : new Date(end)

		chunks.push({
			start: new Date(chunkStart),
			end: chunkEnd,
		})

		// 翌月1日へ
		chunkStart = addDays(monthEnd, 1)
	}

	return chunks
}

/**
 * 日付範囲を最大日数で分割
 *
 * 例: 2024-01-01 〜 2024-03-10 を maxDays=30 で分割
 *   → [(2024-01-01 〜 2024-01-30), (2024-01-31 〜 2024-03-01), (2024-03-02 〜 2024-03-10)]
 */
export function splitByMaxDays(
	start: Date,
	end: Date,
	maxDays: number,
): Array<{ start: Date; end: Date }> {
	const chunks: Array<{ start: Date; end: Date }> = []
	let chunkStart = new Date(start)

	while (chunkStart <= end) {
		const chunkEnd = addDays(chunkStart, maxDays - 1)
		const actualEnd = chunkEnd < end ? chunkEnd : new Date(end)

		chunks.push({
			start: new Date(chunkStart),
			end: actualEnd,
		})

		chunkStart = addDays(actualEnd, 1)
	}

	return chunks
}

/**
 * 期間内に週末（土日）または祝日が含まれるかを判定
 *
 * 空き期間として有効とするための必須条件。
 */
export function containsWeekendOrHoliday(
	start: Date,
	end: Date,
	holidayDates: Set<string>,
): boolean {
	let current = new Date(start)

	while (current <= end) {
		if (isWeekend(current) || isHoliday(current, holidayDates)) {
			return true
		}
		current = addDays(current, 1)
	}

	return false
}

/**
 * 期間内に週末（土日）が含まれるかを判定
 */
export function containsWeekend(start: Date, end: Date): boolean {
	let current = new Date(start)

	while (current <= end) {
		if (isWeekend(current)) {
			return true
		}
		current = addDays(current, 1)
	}

	return false
}

/**
 * 期間内に祝日が含まれるかを判定
 */
export function containsHoliday(start: Date, end: Date, holidayDates: Set<string>): boolean {
	let current = new Date(start)

	while (current <= end) {
		if (isHoliday(current, holidayDates)) {
			return true
		}
		current = addDays(current, 1)
	}

	return false
}

/**
 * 期間の日数を計算（両端含む）
 */
export function calculateDays(range: DateRange): number {
	const start = parseDate(range.startDate)
	const end = parseDate(range.endDate)
	return daysBetween(start, end)
}
