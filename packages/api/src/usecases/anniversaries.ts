import {
	daySchema,
	familyIdSchema,
	idSchema,
	memoSchema,
	monthSchema,
	titleSchema,
} from '@sukima/shared'
import { z } from 'zod'
import { InternalError, NotFoundError } from './errors'
import type { Gateways } from './types'

// === List ===

export const listAnniversariesInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
})
export type ListAnniversariesInput = z.infer<typeof listAnniversariesInputSchema>

// === Create ===

export const createAnniversaryInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
	data: z.object({
		title: titleSchema,
		month: monthSchema,
		day: daySchema,
		memo: memoSchema.optional(),
	}),
})
export type CreateAnniversaryInput = z.infer<typeof createAnniversaryInputSchema>

// === Update ===

export const updateAnniversaryInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: z.object({
		title: titleSchema.optional(),
		month: monthSchema.optional(),
		day: daySchema.optional(),
		memo: memoSchema.optional(),
	}),
})
export type UpdateAnniversaryInput = z.infer<typeof updateAnniversaryInputSchema>

// === Delete ===

export const deleteAnniversaryInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type DeleteAnniversaryInput = z.infer<typeof deleteAnniversaryInputSchema>

// === Output ===

export const anniversaryOutputSchema = z.object({
	id: idSchema,
	title: z.string(),
	month: monthSchema,
	day: daySchema,
	memo: z.string(),
})
export type AnniversaryOutput = z.infer<typeof anniversaryOutputSchema>

// === 内部型 ===

type AnniversaryRow = {
	id: number
	title: string
	month: number
	day: number
	memo: string
}

// === ユースケース ===

export const listAnniversaries =
	(gateways: Gateways) =>
	async (input: ListAnniversariesInput): Promise<AnniversaryOutput[]> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, title, month, day, memo FROM anniversaries WHERE family_id = ? ORDER BY month ASC, day ASC',
			)
			.bind(input.where.familyId)
			.all<AnniversaryRow>()

		return result.results.map((row) => ({
			id: row.id,
			title: row.title,
			month: row.month,
			day: row.day,
			memo: row.memo,
		}))
	}

export const createAnniversary =
	(gateways: Gateways) =>
	async (input: CreateAnniversaryInput): Promise<AnniversaryOutput> => {
		const now = new Date().toISOString()

		const result = await gateways.db
			.prepare(
				'INSERT INTO anniversaries (family_id, title, month, day, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				input.data.title,
				input.data.month,
				input.data.day,
				input.data.memo ?? '',
				now,
				now,
			)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create anniversary')
		}

		return {
			id: result.id,
			title: input.data.title,
			month: input.data.month,
			day: input.data.day,
			memo: input.data.memo ?? '',
		}
	}

export const updateAnniversary =
	(gateways: Gateways) =>
	async (input: UpdateAnniversaryInput): Promise<AnniversaryOutput> => {
		const existing = await gateways.db
			.prepare('SELECT title, month, day, memo FROM anniversaries WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.first<AnniversaryRow>()

		if (!existing) {
			throw new NotFoundError('Anniversary not found')
		}

		const title = input.data.title ?? existing.title
		const month = input.data.month ?? existing.month
		const day = input.data.day ?? existing.day
		const memo = input.data.memo ?? existing.memo
		const now = new Date().toISOString()

		await gateways.db
			.prepare(
				'UPDATE anniversaries SET title = ?, month = ?, day = ?, memo = ?, updated_at = ? WHERE id = ? AND family_id = ?',
			)
			.bind(title, month, day, memo, now, input.where.id, input.where.familyId)
			.run()

		return {
			id: input.where.id,
			title,
			month,
			day,
			memo,
		}
	}

export const deleteAnniversary =
	(gateways: Gateways) =>
	async (input: DeleteAnniversaryInput): Promise<void> => {
		const result = await gateways.db
			.prepare('DELETE FROM anniversaries WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('Anniversary not found')
		}
	}
