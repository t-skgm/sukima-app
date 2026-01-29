import { z } from 'zod'
import { InternalError, NotFoundError } from './errors'
import {
	dateSchema,
	familyIdSchema,
	idSchema,
	memoSchema,
	requiredDaysSchema,
	titleSchema,
} from './schema'
import type { Gateways } from './types'

// === 日程提案スキーマ ===

export const suggestionSchema = z.object({
	startDate: dateSchema,
	endDate: dateSchema,
	label: z.string().max(50),
})
export type Suggestion = z.infer<typeof suggestionSchema>

// === List ===

export const listDestinationsInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
})
export type ListDestinationsInput = z.infer<typeof listDestinationsInputSchema>

// === Create ===

export const createDestinationDataSchema = z.object({
	name: titleSchema,
	memo: memoSchema.optional(),
	requiredDays: requiredDaysSchema,
})

export const createDestinationInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
	data: createDestinationDataSchema,
})
export type CreateDestinationInput = z.infer<typeof createDestinationInputSchema>

// === Update ===

export const updateDestinationDataSchema = z.object({
	name: titleSchema.optional(),
	memo: memoSchema.optional(),
	requiredDays: requiredDaysSchema.optional(),
	isDone: z.boolean().optional(),
})

export const updateDestinationInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: updateDestinationDataSchema,
})
export type UpdateDestinationInput = z.infer<typeof updateDestinationInputSchema>

// === Delete ===

export const deleteDestinationInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type DeleteDestinationInput = z.infer<typeof deleteDestinationInputSchema>

// === Output ===

export const destinationOutputSchema = z.object({
	id: idSchema,
	name: z.string(),
	memo: z.string(),
	requiredDays: requiredDaysSchema,
	isDone: z.boolean(),
	suggestions: z.array(suggestionSchema),
})
export type DestinationOutput = z.infer<typeof destinationOutputSchema>

export const listDestinationsOutputSchema = z.object({
	active: z.array(destinationOutputSchema),
	done: z.array(destinationOutputSchema),
})
export type ListDestinationsOutput = z.infer<typeof listDestinationsOutputSchema>

// === 内部型 ===

type DestinationRow = {
	id: number
	name: string
	memo: string
	required_days: number
	is_done: number // SQLite stores boolean as 0/1
}

// === ユースケース ===

export const listDestinations =
	(gateways: Gateways) =>
	async (input: ListDestinationsInput): Promise<ListDestinationsOutput> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, name, memo, required_days, is_done FROM destinations WHERE family_id = ? ORDER BY created_at ASC',
			)
			.bind(input.where.familyId)
			.all<DestinationRow>()

		const destinations: DestinationOutput[] = result.results.map((row) => ({
			id: row.id,
			name: row.name,
			memo: row.memo,
			requiredDays: row.required_days,
			isDone: row.is_done === 1,
			suggestions: [], // TODO: 空き期間から候補日程を計算
		}))

		return {
			active: destinations.filter((d) => !d.isDone),
			done: destinations.filter((d) => d.isDone),
		}
	}

export const createDestination =
	(gateways: Gateways) =>
	async (input: CreateDestinationInput): Promise<DestinationOutput> => {
		const now = new Date().toISOString()

		const result = await gateways.db
			.prepare(
				'INSERT INTO destinations (family_id, name, memo, required_days, is_done, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				input.data.name,
				input.data.memo ?? '',
				input.data.requiredDays,
				0, // is_done = false
				now,
				now,
			)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create destination')
		}

		return {
			id: result.id,
			name: input.data.name,
			memo: input.data.memo ?? '',
			requiredDays: input.data.requiredDays,
			isDone: false,
			suggestions: [],
		}
	}

export const updateDestination =
	(gateways: Gateways) =>
	async (input: UpdateDestinationInput): Promise<DestinationOutput> => {
		const existing = await gateways.db
			.prepare(
				'SELECT name, memo, required_days, is_done FROM destinations WHERE id = ? AND family_id = ?',
			)
			.bind(input.where.id, input.where.familyId)
			.first<DestinationRow>()

		if (!existing) {
			throw new NotFoundError('Destination not found')
		}

		const name = input.data.name ?? existing.name
		const memo = input.data.memo ?? existing.memo
		const requiredDays = input.data.requiredDays ?? existing.required_days
		const isDone = input.data.isDone !== undefined ? input.data.isDone : existing.is_done === 1
		const now = new Date().toISOString()

		await gateways.db
			.prepare(
				'UPDATE destinations SET name = ?, memo = ?, required_days = ?, is_done = ?, updated_at = ? WHERE id = ? AND family_id = ?',
			)
			.bind(name, memo, requiredDays, isDone ? 1 : 0, now, input.where.id, input.where.familyId)
			.run()

		return {
			id: input.where.id,
			name,
			memo,
			requiredDays,
			isDone,
			suggestions: [],
		}
	}

export const deleteDestination =
	(gateways: Gateways) =>
	async (input: DeleteDestinationInput): Promise<void> => {
		const result = await gateways.db
			.prepare('DELETE FROM destinations WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('Destination not found')
		}
	}
