import {
	dateSchema,
	eventTypeSchema,
	familyIdSchema,
	idSchema,
	monthSchema,
	titleSchema,
	yearSchema,
} from '@sukima/shared'
import { z } from 'zod'
import { getHolidaysForRange } from './holidays'
import type { Gateways } from './types'
import { calculateVacantPeriods, type DateRange } from './vacant'

// === カレンダーアイテム（Union型）===

export const calendarItemSchema = z.discriminatedUnion('type', [
	// 確定予定
	z.object({
		type: z.literal('event'),
		id: idSchema,
		eventType: eventTypeSchema,
		title: titleSchema,
		startDate: dateSchema,
		endDate: dateSchema,
		memo: z.string(),
	}),
	// 旅行アイデア
	z.object({
		type: z.literal('idea_trip'),
		id: idSchema,
		title: titleSchema,
		year: yearSchema,
		month: monthSchema,
		memo: z.string(),
	}),
	// 月単位アイデア
	z.object({
		type: z.literal('idea_monthly'),
		id: idSchema,
		title: titleSchema,
		year: yearSchema,
		month: monthSchema,
		memo: z.string(),
	}),
	// ブロック期間
	z.object({
		type: z.literal('blocked'),
		id: idSchema,
		title: titleSchema,
		startDate: dateSchema,
		endDate: dateSchema,
		memo: z.string(),
	}),
	// 祝日
	z.object({
		type: z.literal('holiday'),
		title: z.string(),
		date: dateSchema,
	}),
	// 空き期間
	z.object({
		type: z.literal('vacant'),
		startDate: dateSchema,
		endDate: dateSchema,
		days: z.number().int().min(1),
		isLongWeekend: z.boolean(),
	}),
])
export type CalendarItem = z.infer<typeof calendarItemSchema>

// === Get ===

export const getCalendarInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		rangeStart: dateSchema,
	}),
})
export type GetCalendarInput = z.infer<typeof getCalendarInputSchema>

// === Output ===

export const calendarOutputSchema = z.object({
	items: z.array(calendarItemSchema),
	rangeStart: dateSchema,
	rangeEnd: dateSchema,
})
export type CalendarOutput = z.infer<typeof calendarOutputSchema>

// === 内部型 ===

type EventRow = {
	id: number
	event_type: string
	title: string
	start_date: string
	end_date: string
	memo: string
}

type IdeaRow = {
	id: number
	title: string
	year: number
	month: number
	memo: string
}

type BlockedPeriodRow = {
	id: number
	title: string
	start_date: string
	end_date: string
	memo: string
}

// === ユースケース ===

