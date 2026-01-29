import { z } from 'zod'
import { InternalError, NotFoundError } from './errors'
import {
	dateSchema,
	familyIdSchema,
	idSchema,
	memoSchema,
	monthSchema,
	titleSchema,
	yearSchema,
} from './schema'
import type { Gateways } from './types'

// ============================================================
// Trip Ideas（旅行アイデア）
// ============================================================

// === List ===

export const listTripIdeasInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
})
export type ListTripIdeasInput = z.infer<typeof listTripIdeasInputSchema>

// === Create ===

export const createTripIdeaDataSchema = z.object({
	title: titleSchema,
	year: yearSchema,
	month: monthSchema,
	memo: memoSchema.optional(),
})

export const createTripIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
	data: createTripIdeaDataSchema,
})
export type CreateTripIdeaInput = z.infer<typeof createTripIdeaInputSchema>

// === Update ===

export const updateTripIdeaDataSchema = z.object({
	title: titleSchema.optional(),
	year: yearSchema.optional(),
	month: monthSchema.optional(),
	memo: memoSchema.optional(),
})

export const updateTripIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: updateTripIdeaDataSchema,
})
export type UpdateTripIdeaInput = z.infer<typeof updateTripIdeaInputSchema>

// === Delete ===

export const deleteTripIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type DeleteTripIdeaInput = z.infer<typeof deleteTripIdeaInputSchema>

// === Confirm ===

export const dateRangeRefinement = {
	full: (data: { startDate: string; endDate: string }) => data.endDate >= data.startDate,
	message: '終了日は開始日以降にしてください',
}

export const confirmTripIdeaDataSchema = z.object({
	startDate: dateSchema,
	endDate: dateSchema,
})

export const confirmTripIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: confirmTripIdeaDataSchema.refine(dateRangeRefinement.full, {
		message: dateRangeRefinement.message,
	}),
})
export type ConfirmTripIdeaInput = z.infer<typeof confirmTripIdeaInputSchema>

// === Output ===

export const tripIdeaOutputSchema = z.object({
	id: idSchema,
	title: z.string(),
	year: yearSchema,
	month: monthSchema,
	memo: z.string(),
})
export type TripIdeaOutput = z.infer<typeof tripIdeaOutputSchema>

export const confirmTripIdeaOutputSchema = z.object({
	event: z.object({
		id: idSchema,
		eventType: z.literal('trip'),
		title: z.string(),
		startDate: dateSchema,
		endDate: dateSchema,
		memo: z.string(),
	}),
})
export type ConfirmTripIdeaOutput = z.infer<typeof confirmTripIdeaOutputSchema>

// === 内部型 ===

type IdeaRow = {
	id: number
	title: string
	year: number
	month: number
	memo: string
}

// === Trip Idea ユースケース ===

export const listTripIdeas =
	(gateways: Gateways) =>
	async (input: ListTripIdeasInput): Promise<TripIdeaOutput[]> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, title, year, month, memo FROM ideas_trips WHERE family_id = ? ORDER BY year ASC, month ASC',
			)
			.bind(input.where.familyId)
			.all<IdeaRow>()

		return result.results.map((row) => ({
			id: row.id,
			title: row.title,
			year: row.year,
			month: row.month,
			memo: row.memo,
		}))
	}

export const createTripIdea =
	(gateways: Gateways) =>
	async (input: CreateTripIdeaInput): Promise<TripIdeaOutput> => {
		const now = new Date().toISOString()

		const result = await gateways.db
			.prepare(
				'INSERT INTO ideas_trips (family_id, title, year, month, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				input.data.title,
				input.data.year,
				input.data.month,
				input.data.memo ?? '',
				now,
				now,
			)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create trip idea')
		}

		return {
			id: result.id,
			title: input.data.title,
			year: input.data.year,
			month: input.data.month,
			memo: input.data.memo ?? '',
		}
	}

