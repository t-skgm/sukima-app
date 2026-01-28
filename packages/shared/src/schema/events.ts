import { z } from 'zod'
import { dateSchema, eventTypeSchema, idSchema, memoSchema, titleSchema } from './base'

// === events.create ===
export const eventCreateInputSchema = z
	.object({
		eventType: eventTypeSchema,
		title: titleSchema,
		startDate: dateSchema,
		endDate: dateSchema,
		memo: memoSchema.optional(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: '終了日は開始日以降にしてください',
	})

export const eventOutputSchema = z.object({
	id: idSchema,
	eventType: eventTypeSchema,
	title: titleSchema,
	startDate: dateSchema,
	endDate: dateSchema,
	memo: z.string(),
})

// === events.update ===
export const eventUpdateInputSchema = z
	.object({
		id: idSchema,
		eventType: eventTypeSchema.optional(),
		title: titleSchema.optional(),
		startDate: dateSchema.optional(),
		endDate: dateSchema.optional(),
		memo: memoSchema.optional(),
	})
	.refine(
		(data) => {
			if (data.startDate && data.endDate) {
				return data.endDate >= data.startDate
			}
			return true
		},
		{ message: '終了日は開始日以降にしてください' },
	)

// === events.delete ===
export const eventDeleteInputSchema = z.object({
	id: idSchema,
})

export const deleteSuccessOutputSchema = z.object({
	success: z.literal(true),
})

// === 型エクスポート ===
export type EventCreateInput = z.infer<typeof eventCreateInputSchema>
export type EventOutput = z.infer<typeof eventOutputSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateInputSchema>
export type EventDeleteInput = z.infer<typeof eventDeleteInputSchema>
