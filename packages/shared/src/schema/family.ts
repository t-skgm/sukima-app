import { z } from 'zod'
import { familyIdSchema, familyNameSchema, urlSchema } from './base'

// === family.create ===
export const familyCreateInputSchema = z.object({
	name: familyNameSchema,
})

export const familyCreateOutputSchema = z.object({
	id: familyIdSchema,
	name: z.string(),
	shareUrl: urlSchema,
})

// === family.update ===
export const familyUpdateInputSchema = z.object({
	name: familyNameSchema,
})

export const familyUpdateOutputSchema = z.object({
	id: familyIdSchema,
	name: z.string(),
})

// === 型エクスポート ===
export type FamilyCreateInput = z.infer<typeof familyCreateInputSchema>
export type FamilyCreateOutput = z.infer<typeof familyCreateOutputSchema>
export type FamilyUpdateInput = z.infer<typeof familyUpdateInputSchema>
export type FamilyUpdateOutput = z.infer<typeof familyUpdateOutputSchema>
