import { z } from 'zod'
import { dateSchema, eventTypeSchema, idSchema, monthSchema, titleSchema, yearSchema } from './base'

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

// === calendar.get ===
export const calendarGetInputSchema = z.object({})

export const calendarGetOutputSchema = z.object({
	items: z.array(calendarItemSchema),
	rangeStart: dateSchema,
	rangeEnd: dateSchema,
})

// === 型エクスポート ===
export type CalendarItem = z.infer<typeof calendarItemSchema>
export type CalendarGetInput = z.infer<typeof calendarGetInputSchema>
export type CalendarGetOutput = z.infer<typeof calendarGetOutputSchema>
