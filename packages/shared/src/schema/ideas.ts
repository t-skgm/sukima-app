import { z } from 'zod'
import { dateSchema, idSchema, memoSchema, monthSchema, titleSchema, yearSchema } from './base'

// === ideas.trips.create ===
export const ideaTripCreateInputSchema = z.object({
	title: titleSchema,
	year: yearSchema,
	month: monthSchema,
	memo: memoSchema.optional(),
})

export const ideaTripOutputSchema = z.object({
	id: idSchema,
	title: titleSchema,
	year: yearSchema,
	month: monthSchema,
	memo: z.string(),
})

// === ideas.trips.update ===
export const ideaTripUpdateInputSchema = z.object({
	id: idSchema,
	title: titleSchema.optional(),
	year: yearSchema.optional(),
	month: monthSchema.optional(),
	memo: memoSchema.optional(),
})

// === ideas.trips.delete ===
export const ideaTripDeleteInputSchema = z.object({
	id: idSchema,
})

// === ideas.trips.confirm ===
export const ideaTripConfirmInputSchema = z
	.object({
		id: idSchema,
		startDate: dateSchema,
		endDate: dateSchema,
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: '終了日は開始日以降にしてください',
	})

export const ideaTripConfirmOutputSchema = z.object({
	event: z.object({
		id: z.number().int().positive(),
		eventType: z.literal('trip'),
		title: titleSchema,
		startDate: dateSchema,
		endDate: dateSchema,
		memo: z.string(),
	}),
})

// === ideas.monthly ===
export const ideaMonthlyCreateInputSchema = z.object({
	title: titleSchema,
	year: yearSchema,
	month: monthSchema,
	memo: memoSchema.optional(),
})

export const ideaMonthlyOutputSchema = z.object({
	id: idSchema,
	title: titleSchema,
	year: yearSchema,
	month: monthSchema,
	memo: z.string(),
})

export const ideaMonthlyUpdateInputSchema = z.object({
	id: idSchema,
	title: titleSchema.optional(),
	year: yearSchema.optional(),
	month: monthSchema.optional(),
	memo: memoSchema.optional(),
})

export const ideaMonthlyDeleteInputSchema = z.object({
	id: idSchema,
})

export const ideaMonthlyConfirmInputSchema = z
	.object({
		id: idSchema,
		startDate: dateSchema,
		endDate: dateSchema,
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: '終了日は開始日以降にしてください',
	})

export const ideaMonthlyConfirmOutputSchema = z.object({
	event: z.object({
		id: z.number().int().positive(),
		eventType: z.literal('other'),
		title: titleSchema,
		startDate: dateSchema,
		endDate: dateSchema,
		memo: z.string(),
	}),
})

// === 型エクスポート ===
export type IdeaTripCreateInput = z.infer<typeof ideaTripCreateInputSchema>
export type IdeaTripOutput = z.infer<typeof ideaTripOutputSchema>
export type IdeaTripUpdateInput = z.infer<typeof ideaTripUpdateInputSchema>
export type IdeaTripDeleteInput = z.infer<typeof ideaTripDeleteInputSchema>
export type IdeaTripConfirmInput = z.infer<typeof ideaTripConfirmInputSchema>
export type IdeaTripConfirmOutput = z.infer<typeof ideaTripConfirmOutputSchema>
export type IdeaMonthlyCreateInput = z.infer<typeof ideaMonthlyCreateInputSchema>
export type IdeaMonthlyOutput = z.infer<typeof ideaMonthlyOutputSchema>
export type IdeaMonthlyUpdateInput = z.infer<typeof ideaMonthlyUpdateInputSchema>
export type IdeaMonthlyDeleteInput = z.infer<typeof ideaMonthlyDeleteInputSchema>
export type IdeaMonthlyConfirmInput = z.infer<typeof ideaMonthlyConfirmInputSchema>
export type IdeaMonthlyConfirmOutput = z.infer<typeof ideaMonthlyConfirmOutputSchema>
