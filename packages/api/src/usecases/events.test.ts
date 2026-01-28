import { describe, expect, it } from 'vitest'
import { createEvent, deleteEvent, listEvents, updateEvent } from './events'
import { createMockDatabase } from './mock-database'

describe('events usecase', () => {
	const familyId = 'test-family-id-12345'

	describe('listEvents', () => {
		it('空のリストを返す', async () => {
			const db = createMockDatabase({ events: [] })
			const gateways = { db }

			const result = await listEvents(gateways)(familyId)

			expect(result).toEqual([])
		})

		it('家族IDに紐づくイベントのみ返す', async () => {
			const db = createMockDatabase({
				events: [
					{
						id: 1,
						family_id: familyId,
						event_type: 'trip',
						title: '旅行',
						start_date: '2025-03-01',
						end_date: '2025-03-03',
						memo: '',
					},
					{
						id: 2,
						family_id: 'other-family',
						event_type: 'trip',
						title: '他の家族',
						start_date: '2025-04-01',
						end_date: '2025-04-02',
						memo: '',
					},
				],
			})
			const gateways = { db }

			const result = await listEvents(gateways)(familyId)

			expect(result).toHaveLength(1)
			expect(result[0].title).toBe('旅行')
		})
	})

	describe('createEvent', () => {
		it('イベントを作成してIDを返す', async () => {
			const db = createMockDatabase({ events: [] })
			const gateways = { db }

			const result = await createEvent(gateways)(familyId, {
				eventType: 'trip',
				title: '沖縄旅行',
				startDate: '2025-07-01',
				endDate: '2025-07-05',
				memo: '家族旅行',
			})

			expect(result.id).toBe(1)
			expect(result.title).toBe('沖縄旅行')
			expect(result.eventType).toBe('trip')
			expect(db._tables.events).toHaveLength(1)
		})
	})

	describe('updateEvent', () => {
		it('既存のイベントを更新する', async () => {
			const db = createMockDatabase({
				events: [
					{
						id: 1,
						family_id: familyId,
						event_type: 'trip',
						title: '旅行',
						start_date: '2025-03-01',
						end_date: '2025-03-03',
						memo: '',
					},
				],
			})
			const gateways = { db }

			const result = await updateEvent(gateways)(familyId, {
				id: 1,
				title: '沖縄旅行',
			})

			expect(result.title).toBe('沖縄旅行')
			expect(result.eventType).toBe('trip') // 変更なし
		})

		it('存在しないイベントはエラー', async () => {
			const db = createMockDatabase({ events: [] })
			const gateways = { db }

			await expect(updateEvent(gateways)(familyId, { id: 999, title: 'test' })).rejects.toThrow(
				'Event not found',
			)
		})
	})

	describe('deleteEvent', () => {
		it('イベントを削除する', async () => {
			const db = createMockDatabase({
				events: [
					{
						id: 1,
						family_id: familyId,
						event_type: 'trip',
						title: '旅行',
						start_date: '2025-03-01',
						end_date: '2025-03-03',
						memo: '',
					},
				],
			})
			const gateways = { db }

			await deleteEvent(gateways)(familyId, 1)

			expect(db._tables.events).toHaveLength(0)
		})

		it('存在しないイベントはエラー', async () => {
			const db = createMockDatabase({ events: [] })
			const gateways = { db }

			await expect(deleteEvent(gateways)(familyId, 999)).rejects.toThrow('Event not found')
		})
	})
})
