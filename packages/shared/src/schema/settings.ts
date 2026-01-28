import { z } from 'zod'
import { familyIdSchema, urlSchema } from './base'

// === settings.get ===
export const settingsGetInputSchema = z.object({})

export const settingsGetOutputSchema = z.object({
	family: z.object({
		id: familyIdSchema,
		name: z.string(),
		shareUrl: urlSchema,
	}),
})

// === 型エクスポート ===
export type SettingsGetInput = z.infer<typeof settingsGetInputSchema>
export type SettingsGetOutput = z.infer<typeof settingsGetOutputSchema>
