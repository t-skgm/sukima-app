import { z } from 'zod'
import { NotFoundError } from './errors'
import { familyIdSchema, urlSchema } from './schema'
import type { Gateways } from './types'

// === Get ===

export const getSettingsInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
})
export type GetSettingsInput = z.infer<typeof getSettingsInputSchema>

// === Output ===

export const settingsOutputSchema = z.object({
	family: z.object({
		id: familyIdSchema,
		name: z.string(),
		shareUrl: urlSchema,
	}),
})
export type SettingsOutput = z.infer<typeof settingsOutputSchema>

// === 内部型 ===

type FamilyRow = {
	id: string
	name: string
}

// === ユースケース ===

export type GetSettingsOptions = {
	appUrl: string
}

export const getSettings =
	(gateways: Gateways, options: GetSettingsOptions) =>
	async (input: GetSettingsInput): Promise<SettingsOutput> => {
		const family = await gateways.db
			.prepare('SELECT id, name FROM families WHERE id = ?')
			.bind(input.where.familyId)
			.first<FamilyRow>()

		if (!family) {
			throw new NotFoundError('Family not found')
		}

		return {
			family: {
				id: family.id,
				name: family.name,
				shareUrl: `${options.appUrl}/c/${family.id}`,
			},
		}
	}
