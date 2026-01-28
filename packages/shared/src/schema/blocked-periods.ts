import { z } from 'zod'
import { dateSchema, idSchema, memoSchema, titleSchema } from './base'

// === blockedPeriods.create ===
export const blockedPeriodCreateInputSchema = z
	.object({
		title: titleSchema,
		startDate: dateSchema,
		endDate: dateSchema,
		memo: memoSchema.optional(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: '終了日は開始日以降にしてください',
	})

export const blockedPeriodOutputSchema = z.object({
	id: idSchema,
	title: titleSchema,
	startDate: dateSchema,
	endDate: dateSchema,
	memo: z.string(),
})

// === blockedPeriods.update ===
export const blockedPeriodUpdateInputSchema = z
	.object({
		id: idSchema,
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

// === blockedPeriods.delete ===
export const blockedPeriodDeleteInputSchema = z.object({
	id: idSchema,
})

// === 型エクスポート ===
export type BlockedPeriodCreateInput = z.infer<typeof blockedPeriodCreateInputSchema>
export type BlockedPeriodOutput = z.infer<typeof blockedPeriodOutputSchema>
export type BlockedPeriodUpdateInput = z.infer<typeof blockedPeriodUpdateInputSchema>
export type BlockedPeriodDeleteInput = z.infer<typeof blockedPeriodDeleteInputSchema>
