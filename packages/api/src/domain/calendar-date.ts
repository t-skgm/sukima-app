/**
 * カレンダー日付に関する純粋関数ユーティリティ
 *
 * 日付の解析、フォーマット、計算、週末・曜日判定などを提供する。
 * すべて純粋関数で、副作用なし、immutableを志向。
 */

/**
 * YYYY-MM-DD形式の文字列をDateオブジェクトに変換
 */
export function parseDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

/**
 * DateオブジェクトをYYYY-MM-DD形式の文字列に変換
 */
export function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * 2つの日付間の日数を計算（両端の日付を含む）
 *
 * 例: 2024-01-01 〜 2024-01-03 → 3日
 */
export function daysBetween(start: Date, end: Date): number {
	const millisPerDay = 86400 * 1000
	return Math.round((end.getTime() - start.getTime()) / millisPerDay) + 1
}

/**
 * 日付に指定した日数を加算（元の日付を変更せず新しいDateを返す）
 */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

/**
 * 指定した日付が週末（土日）かどうかを判定
 */
export function isWeekend(date: Date): boolean {
	const dayOfWeek = date.getDay()
	return dayOfWeek === 0 || dayOfWeek === 6
}

/**
 * 指定した日付が祝日かどうかを判定
 */
export function isHoliday(date: Date, holidayDates: Set<string>): boolean {
	return holidayDates.has(formatDate(date))
}

/**
 * 指定した月の最終日を取得
 */
export function getLastDayOfMonth(year: number, month: number): Date {
	// month: 1-12
	return new Date(year, month, 0)
}

/**
 * 開始日から終了日までの全日付を列挙（元の日付を変更せず、新しい配列を返す）
 */
export function enumerateDates(start: Date, end: Date): Date[] {
	const dates: Date[] = []
	let current = new Date(start)

	while (current <= end) {
		dates.push(new Date(current))
		current = addDays(current, 1)
	}

	return dates
}

/**
 * 開始日から終了日までの全日付をYYYY-MM-DD形式の文字列Setとして取得
 */
export function enumerateDateStrings(start: Date, end: Date): Set<string> {
	const dateStrings = new Set<string>()
	let current = new Date(start)

	while (current <= end) {
		dateStrings.add(formatDate(current))
		current = addDays(current, 1)
	}

	return dateStrings
}
