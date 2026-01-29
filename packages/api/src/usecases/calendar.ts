import { z } from 'zod'
import {
	dateSchema,
	eventTypeSchema,
	familyIdSchema,
	idSchema,
	monthSchema,
	titleSchema,
	yearSchema,
} from './schema'
import type { Gateways } from './types'

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
		const familyId = input.where.familyId

		// 表示範囲を計算（現在日から1年間）
		const now = new Date()
		const rangeStart = `${now.getFullYear()}-01-01`
		const rangeEnd = `${now.getFullYear() + 1}-12-31`

		// 並列でデータ取得
		const [eventsResult, tripIdeasResult, monthlyIdeasResult, blockedPeriodsResult] =
			await Promise.all([
				gateways.db
					.prepare(
						'SELECT id, event_type, title, start_date, end_date, memo FROM events WHERE family_id = ? ORDER BY start_date ASC',
					)
					.bind(familyId)
					.all<EventRow>(),
				gateways.db
					.prepare(
						'SELECT id, title, year, month, memo FROM ideas_trips WHERE family_id = ? ORDER BY year ASC, month ASC',
					)
					.bind(familyId)
					.all<IdeaRow>(),
				gateways.db
					.prepare(
						'SELECT id, title, year, month, memo FROM ideas_monthly_events WHERE family_id = ? ORDER BY year ASC, month ASC',
					)
					.bind(familyId)
					.all<IdeaRow>(),
				gateways.db
					.prepare(
						'SELECT id, title, start_date, end_date, memo FROM blocked_periods WHERE family_id = ? ORDER BY start_date ASC',
					)
					.bind(familyId)
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

		// TODO: 祝日データの取得（外部APIまたは静的データ）
		// TODO: 空き期間の計算

		return {
			items,
			rangeStart,
			rangeEnd,
		}
	}