export const getCalendar =
	(gateways: Gateways) =>
	async (input: GetCalendarInput): Promise<CalendarOutput> => {
		const { familyId, rangeStart } = input.where
		const rangeEnd = calculateRangeEnd(rangeStart)

		// ideas用の年月範囲
		const startYear = Number.parseInt(rangeStart.slice(0, 4), 10)
		const startMonth = Number.parseInt(rangeStart.slice(5, 7), 10)
		const endYear = Number.parseInt(rangeEnd.slice(0, 4), 10)
		const endMonth = Number.parseInt(rangeEnd.slice(5, 7), 10)

		// 並列でデータ取得（範囲指定）
		const [eventsResult, tripIdeasResult, monthlyIdeasResult, blockedPeriodsResult] =
			await Promise.all([
				// events: 期間が重複するものを取得
				gateways.db
					.prepare(
						'SELECT id, event_type, title, start_date, end_date, memo FROM events WHERE family_id = ? AND start_date <= ? AND end_date >= ? ORDER BY start_date ASC',
					)
					.bind(familyId, rangeEnd, rangeStart)
					.all<EventRow>(),
				// ideas_trips: 年月が範囲内のものを取得
				gateways.db
					.prepare(
						'SELECT id, title, year, month, memo FROM ideas_trips WHERE family_id = ? AND (year > ? OR (year = ? AND month >= ?)) AND (year < ? OR (year = ? AND month <= ?)) ORDER BY year ASC, month ASC',
					)
					.bind(familyId, startYear, startYear, startMonth, endYear, endYear, endMonth)
					.all<IdeaRow>(),
				// ideas_monthly_events: 年月が範囲内のものを取得
				gateways.db
					.prepare(
						'SELECT id, title, year, month, memo FROM ideas_monthly_events WHERE family_id = ? AND (year > ? OR (year = ? AND month >= ?)) AND (year < ? OR (year = ? AND month <= ?)) ORDER BY year ASC, month ASC',
					)
					.bind(familyId, startYear, startYear, startMonth, endYear, endYear, endMonth)
					.all<IdeaRow>(),
				// blocked_periods: 期間が重複するものを取得
				gateways.db
					.prepare(
						'SELECT id, title, start_date, end_date, memo FROM blocked_periods WHERE family_id = ? AND start_date <= ? AND end_date >= ? ORDER BY start_date ASC',
					)
					.bind(familyId, rangeEnd, rangeStart)
					.all<BlockedPeriodRow>(),
			])

		const items: CalendarItem[] = []

		// イベント
		for (const row of eventsResult.results) {
			items.push({
				type: 'event',
				id: row.id,
				eventType: row.event_type as Extract<CalendarItem, { type: 'event' }>['eventType'],
				title: row.title,
				startDate: row.start_date,
				endDate: row.end_date,
				memo: row.memo,
			})
		}

		// 旅行アイデア
		for (const row of tripIdeasResult.results) {
			items.push({
				type: 'idea_trip',
				id: row.id,
				title: row.title,
				year: row.year,
				month: row.month,
				memo: row.memo,
			})
		}

		// 月単位アイデア
		for (const row of monthlyIdeasResult.results) {
			items.push({
				type: 'idea_monthly',
				id: row.id,
				title: row.title,
				year: row.year,
				month: row.month,
				memo: row.memo,
			})
		}

		// ブロック期間
		for (const row of blockedPeriodsResult.results) {
			items.push({
				type: 'blocked',
				id: row.id,
				title: row.title,
				startDate: row.start_date,
				endDate: row.end_date,
				memo: row.memo,
			})
		}

		// 祝日を追加
		const holidays = getHolidaysForRange(rangeStart, rangeEnd)
		const holidayDates = new Set(holidays.map((h) => h.date))
		for (const holiday of holidays) {
			items.push({
				type: 'holiday',
				title: holiday.title,
				date: holiday.date,
			})
		}

		// 空き期間を計算
		const occupiedRanges: DateRange[] = [
			...eventsResult.results.map((r) => ({
				startDate: r.start_date,
				endDate: r.end_date,
			})),
			...blockedPeriodsResult.results.map((r) => ({
				startDate: r.start_date,
				endDate: r.end_date,
			})),
		]
		const vacantPeriods = calculateVacantPeriods(occupiedRanges, holidayDates, rangeStart, rangeEnd)
		for (const period of vacantPeriods) {
			items.push({
				type: 'vacant',
				...period,
			})
		}

		// 日付順にソート
		items.sort((a, b) => getItemSortDate(a).localeCompare(getItemSortDate(b)))

		return {
			items,
			rangeStart,
			rangeEnd,
		}
	}

/** rangeStartから2年後の日付を算出する */
function calculateRangeEnd(rangeStart: string): string {
	const year = Number.parseInt(rangeStart.slice(0, 4), 10)
	return `${year + 2}${rangeStart.slice(4)}`
}

function getItemSortDate(item: CalendarItem): string {
	switch (item.type) {
		case 'event':
		case 'blocked':
		case 'vacant':
			return item.startDate
		case 'holiday':
			return item.date
		case 'idea_trip':
		case 'idea_monthly':
			return `${item.year}-${String(item.month).padStart(2, '0')}-01`
	}
}