export const updateTripIdea =
	(gateways: Gateways) =>
	async (input: UpdateTripIdeaInput): Promise<TripIdeaOutput> => {
		const existing = await gateways.db
			.prepare('SELECT title, year, month, memo FROM ideas_trips WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.first<IdeaRow>()

		if (!existing) {
			throw new NotFoundError('Trip idea not found')
		}

		const title = input.data.title ?? existing.title
		const year = input.data.year ?? existing.year
		const month = input.data.month ?? existing.month
		const memo = input.data.memo ?? existing.memo
		const now = new Date().toISOString()

		await gateways.db
			.prepare(
				'UPDATE ideas_trips SET title = ?, year = ?, month = ?, memo = ?, updated_at = ? WHERE id = ? AND family_id = ?',
			)
			.bind(title, year, month, memo, now, input.where.id, input.where.familyId)
			.run()

		return {
			id: input.where.id,
			title,
			year,
			month,
			memo,
		}
	}

export const deleteTripIdea =
	(gateways: Gateways) =>
	async (input: DeleteTripIdeaInput): Promise<void> => {
		const result = await gateways.db
			.prepare('DELETE FROM ideas_trips WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('Trip idea not found')
		}
	}

export const confirmTripIdea =
	(gateways: Gateways) =>
	async (input: ConfirmTripIdeaInput): Promise<ConfirmTripIdeaOutput> => {
		const existing = await gateways.db
			.prepare('SELECT title, memo FROM ideas_trips WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.first<{ title: string; memo: string }>()

		if (!existing) {
			throw new NotFoundError('Trip idea not found')
		}

		const now = new Date().toISOString()

		// Create event
		const eventResult = await gateways.db
			.prepare(
				'INSERT INTO events (family_id, event_type, title, start_date, end_date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				'trip',
				existing.title,
				input.data.startDate,
				input.data.endDate,
				existing.memo,
				now,
				now,
			)
			.first<{ id: number }>()

		if (!eventResult) {
			throw new InternalError('Failed to create event from trip idea')
		}

		// Delete the idea
		await gateways.db
			.prepare('DELETE FROM ideas_trips WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		return {
			event: {
				id: eventResult.id,
				eventType: 'trip',
				title: existing.title,
				startDate: input.data.startDate,
				endDate: input.data.endDate,
				memo: existing.memo,
			},
		}
	}

// ============================================================
// Monthly Ideas（月単位アイデア）
// ============================================================

// === List ===

export const listMonthlyIdeasInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
})
export type ListMonthlyIdeasInput = z.infer<typeof listMonthlyIdeasInputSchema>

// === Create ===

export const createMonthlyIdeaDataSchema = z.object({
	title: titleSchema,
	year: yearSchema,
	month: monthSchema,
	memo: memoSchema.optional(),
})

export const createMonthlyIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
	data: createMonthlyIdeaDataSchema,
})
export type CreateMonthlyIdeaInput = z.infer<typeof createMonthlyIdeaInputSchema>

// === Update ===

export const updateMonthlyIdeaDataSchema = z.object({
	title: titleSchema.optional(),
	year: yearSchema.optional(),
	month: monthSchema.optional(),
	memo: memoSchema.optional(),
})

export const updateMonthlyIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: updateMonthlyIdeaDataSchema,
})
export type UpdateMonthlyIdeaInput = z.infer<typeof updateMonthlyIdeaInputSchema>

// === Delete ===

export const deleteMonthlyIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type DeleteMonthlyIdeaInput = z.infer<typeof deleteMonthlyIdeaInputSchema>

// === Confirm ===

export const confirmMonthlyIdeaDataSchema = z.object({
	startDate: dateSchema,
	endDate: dateSchema,
})

export const confirmMonthlyIdeaInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: confirmMonthlyIdeaDataSchema.refine(dateRangeRefinement.full, {
		message: dateRangeRefinement.message,
	}),
})
export type ConfirmMonthlyIdeaInput = z.infer<typeof confirmMonthlyIdeaInputSchema>

// === Output ===

export const monthlyIdeaOutputSchema = z.object({
	id: idSchema,
	title: z.string(),
	year: yearSchema,
	month: monthSchema,
	memo: z.string(),
})
export type MonthlyIdeaOutput = z.infer<typeof monthlyIdeaOutputSchema>

