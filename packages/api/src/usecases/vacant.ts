/**
 * 空き期間計算ユースケース
 *
 * 占有済み日程（予定・ブロック期間）と祝日から空き期間を計算する。
 * ドメインロジックは domain/ 層に抽出され、このファイルはオーケストレーション層として機能。
 */

import type { DateRange } from '../domain/date-range'
import {
	buildOccupiedSet,
	detectVacantGaps,
	MAX_VACANT_DAYS,
	splitByMaxDays,
	splitByMonth,
} from '../domain/date-range'
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
 * 1. 占有日付Setを構築
 * 2. 占有されていない連続期間（rawGaps）を検出
 * 3. 各ギャップを月境界で分割
 * 4. 各チャンクを最大30日に制限
 * 5. 最小日数・週末祝日条件でフィルタリング
 */
export function calculateVacantPeriods(
	occupiedRanges: DateRange[],
	holidayDates: Set<string>,
	rangeStart: string,
	rangeEnd: string,
	minDays = 3,
): VacantPeriod[] {
	// 1. 占有日付Setを構築
	const occupied = buildOccupiedSet(occupiedRanges)

	// 2. 占有されていない連続期間（rawGaps）を検出
	const rawGaps = detectVacantGaps(occupied, rangeStart, rangeEnd)

	// 3. 月境界で分割 → 最大日数で分割 → フィルタリング
	const allChunks = rawGaps.flatMap((gap) => {
		// 月境界で分割
		const monthChunks = splitByMonth(gap.start, gap.end)

		// 最大30日に制限
		return monthChunks.flatMap((chunk) => splitByMaxDays(chunk.start, chunk.end, MAX_VACANT_DAYS))
	})

	// 4. 最小日数・週末祝日条件でフィルタリング
	return filterValidVacantPeriods(allChunks, holidayDates, minDays)
}
