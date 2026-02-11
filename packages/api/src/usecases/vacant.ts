/**
 * 空き期間計算ユースケース
 *
 * 占有済み日程（予定・ブロック期間）と祝日から空き期間を計算する。
 * 平日は空き期間に含めず、連続する休日（土日・祝日）のみを空き期間として検出する。
 * ドメインロジックは domain/ 層に抽出され、このファイルはオーケストレーション層として機能。
 */

import type { DateRange } from '../domain/date-range'
import { buildOccupiedSet, buildWorkdaySet, detectVacantGaps } from '../domain/date-range'
import type { VacantPeriod } from '../domain/vacant-period'
import { filterValidVacantPeriods } from '../domain/vacant-period'

/**
 * 占有済み日程と祝日から空き期間を計算する。
 *
 * @param occupiedRanges - 予定・ブロック期間の配列
 * @param holidayDates - 祝日のSet（YYYY-MM-DD形式）
 * @param rangeStart - 検索範囲の開始日（YYYY-MM-DD）
 * @param rangeEnd - 検索範囲の終了日（YYYY-MM-DD）
 * @param minDays - 空き期間の最小日数（デフォルト: 3日）
 * @returns 空き期間の配列
 *
 * ## 処理フロー
 * 1. 占有日付Setを構築（予定・ブロック期間）
 * 2. 平日（休日でない日）も占有として扱い、連続する休日のみをギャップとして検出
 * 3. 最小日数でフィルタリング
 */
export function calculateVacantPeriods(
	occupiedRanges: DateRange[],
	holidayDates: Set<string>,
	rangeStart: string,
	rangeEnd: string,
	minDays = 3,
): VacantPeriod[] {
	// 1. 占有日付Setを構築（予定・ブロック期間）
	const occupied = buildOccupiedSet(occupiedRanges)

	// 2. 平日も占有として扱い、連続する休日のみをギャップとして検出
	const workdays = buildWorkdaySet(rangeStart, rangeEnd, holidayDates)
	const effectiveOccupied = new Set([...occupied, ...workdays])
	const consecutiveDaysOff = detectVacantGaps(effectiveOccupied, rangeStart, rangeEnd)

	// 3. 最小日数でフィルタリング
	return filterValidVacantPeriods(consecutiveDaysOff, holidayDates, minDays)
}
