import { z } from 'zod'
import { dateSchema, idSchema, memoSchema, requiredDaysSchema, titleSchema } from './base'

// === 日程提案 ===
export const suggestionSchema = z.object({
	startDate: dateSchema,
	endDate: dateSchema,
	label: z.string().max(50),
})

// === 行き先 ===
export const destinationSchema = z.object({
	id: idSchema,
	name: titleSchema,
	memo: z.string(),
	requiredDays: requiredDaysSchema,
	isDone: z.boolean(),
	suggestions: z.array(suggestionSchema),
})

// === destinations.list ===
export const destinationsListInputSchema = z.object({})

export const destinationsListOutputSchema = z.object({
	active: z.array(destinationSchema),
	done: z.array(destinationSchema),
})

// === destinations.create ===
export const destinationCreateInputSchema = z.object({
	name: titleSchema,
	memo: memoSchema.optional(),
	requiredDays: requiredDaysSchema,
})

// === destinations.update ===
export const destinationUpdateInputSchema = z.object({
	id: idSchema,
	name: titleSchema.optional(),
	memo: memoSchema.optional(),
	requiredDays: requiredDaysSchema.optional(),
	isDone: z.boolean().optional(),
})

// === destinations.delete ===
export const destinationDeleteInputSchema = z.object({
	id: idSchema,
})

// === 型エクスポート ===
export type Suggestion = z.infer<typeof suggestionSchema>
export type Destination = z.infer<typeof destinationSchema>
export type DestinationsListInput = z.infer<typeof destinationsListInputSchema>
export type DestinationsListOutput = z.infer<typeof destinationsListOutputSchema>
export type DestinationCreateInput = z.infer<typeof destinationCreateInputSchema>
export type DestinationUpdateInput = z.infer<typeof destinationUpdateInputSchema>
export type DestinationDeleteInput = z.infer<typeof destinationDeleteInputSchema>
