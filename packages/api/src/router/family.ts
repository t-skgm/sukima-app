import {
	familyCreateInputSchema,
	familyCreateOutputSchema,
	familyUpdateInputSchema,
	familyUpdateOutputSchema,
} from '@sukima/shared'
import { generateFamilyId } from '../services/id'
import { pub } from './index'

export const familyRouter = {
	create: pub
		.input(familyCreateInputSchema)
		.output(familyCreateOutputSchema)
		.handler(async ({ input, context }) => {
			const id = generateFamilyId()
			const now = new Date().toISOString()

			await context.env.DB.prepare(
				'INSERT INTO families (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
			)
				.bind(id, input.name, now, now)
				.run()

			return {
				id,
				name: input.name,
				shareUrl: `${context.env.APP_URL}/c/${id}`,
			}
		}),

	update: pub
		.input(familyUpdateInputSchema)
		.output(familyUpdateOutputSchema)
		.handler(async ({ input, context }) => {
			const familyId = context.familyId
			if (!familyId) {
				throw new Error('Family ID is required')
			}

			const now = new Date().toISOString()

			await context.env.DB.prepare('UPDATE families SET name = ?, updated_at = ? WHERE id = ?')
				.bind(input.name, now, familyId)
				.run()

			return {
				id: familyId,
				name: input.name,
			}
		}),
}
