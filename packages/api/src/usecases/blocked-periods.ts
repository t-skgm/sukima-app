import { dateSchema, familyIdSchema, idSchema, memoSchema, titleSchema } from '@sukima/shared'
import { z } from 'zod'
import { InternalError, NotFoundError } from './errors'
import type { Gateways } from './types'

// === List ===

export const listBlockedPeriodsInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
})
export type ListBlockedPeriodsInput = z.infer<typeof listBlockedPeriodsInputSchema>

// === Create ===

/** 日付範囲バリデーション（終了日 >= 開始日） */
export const dateRangeRefinement = {
	full: (data: { startDate: string; endDate: string }) => data.endDate >= data.startDate,
	partial: (data: { startDate?: string; endDate?: string }) => {
		if (data.startDate && data.endDate) {
			return data.endDate >= data.startDate
		}
		return true
	},
	message: '終了日は開始日以降にしてください',
}

/** Create用dataスキーマ（refineなし、router用にexport） */
export const createBlockedPeriodDataSchema = z.object({
	title: titleSchema,
	startDate: dateSchema,
	endDate: dateSchema,
	memo: memoSchema.optional(),
})

export const createBlockedPeriodInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
	data: createBlockedPeriodDataSchema.refine(dateRangeRefinement.full, {
		message: dateRangeRefinement.message,
	}),
})
export type CreateBlockedPeriodInput = z.infer<typeof createBlockedPeriodInputSchema>

// === Update ===

/** Update用dataスキーマ（refineなし、router用にexport） */
export const updateBlockedPeriodDataSchema = z.object({
	title: titleSchema.optional(),
	startDate: dateSchema.optional(),
	endDate: dateSchema.optional(),
	memo: memoSchema.optional(),
})

export const updateBlockedPeriodInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: updateBlockedPeriodDataSchema.refine(dateRangeRefinement.partial, {
		message: dateRangeRefinement.message,
	}),
})
export type UpdateBlockedPeriodInput = z.infer<typeof updateBlockedPeriodInputSchema>

// === Delete ===

export const deleteBlockedPeriodInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type DeleteBlockedPeriodInput = z.infer<typeof deleteBlockedPeriodInputSchema>

// === Output ===

export const blockedPeriodOutputSchema = z.object({
	id: idSchema,
	title: z.string(),
	startDate: dateSchema,
	endDate: dateSchema,
	memo: z.string(),
})
export type BlockedPeriodOutput = z.infer<typeof blockedPeriodOutputSchema>

// === 内部型 ===

type BlockedPeriodRow = {
	id: number
	title: string
	start_date: string
	end_date: string
	memo: string
}

// === ユースケース ===

export const listBlockedPeriods =
	(gateways: Gateways) =>
	async (input: ListBlockedPeriodsInput): Promise<BlockedPeriodOutput[]> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, title, start_date, end_date, memo FROM blocked_periods WHERE family_id = ? ORDER BY start_date ASC',
			)
			.bind(input.where.familyId)
			.all<BlockedPeriodRow>()

		return result.results.map((row) => ({
			id: row.id,
			title: row.title,
			startDate: row.start_date,
			endDate: row.end_date,
			memo: row.memo,
		}))
	}

export const createBlockedPeriod =
	(gateways: Gateways) =>
	async (input: CreateBlockedPeriodInput): Promise<BlockedPeriodOutput> => {
		const now = new Date().toISOString()

		const result = await gateways.db
			.prepare(
				'INSERT INTO blocked_periods (family_id, title, start_date, end_date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				input.data.title,
				input.data.startDate,
				input.data.endDate,
				input.data.memo ?? '',
				now,
				now,
			)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create blocked period')
		}

		return {
			id: result.id,
			title: input.data.title,
			startDate: input.data.startDate,
			endDate: input.data.endDate,
			memo: input.data.memo ?? '',
		}
	}

export const updateBlockedPeriod =
	(gateways: Gateways) =>
	async (input: UpdateBlockedPeriodInput): Promise<BlockedPeriodOutput> => {
		const existing = await gateways.db
			.prepare(
				'SELECT title, start_date, end_date, memo FROM blocked_periods WHERE id = ? AND family_id = ?',
			)
			.bind(input.where.id, input.where.familyId)
			.first<BlockedPeriodRow>()

		if (!existing) {
			throw new NotFoundError('Blocked period not found')
		}

		const title = input.data.title ?? existing.title
		const startDate = input.data.startDate ?? existing.start_date
		const endDate = input.data.endDate ?? existing.end_date
		const memo = input.data.memo ?? existing.memo
		const now = new Date().toISOString()

		await gateways.db
			.prepare(
				'UPDATE blocked_periods SET title = ?, start_date = ?, end_date = ?, memo = ?, updated_at = ? WHERE id = ? AND family_id = ?',
			)
			.bind(title, startDate, endDate, memo, now, input.where.id, input.where.familyId)
			.run()

		return {
			id: input.where.id,
			title,
			startDate,
			endDate,
			memo,
		}
	}

export const deleteBlockedPeriod =
	(gateways: Gateways) =>
	async (input: DeleteBlockedPeriodInput): Promise<void> => {
		const result = await gateways.db
			.prepare('DELETE FROM blocked_periods WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('Blocked period not found')
		}
	}
