import type { EventCreateInput, EventOutput, EventUpdateInput } from '@sukima/shared'
import { InternalError, NotFoundError } from './errors'
import type { Gateways } from './types'

type EventRow = {
	id: number
	event_type: string
	title: string
	start_date: string
	end_date: string
	memo: string
}

export const listEvents =
	(gateways: Gateways) =>
	async (familyId: string): Promise<EventOutput[]> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, event_type, title, start_date, end_date, memo FROM events WHERE family_id = ? ORDER BY start_date ASC',
			)
			.bind(familyId)
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
	async (familyId: string, input: EventCreateInput): Promise<EventOutput> => {
		const now = new Date().toISOString()

		const result = await gateways.db
			.prepare(
				'INSERT INTO events (family_id, event_type, title, start_date, end_date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(
				familyId,
				input.eventType,
				input.title,
				input.startDate,
				input.endDate,
				input.memo ?? '',
				now,
				now,
			)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create event')
		}

		return {
			id: result.id,
			eventType: input.eventType,
			title: input.title,
			startDate: input.startDate,
			endDate: input.endDate,
			memo: input.memo ?? '',
		}
	}

export const updateEvent =
	(gateways: Gateways) =>
	async (familyId: string, input: EventUpdateInput): Promise<EventOutput> => {
		const existing = await gateways.db
			.prepare(
				'SELECT event_type, title, start_date, end_date, memo FROM events WHERE id = ? AND family_id = ?',
			)
			.bind(input.id, familyId)
			.first<EventRow>()

		if (!existing) {
			throw new NotFoundError('Event not found')
		}

		const eventType = input.eventType ?? existing.event_type
		const title = input.title ?? existing.title
		const startDate = input.startDate ?? existing.start_date
		const endDate = input.endDate ?? existing.end_date
		const memo = input.memo ?? existing.memo
		const now = new Date().toISOString()

		await gateways.db
			.prepare(
				'UPDATE events SET event_type = ?, title = ?, start_date = ?, end_date = ?, memo = ?, updated_at = ? WHERE id = ? AND family_id = ?',
			)
			.bind(eventType, title, startDate, endDate, memo, now, input.id, familyId)
			.run()

		return {
			id: input.id,
			eventType: eventType as EventOutput['eventType'],
			title,
			startDate,
			endDate,
			memo,
		}
	}

export const deleteEvent =
	(gateways: Gateways) =>
	async (familyId: string, id: number): Promise<void> => {
		const result = await gateways.db
			.prepare('DELETE FROM events WHERE id = ? AND family_id = ?')
			.bind(id, familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('Event not found')
		}
	}
