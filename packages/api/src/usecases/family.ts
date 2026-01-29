import type {
	FamilyCreateInput,
	FamilyCreateOutput,
	FamilyUpdateInput,
	FamilyUpdateOutput,
} from '@sukima/shared'
import { generateFamilyId } from '../services/id'
import type { Gateways } from './types'

export type CreateFamilyOptions = {
	appUrl: string
}

export const createFamily =
	(gateways: Gateways, options: CreateFamilyOptions) =>
	async (input: FamilyCreateInput): Promise<FamilyCreateOutput> => {
		const id = generateFamilyId()
		const now = new Date().toISOString()

		await gateways.db
			.prepare('INSERT INTO families (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)')
			.bind(id, input.name, now, now)
			.run()

		return {
			id,
			name: input.name,
			shareUrl: `${options.appUrl}/c/${id}`,
		}
	}

export const updateFamily =
	(gateways: Gateways) =>
	async (familyId: string, input: FamilyUpdateInput): Promise<FamilyUpdateOutput> => {
		const now = new Date().toISOString()

		await gateways.db
			.prepare('UPDATE families SET name = ?, updated_at = ? WHERE id = ?')
			.bind(input.name, now, familyId)
			.run()

		return {
			id: familyId,
			name: input.name,
		}
	}
