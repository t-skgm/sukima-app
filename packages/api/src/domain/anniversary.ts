/**
 * 記念日の年展開に関する純粋関数ドメインロジック
 *
 * 月日のみ保存された記念日を、表示範囲内の各年に展開する。
 * すべて純粋関数で、副作用なし、immutableを志向。
 */

import dayjs from 'dayjs'

/** 記念日の月日データ */
export type AnniversaryEntry = {
	id: number
	title: string
	month: number
	day: number
	memo: string
}

/** 展開済み記念日（特定の年の日付付き） */
export type ExpandedAnniversary = AnniversaryEntry & {
	date: string
}

/**
 * 記念日を表示範囲内の各年に展開する
 *
 * 記念日は月日のみ保存されているため、rangeStart〜rangeEndの各年について
 * 該当する日付を生成し、範囲内のもののみ返す。
 *
 * @param entries - 月日のみの記念日データ
 * @param rangeStart - 表示範囲の開始日（YYYY-MM-DD）
 * @param rangeEnd - 表示範囲の終了日（YYYY-MM-DD）
 * @returns 展開済みの記念日配列
 */
export function expandAnniversaries(
	entries: readonly AnniversaryEntry[],
	rangeStart: string,
	rangeEnd: string,
): ExpandedAnniversary[] {
	const startYear = Number.parseInt(rangeStart.slice(0, 4), 10)
	const endYear = Number.parseInt(rangeEnd.slice(0, 4), 10)
	const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

	return entries.flatMap((entry) =>
		years
			.map((year) => ({
				...entry,
				date: dayjs(new Date(year, entry.month - 1, entry.day)).format('YYYY-MM-DD'),
			}))
			.filter(({ date }) => date >= rangeStart && date <= rangeEnd),
	)
}
