/**
 * カレンダー日付に関する純粋関数ユーティリティ
 *
 * 日付の解析、フォーマット、計算、週末・曜日判定などを提供する。
 * すべて純粋関数で、副作用なし、immutableを志向。
 * for/whileループを避け、関数型アプローチを採用。
 * 内部的にdayjsを利用し、immutableな日付操作を実現。
 */

import dayjs, { type Dayjs } from 'dayjs'

export type { Dayjs } from 'dayjs'

/**
 * YYYY-MM-DD形式の文字列をDayjsオブジェクトに変換
 */
export function parseDate(dateStr: string): Dayjs {
	const [y, m, d] = dateStr.split('-').map(Number)
	return dayjs(new Date(y, m - 1, d))
}

/**
 * DayjsオブジェクトをYYYY-MM-DD形式の文字列に変換
 */
export function formatDate(date: Dayjs): string {
	return date.format('YYYY-MM-DD')
}

/**
 * 2つの日付間の日数を計算（両端の日付を含む）
 *
 * 例: 2024-01-01 〜 2024-01-03 → 3日
 */
export function daysBetween(start: Dayjs, end: Dayjs): number {
	return end.diff(start, 'day') + 1
}

/**
 * 日付に指定した日数を加算（dayjsはimmutableなので新しいDayjsを返す）
 */
export function addDays(date: Dayjs, days: number): Dayjs {
	return date.add(days, 'day')
}

/**
 * 指定した日付が週末（土日）かどうかを判定
 */
export function isWeekend(date: Dayjs): boolean {
	const dayOfWeek = date.day()
	return dayOfWeek === 0 || dayOfWeek === 6
}

/**
 * 指定した日付が祝日かどうかを判定
 */
export function isHoliday(date: Dayjs, holidayDates: Set<string>): boolean {
	return holidayDates.has(formatDate(date))
}

/**
 * 指定した月の最終日を取得
 */
export function getLastDayOfMonth(year: number, month: number): Dayjs {
	// month: 1-12
	return dayjs(new Date(year, month, 0))
}

/**
 * 開始日から終了日までの全日付を列挙（関数型アプローチ）
 */
export function enumerateDates(start: Dayjs, end: Dayjs): Dayjs[] {
	const days = daysBetween(start, end)
	if (days <= 0) {
		return []
	}

	return Array.from({ length: days }, (_, i) => addDays(start, i))
}

/**
 * 開始日から終了日までの全日付をYYYY-MM-DD形式の文字列Setとして取得
 */
export function enumerateDateStrings(start: Dayjs, end: Dayjs): Set<string> {
	const dates = enumerateDates(start, end)
	return new Set(dates.map(formatDate))
}