export const confirmMonthlyIdeaOutputSchema = z.object({
	event: z.object({
		id: idSchema,
		eventType: z.literal('other'),
		title: z.string(),
		startDate: dateSchema,
		endDate: dateSchema,
		memo: z.string(),
	}),
})
export type ConfirmMonthlyIdeaOutput = z.infer<typeof confirmMonthlyIdeaOutputSchema>

// === Monthly Idea ユースケース ===

export const listMonthlyIdeas =
	(gateways: Gateways) =>
	async (input: ListMonthlyIdeasInput): Promise<MonthlyIdeaOutput[]> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, title, year, month, memo FROM ideas_monthly_events WHERE family_id = ? ORDER BY year ASC, month ASC',
			)
			.bind(input.where.familyId)
			.all<IdeaRow>()

		return result.results.map((row) => ({
			id: row.id,
			title: row.title,
			year: row.year,
			month: row.month,
			memo: row.memo,
		}))
	}

export const createMonthlyIdea =
	(gateways: Gateways) =>
	async (input: CreateMonthlyIdeaInput): Promise<MonthlyIdeaOutput> => {
		const now = new Date().toISOString()

		const result = await gateways.db
			.prepare(
				'INSERT INTO ideas_monthly_events (family_id, title, year, month, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				input.data.title,
				input.data.year,
				input.data.month,
				input.data.memo ?? '',
				now,
				now,
			)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create monthly idea')
		}

		return {
			id: result.id,
			title: input.data.title,
			year: input.data.year,
			month: input.data.month,
			memo: input.data.memo ?? '',
		}
	}

export const updateMonthlyIdea =
	(gateways: Gateways) =>
	async (input: UpdateMonthlyIdeaInput): Promise<MonthlyIdeaOutput> => {
		const existing = await gateways.db
			.prepare(
				'SELECT title, year, month, memo FROM ideas_monthly_events WHERE id = ? AND family_id = ?',
			)
			.bind(input.where.id, input.where.familyId)
			.first<IdeaRow>()

		if (!existing) {
			throw new NotFoundError('Monthly idea not found')
		}

		const title = input.data.title ?? existing.title
		const year = input.data.year ?? existing.year
		const month = input.data.month ?? existing.month
		const memo = input.data.memo ?? existing.memo
		const now = new Date().toISOString()

		await gateways.db
			.prepare(
				'UPDATE ideas_monthly_events SET title = ?, year = ?, month = ?, memo = ?, updated_at = ? WHERE id = ? AND family_id = ?',
			)
			.bind(title, year, month, memo, now, input.where.id, input.where.familyId)
			.run()

		return {
			id: input.where.id,
			title,
			year,
			month,
			memo,
		}
	}

export const deleteMonthlyIdea =
	(gateways: Gateways) =>
	async (input: DeleteMonthlyIdeaInput): Promise<void> => {
		const result = await gateways.db
			.prepare('DELETE FROM ideas_monthly_events WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('Monthly idea not found')
		}
	}

export const confirmMonthlyIdea =
	(gateways: Gateways) =>
	async (input: ConfirmMonthlyIdeaInput): Promise<ConfirmMonthlyIdeaOutput> => {
		const existing = await gateways.db
			.prepare('SELECT title, memo FROM ideas_monthly_events WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.first<{ title: string; memo: string }>()

		if (!existing) {
			throw new NotFoundError('Monthly idea not found')
		}

		const now = new Date().toISOString()

		// Create event
		const eventResult = await gateways.db
			.prepare(
				'INSERT INTO events (family_id, event_type, title, start_date, end_date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				'other',
				existing.title,
				input.data.startDate,
				input.data.endDate,
				existing.memo,
				now,
				now,
			)
			.first<{ id: number }>()

		if (!eventResult) {
			throw new InternalError('Failed to create event from monthly idea')
		}

		// Delete the idea
		await gateways.db
			.prepare('DELETE FROM ideas_monthly_events WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		return {
			event: {
				id: eventResult.id,
				eventType: 'other',
				title: existing.title,
				startDate: input.data.startDate,
				endDate: input.data.endDate,
				memo: existing.memo,
			},
		}
	}
