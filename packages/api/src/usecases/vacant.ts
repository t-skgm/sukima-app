/**
 * 空き期間計算ユースケース
 *
 * 占有済み日程（予定・ブロック期間）と祝日から空き期間を計算する。
 * ドメインロジックは domain/ 層に抽出され、このファイルはオーケストレーション層として機能。
 */

import { addDays, formatDate, parseDate } from '../domain/calendar-date'
import type { DateRange } from '../domain/date-range'
import { buildOccupiedSet, splitByMaxDays, splitByMonth } from '../domain/date-range'
import type { VacantPeriod } from '../domain/vacant-period'
import { createVacantPeriod, isValidVacantPeriod } from '../domain/vacant-period'

// 型を再エクスポート（互換性のため）
export type { DateRange, VacantPeriod }

/** 空き期間の最大日数（月境界分割後に適用） */
const MAX_VACANT_DAYS = 30

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
	const periods: VacantPeriod[] = []

	for (const gap of rawGaps) {
		// 月境界で分割
		const monthChunks = splitByMonth(gap.start, gap.end)

		for (const chunk of monthChunks) {
			// 最大30日に制限
			const dayChunks = splitByMaxDays(chunk.start, chunk.end, MAX_VACANT_DAYS)

			for (const dayChunk of dayChunks) {
				// 最小日数・週末祝日条件でフィルタリング
				if (isValidVacantPeriod(dayChunk.start, dayChunk.end, holidayDates, minDays)) {
					periods.push(createVacantPeriod(dayChunk.start, dayChunk.end, holidayDates))
				}
			}
		}
	}

	return periods
}

/**
 * 占有されていない連続期間（ギャップ）を検出
 *
 * 指定範囲内で占有Setに含まれない日付が連続する区間を見つける。
 *
 * @param occupied - 占有日付のSet（YYYY-MM-DD形式）
 * @param rangeStart - 検索範囲の開始日（YYYY-MM-DD）
 * @param rangeEnd - 検索範囲の終了日（YYYY-MM-DD）
 * @returns ギャップ期間の配列
 */
function detectVacantGaps(
	occupied: Set<string>,
	rangeStart: string,
	rangeEnd: string,
): Array<{ start: Date; end: Date }> {
	const gaps: Array<{ start: Date; end: Date }> = []
	const current = parseDate(rangeStart)
	const end = parseDate(rangeEnd)
	let periodStart: Date | null = null

	while (current <= end) {
		const dateStr = formatDate(current)

		if (!occupied.has(dateStr)) {
			// 空き日：期間の開始または継続
			if (!periodStart) {
				periodStart = new Date(current)
			}
		} else {
			// 占有日：期間が終了
			if (periodStart) {
				// 前日までが空き期間
				const periodEnd = addDays(current, -1)
				gaps.push({ start: periodStart, end: periodEnd })
				periodStart = null
			}
		}

		// 翌日へ
		current.setDate(current.getDate() + 1)
	}

	// 範囲末尾まで空き期間が続いていた場合
	if (periodStart) {
		gaps.push({ start: periodStart, end: parseDate(rangeEnd) })
	}

	return gaps
}
