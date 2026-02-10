import dayjs, { type Dayjs } from 'dayjs'

/** 祝日データ */
export type Holiday = {
	date: string // YYYY-MM-DD
	title: string
}

/** 指定範囲内の日本の祝日を返す */
export function getHolidaysForRange(rangeStart: string, rangeEnd: string): Holiday[] {
	const startYear = Number.parseInt(rangeStart.slice(0, 4), 10)
	const endYear = Number.parseInt(rangeEnd.slice(0, 4), 10)

	const holidays: Holiday[] = []
	for (let year = startYear; year <= endYear; year++) {
		holidays.push(...getHolidaysForYear(year))
	}

	return holidays.filter((h) => h.date >= rangeStart && h.date <= rangeEnd)
}

function getHolidaysForYear(year: number): Holiday[] {
	const baseHolidays = getBaseHolidays(year)
	baseHolidays.sort((a, b) => a.date.localeCompare(b.date))

	const withSubstitute = addSubstituteHolidays(baseHolidays)
	return addCitizensHolidays(withSubstitute)
}

/** 基本の祝日（固定日・ハッピーマンデー・春分秋分） */
function getBaseHolidays(year: number): Holiday[] {
	return [
		// 固定日
		{ date: fmtDate(year, 1, 1), title: '元日' },
		{ date: fmtDate(year, 2, 11), title: '建国記念の日' },
		{ date: fmtDate(year, 2, 23), title: '天皇誕生日' },
		{ date: fmtDate(year, 4, 29), title: '昭和の日' },
		{ date: fmtDate(year, 5, 3), title: '憲法記念日' },
		{ date: fmtDate(year, 5, 4), title: 'みどりの日' },
		{ date: fmtDate(year, 5, 5), title: 'こどもの日' },
		{ date: fmtDate(year, 8, 11), title: '山の日' },
		{ date: fmtDate(year, 11, 3), title: '文化の日' },
		{ date: fmtDate(year, 11, 23), title: '勤労感謝の日' },

		// ハッピーマンデー
		{ date: nthMonday(year, 1, 2), title: '成人の日' },
		{ date: nthMonday(year, 7, 3), title: '海の日' },
		{ date: nthMonday(year, 9, 3), title: '敬老の日' },
		{ date: nthMonday(year, 10, 2), title: 'スポーツの日' },

		// 春分・秋分
		{ date: fmtDate(year, 3, springEquinoxDay(year)), title: '春分の日' },
		{ date: fmtDate(year, 9, autumnEquinoxDay(year)), title: '秋分の日' },
	]
}

/** 振替休日を追加（祝日が日曜→翌平日が振替休日） */
function addSubstituteHolidays(holidays: Holiday[]): Holiday[] {
	const dateSet = new Set(holidays.map((h) => h.date))
	const result = [...holidays]

	for (const holiday of holidays) {
		const date = parseDate(holiday.date)
		if (date.day() === 0) {
			let sub = date.add(1, 'day')
			while (dateSet.has(formatDate(sub))) {
				sub = sub.add(1, 'day')
			}

			const subStr = formatDate(sub)
			result.push({ date: subStr, title: '振替休日' })
			dateSet.add(subStr)
		}
	}

	result.sort((a, b) => a.date.localeCompare(b.date))
	return result
}

/** 国民の休日を追加（2つの祝日に挟まれた平日） */
function addCitizensHolidays(holidays: Holiday[]): Holiday[] {
	const dateSet = new Set(holidays.map((h) => h.date))
	const result = [...holidays]

	for (const holiday of holidays) {
		const date = parseDate(holiday.date)
		const twoDaysLater = date.add(2, 'day')

		if (dateSet.has(formatDate(twoDaysLater))) {
			const between = date.add(1, 'day')
			const betweenStr = formatDate(between)

			if (!dateSet.has(betweenStr) && between.day() !== 0) {
				result.push({ date: betweenStr, title: '国民の休日' })
				dateSet.add(betweenStr)
			}
		}
	}

	result.sort((a, b) => a.date.localeCompare(b.date))
	return result
}

/** 春分の日の日付 (1980-2099年対応) */
function springEquinoxDay(year: number): number {
	return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

/** 秋分の日の日付 (1980-2099年対応) */
function autumnEquinoxDay(year: number): number {
	return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

/** 第n月曜日の日付文字列 */
function nthMonday(year: number, month: number, n: number): string {
	const firstDay = dayjs(new Date(year, month - 1, 1))
	const day = 1 + ((8 - firstDay.day()) % 7) + (n - 1) * 7
	return fmtDate(year, month, day)
}

function fmtDate(year: number, month: number, day: number): string {
	return dayjs(new Date(year, month - 1, day)).format('YYYY-MM-DD')
}

function parseDate(dateStr: string): Dayjs {
	const [y, m, d] = dateStr.split('-').map(Number)
	return dayjs(new Date(y, m - 1, d))
}

function formatDate(date: Dayjs): string {
	return date.format('YYYY-MM-DD')
}
