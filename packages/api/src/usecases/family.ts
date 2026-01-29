import { z } from 'zod'
import { generateFamilyId } from '../services/id'
import { familyIdSchema, familyNameSchema, urlSchema } from './schema'
import type { Gateways } from './types'

// === Create ===

export const createFamilyInputSchema = z.object({
	data: z.object({
		name: familyNameSchema,
	}),
})
export type CreateFamilyInput = z.infer<typeof createFamilyInputSchema>

export const createFamilyOutputSchema = z.object({
	id: familyIdSchema,
	name: z.string(),
	shareUrl: urlSchema,
})
export type CreateFamilyOutput = z.infer<typeof createFamilyOutputSchema>

// === Update ===

export const updateFamilyInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
	data: z.object({
		name: familyNameSchema,
	}),
})
export type UpdateFamilyInput = z.infer<typeof updateFamilyInputSchema>

export const updateFamilyOutputSchema = z.object({
	id: familyIdSchema,
	name: z.string(),
})
export type UpdateFamilyOutput = z.infer<typeof updateFamilyOutputSchema>

// === ユースケース ===

export type CreateFamilyOptions = {
	appUrl: string
}

export const createFamily =
	(gateways: Gateways, options: CreateFamilyOptions) =>
	async (input: CreateFamilyInput): Promise<CreateFamilyOutput> => {
		const id = generateFamilyId()
		const now = new Date().toISOString()

		await gateways.db
			.prepare('INSERT INTO families (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)')
			.bind(id, input.data.name, now, now)
			.run()

		return {
			id,
			name: input.data.name,
			shareUrl: `${options.appUrl}/c/${id}`,
		}
	}

export const updateFamily =
	(gateways: Gateways) =>
	async (input: UpdateFamilyInput): Promise<UpdateFamilyOutput> => {
		const now = new Date().toISOString()

		await gateways.db
			.prepare('UPDATE families SET name = ?, updated_at = ? WHERE id = ?')
			.bind(input.data.name, now, input.where.familyId)
			.run()

		return {
			id: input.where.familyId,
			name: input.data.name,
		}
	}
