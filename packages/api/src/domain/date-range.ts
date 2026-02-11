/**
 * 日付範囲（DateRange）に関する純粋関数ドメインロジック
 *
 * 占有日付セット生成、ギャップ検出、週末・祝日判定などを提供する。
 * すべて純粋関数で、副作用なし、immutableを志向。
 * for/whileループを避け、関数型アプローチを採用。
 */

import type { Dayjs } from 'dayjs'
import {
	daysBetween,
	enumerateDateStrings,
	enumerateDates,
	formatDate,
	isDayOff,
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
	return ranges.reduce((occupied, range) => {
		const start = parseDate(range.startDate)
		const end = parseDate(range.endDate)
		const dateStrings = enumerateDateStrings(start, end)

		// Setに追加（mutateだが、reduceのaccumulatorなので許容される）
		for (const dateStr of dateStrings) {
			occupied.add(dateStr)
		}
		return occupied
	}, new Set<string>())
}

/**
 * 期間内に週末（土日）が含まれるかを判定
 */
export function containsWeekend(start: Dayjs, end: Dayjs): boolean {
	const dates = enumerateDates(start, end)
	return dates.some(isWeekend)
}

/**
 * 期間内に祝日が含まれるかを判定
 */
export function containsHoliday(start: Dayjs, end: Dayjs, holidayDates: Set<string>): boolean {
	const dates = enumerateDates(start, end)
	return dates.some((date) => isHoliday(date, holidayDates))
}

/**
 * 期間の日数を計算（両端含む）
 */
export function calculateDays(range: DateRange): number {
	const start = parseDate(range.startDate)
	const end = parseDate(range.endDate)
	return daysBetween(start, end)
}

/**
 * 占有されていない連続期間（ギャップ）を検出
 *
 * 指定範囲内で占有Setに含まれない日付が連続する区間を見つける。
 * 関数型アプローチでimmutableに実装。
 *
 * @param occupied - 占有日付のSet（YYYY-MM-DD形式）
 * @param rangeStart - 検索範囲の開始日（YYYY-MM-DD）
 * @param rangeEnd - 検索範囲の終了日（YYYY-MM-DD）
 * @returns ギャップ期間の配列
 */
export function detectVacantGaps(
	occupied: Set<string>,
	rangeStart: string,
	rangeEnd: string,
): Array<{ start: Dayjs; end: Dayjs }> {
	const start = parseDate(rangeStart)
	const end = parseDate(rangeEnd)
	const allDates = enumerateDates(start, end)

	// 各日付が占有されているかをマッピング
	const isOccupiedList = allDates.map((date) => occupied.has(formatDate(date)))

	// 連続する空き日をグループ化（reduceでimmutableに）
	type GapAcc = {
		gaps: Array<{ start: Dayjs; end: Dayjs }>
		currentGapStart: Dayjs | null
	}

	const result = allDates.reduce<GapAcc>(
		(acc, date, index) => {
			const isOccupied = isOccupiedList[index]

			if (isOccupied) {
				// 占有日: 現在のギャップを閉じる
				if (acc.currentGapStart) {
					const prevDate = allDates[index - 1]
					acc.gaps.push({ start: acc.currentGapStart, end: prevDate })
					acc.currentGapStart = null
				}
				return acc
			}

			// 空き日: ギャップの開始または継続
			if (!acc.currentGapStart) {
				acc.currentGapStart = date
			}

			return acc
		},
		{ gaps: [], currentGapStart: null },
	)

	// 範囲末尾まで空き期間が続いていた場合
	if (result.currentGapStart) {
		return [...result.gaps, { start: result.currentGapStart, end }]
	}

	return result.gaps
}

/**
 * 指定範囲内の平日（休日でない日）のSetを構築
 *
 * 週末でも祝日でもない日付を集め、Setとして返す。
 * 空き期間を連続する休日のみに限定するために使用する。
 */
export function buildWorkdaySet(
	rangeStart: string,
	rangeEnd: string,
	holidayDates: Set<string>,
): Set<string> {
	const start = parseDate(rangeStart)
	const end = parseDate(rangeEnd)
	const dates = enumerateDates(start, end)

	return new Set(dates.filter((date) => !isDayOff(date, holidayDates)).map(formatDate))
}
