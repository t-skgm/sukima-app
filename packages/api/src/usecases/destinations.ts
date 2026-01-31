import {
	dateSchema,
	familyIdSchema,
	idSchema,
	memoSchema,
	requiredDaysSchema,
	titleSchema,
} from '@sukima/shared'
import { z } from 'zod'
import { InternalError, NotFoundError } from './errors'
import { getHolidaysForRange } from './holidays'
import type { Gateways } from './types'
import { calculateVacantPeriods, type DateRange, type VacantPeriod } from './vacant'

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
		const familyId = input.where.familyId

		// 表示範囲（カレンダーと同じ）
		const now = new Date()
		const rangeStart = `${now.getFullYear()}-01-01`
		const rangeEnd = `${now.getFullYear() + 1}-12-31`

		// 並列でデータ取得
		const [destinationsResult, eventsResult, blockedPeriodsResult] = await Promise.all([
			gateways.db
				.prepare(
					'SELECT id, name, memo, required_days, is_done FROM destinations WHERE family_id = ? ORDER BY created_at ASC',
				)
				.bind(familyId)
				.all<DestinationRow>(),
			gateways.db
				.prepare(
					'SELECT start_date, end_date FROM events WHERE family_id = ? AND start_date <= ? AND end_date >= ?',
				)
				.bind(familyId, rangeEnd, rangeStart)
				.all<{ start_date: string; end_date: string }>(),
			gateways.db
				.prepare(
					'SELECT start_date, end_date FROM blocked_periods WHERE family_id = ? AND start_date <= ? AND end_date >= ?',
				)
				.bind(familyId, rangeEnd, rangeStart)
				.all<{ start_date: string; end_date: string }>(),
		])

		// 空き期間を計算
		const holidays = getHolidaysForRange(rangeStart, rangeEnd)
		const holidayDates = new Set(holidays.map((h) => h.date))
		const occupiedRanges: DateRange[] = [
			...eventsResult.results.map((r) => ({
				startDate: r.start_date,
				endDate: r.end_date,
			})),
			...blockedPeriodsResult.results.map((r) => ({
				startDate: r.start_date,
				endDate: r.end_date,
			})),
		]
		const vacantPeriods = calculateVacantPeriods(occupiedRanges, holidayDates, rangeStart, rangeEnd)

		const destinations: DestinationOutput[] = destinationsResult.results.map((row) => ({
			id: row.id,
			name: row.name,
			memo: row.memo,
			requiredDays: row.required_days,
			isDone: row.is_done === 1,
			suggestions: row.is_done === 1 ? [] : buildSuggestions(row.required_days, vacantPeriods),
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

const MAX_SUGGESTIONS = 3

/** 空き期間から行き先の候補日程を生成する */
function buildSuggestions(requiredDays: number, vacantPeriods: VacantPeriod[]): Suggestion[] {
	return vacantPeriods
		.filter((p) => p.days >= requiredDays)
		.slice(0, MAX_SUGGESTIONS)
		.map((period) => {
			const start = toDate(period.startDate)
			const end = new Date(start)
			end.setDate(end.getDate() + requiredDays - 1)

			return {
				startDate: period.startDate,
				endDate: toDateStr(end),
				label: period.isLongWeekend ? '連休' : `${start.getMonth() + 1}月`,
			}
		})
}

function toDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d)
}

function toDateStr(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
