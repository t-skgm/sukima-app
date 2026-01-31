import {
	dateSchema,
	eventTypeSchema,
	familyIdSchema,
	idSchema,
	memoSchema,
	titleSchema,
} from '@sukima/shared'
import { z } from 'zod'
import { InternalError, NotFoundError } from './errors'
import type { Gateways } from './types'

// === List ===

export const listEventsInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
})
export type ListEventsInput = z.infer<typeof listEventsInputSchema>

// === Create ===

export const createEventInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
	}),
	data: z.object({
		eventType: eventTypeSchema,
		title: titleSchema,
		startDate: dateSchema,
		endDate: dateSchema,
		memo: memoSchema.optional(),
	}),
})
export type CreateEventInput = z.infer<typeof createEventInputSchema>

// === Update ===

export const updateEventInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
	data: z.object({
		eventType: eventTypeSchema.optional(),
		title: titleSchema.optional(),
		startDate: dateSchema.optional(),
		endDate: dateSchema.optional(),
		memo: memoSchema.optional(),
	}),
})
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>

// === Delete ===

export const deleteEventInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>

// === Output ===

export const eventOutputSchema = z.object({
	id: idSchema,
	eventType: eventTypeSchema,
	title: z.string(),
	startDate: dateSchema,
	endDate: dateSchema,
	memo: z.string(),
})
export type EventOutput = z.infer<typeof eventOutputSchema>

// === 内部型 ===

type EventRow = {
	id: number
	event_type: string
	title: string
	start_date: string
	end_date: string
	memo: string
}

// === ユースケース ===

export const listEvents =
	(gateways: Gateways) =>
	async (input: ListEventsInput): Promise<EventOutput[]> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, event_type, title, start_date, end_date, memo FROM events WHERE family_id = ? ORDER BY start_date ASC',
			)
			.bind(input.where.familyId)
			.all<EventRow>()

		return result.results.map((row) => ({
			id: row.id,
			eventType: row.event_type as EventOutput['eventType'],
			title: row.title,
			startDate: row.start_date,
			endDate: row.end_date,
			memo: row.memo,
		}))
	}

export const createEvent =
	(gateways: Gateways) =>
	async (input: CreateEventInput): Promise<EventOutput> => {
		const now = new Date().toISOString()

		// 記念日の場合、入力日付の年から3年分のレコードを作成
		if (input.data.eventType === 'anniversary') {
			return createAnniversaryEvents(gateways, input, now)
		}

		const result = await gateways.db
			.prepare(
				'INSERT INTO events (family_id, event_type, title, start_date, end_date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				input.data.eventType,
				input.data.title,
				input.data.startDate,
				input.data.endDate,
				input.data.memo ?? '',
				now,
				now,
			)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create event')
		}

		return {
			id: result.id,
			eventType: input.data.eventType,
			title: input.data.title,
			startDate: input.data.startDate,
			endDate: input.data.endDate,
			memo: input.data.memo ?? '',
		}
	}

/** 記念日を3年分作成し、最初の年のレコードを返す */
async function createAnniversaryEvents(
	gateways: Gateways,
	input: CreateEventInput,
	now: string,
): Promise<EventOutput> {
	const baseStartYear = Number.parseInt(input.data.startDate.slice(0, 4), 10)
	const memo = input.data.memo ?? ''

	const statements = Array.from({ length: 3 }, (_, i) => {
		const yearOffset = i
		const startDate = replaceYear(input.data.startDate, baseStartYear + yearOffset)
		const endDate = replaceYear(input.data.endDate, baseStartYear + yearOffset)

		return gateways.db
			.prepare(
				'INSERT INTO events (family_id, event_type, title, start_date, end_date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				input.where.familyId,
				input.data.eventType,
				input.data.title,
				startDate,
				endDate,
				memo,
				now,
				now,
			)
	})

	const results = await gateways.db.batch(statements)
	const firstResult = results[0]?.results?.[0] as { id: number } | undefined

	if (!firstResult) {
		throw new InternalError('Failed to create anniversary events')
	}

	return {
		id: firstResult.id,
		eventType: input.data.eventType,
		title: input.data.title,
		startDate: input.data.startDate,
		endDate: input.data.endDate,
		memo,
	}
}

function replaceYear(dateStr: string, year: number): string {
	return `${year}${dateStr.slice(4)}`
}

export const updateEvent =
	(gateways: Gateways) =>
	async (input: UpdateEventInput): Promise<EventOutput> => {
		const existing = await gateways.db
			.prepare(
				'SELECT event_type, title, start_date, end_date, memo FROM events WHERE id = ? AND family_id = ?',
			)
			.bind(input.where.id, input.where.familyId)
			.first<EventRow>()

		if (!existing) {
			throw new NotFoundError('Event not found')
		}

		const eventType = input.data.eventType ?? existing.event_type
		const title = input.data.title ?? existing.title
		const startDate = input.data.startDate ?? existing.start_date
		const endDate = input.data.endDate ?? existing.end_date
		const memo = input.data.memo ?? existing.memo
		const now = new Date().toISOString()

		await gateways.db
			.prepare(
				'UPDATE events SET event_type = ?, title = ?, start_date = ?, end_date = ?, memo = ?, updated_at = ? WHERE id = ? AND family_id = ?',
			)
			.bind(eventType, title, startDate, endDate, memo, now, input.where.id, input.where.familyId)
			.run()

		return {
			id: input.where.id,
			eventType: eventType as EventOutput['eventType'],
			title,
			startDate,
			endDate,
			memo,
		}
	}

export const deleteEvent =
	(gateways: Gateways) =>
	async (input: DeleteEventInput): Promise<void> => {
		const result = await gateways.db
			.prepare('DELETE FROM events WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('Event not found')
		}
	}
