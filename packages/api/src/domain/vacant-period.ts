/**
 * 空き期間（VacantPeriod）に関する純粋関数ドメインロジック
 *
 * 空き期間の生成、連休判定、有効性チェックなどを提供する。
 * すべて純粋関数で、副作用なし、immutableを志向。
 */

import type { Dayjs } from 'dayjs'
import { daysBetween, formatDate, parseDate } from './calendar-date'
import { containsHoliday, containsWeekend, containsWeekendOrHoliday } from './date-range'

/** 空き期間 */
export type VacantPeriod = {
	startDate: string
	endDate: string
	days: number
	isLongWeekend: boolean
}

/**
 * 空き期間を生成するファクトリ関数
 *
 * 日数と連休判定を自動計算し、VacantPeriodオブジェクトを返す。
 */
export function createVacantPeriod(
	start: Dayjs,
	end: Dayjs,
	holidayDates: Set<string>,
): VacantPeriod {
	const days = daysBetween(start, end)
	const isLongWeekend = checkIsLongWeekend(start, end, holidayDates)

	return {
		startDate: formatDate(start),
		endDate: formatDate(end),
		days,
		isLongWeekend,
	}
}

/**
 * 空き期間として有効かどうかを判定
 *
 * 条件:
 * - 最小日数（minDays）以上
 * - 週末（土日）または祝日を含む
 */
export function isValidVacantPeriod(
	start: Dayjs,
	end: Dayjs,
	holidayDates: Set<string>,
	minDays: number,
): boolean {
	const days = daysBetween(start, end)
	return days >= minDays && containsWeekendOrHoliday(start, end, holidayDates)
}

/**
 * 連休判定: 3〜5日で週末（土日）AND 祝日を両方含む
 *
 * 注意: 6日以上の大型連休は含まない。
 * GW（ゴールデンウィーク）などの長期休暇は isLongWeekend: false となる。
 */
export function checkIsLongWeekend(start: Dayjs, end: Dayjs, holidayDates: Set<string>): boolean {
	const days = daysBetween(start, end)

	// 3〜5日の範囲外は連休としない
	if (days < 3 || days > 5) {
		return false
	}

	// 週末（土日）AND 祝日の両方を含む必要がある
	const hasWeekend = containsWeekend(start, end)
	const hasHoliday = containsHoliday(start, end, holidayDates)

	return hasWeekend && hasHoliday
}

/**
 * 空き期間をフィルタリングし、有効なもののみを返す
 *
 * 最小日数と週末・祝日の条件を満たす期間のみを抽出。
 */
export function filterValidVacantPeriods(
	periods: Array<{ start: Dayjs; end: Dayjs }>,
	holidayDates: Set<string>,
	minDays: number,
): VacantPeriod[] {
	return periods
		.filter((p) => isValidVacantPeriod(p.start, p.end, holidayDates, minDays))
		.map((p) => createVacantPeriod(p.start, p.end, holidayDates))
}

/**
 * 日付範囲文字列から空き期間を作成（テスト・デバッグ用）
 */
export function createVacantPeriodFromStrings(
	startDate: string,
	endDate: string,
	holidayDates: Set<string>,
): VacantPeriod {
	const start = parseDate(startDate)
	const end = parseDate(endDate)
	return createVacantPeriod(start, end, holidayDates)
}
