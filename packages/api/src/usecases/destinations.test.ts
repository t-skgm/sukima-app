import { describe, expect, it } from 'vitest'
import {
	createDestination,
	deleteDestination,
	listDestinations,
	updateDestination,
} from './destinations'
import { createMockDatabase } from './mock-database'

describe('destinations usecase', () => {
	const familyId = 'test-family-id-12345'

	describe('listDestinations', () => {
		it('空のリストを返す', async () => {
			const db = createMockDatabase({ destinations: [] })
			const gateways = { db }

			const result = await listDestinations(gateways)({
				where: { familyId, rangeStart: '2026-01-01' },
			})

			expect(result.active).toEqual([])
			expect(result.done).toEqual([])
		})

		it('activeとdoneに分けて返す', async () => {
			const db = createMockDatabase({
				destinations: [
					{
						id: 1,
						family_id: familyId,
						name: '沖縄',
						memo: '海',
						required_days: 3,
						is_done: 0,
					},
					{
						id: 2,
						family_id: familyId,
						name: '北海道',
						memo: '行った',
						required_days: 4,
						is_done: 1,
					},
					{
						id: 3,
						family_id: 'other-family-id-12345',
						name: '京都',
						memo: '',
						required_days: 2,
						is_done: 0,
					},
				],
			})
			const gateways = { db }

			const result = await listDestinations(gateways)({
				where: { familyId, rangeStart: '2026-01-01' },
			})

			expect(result.active).toHaveLength(1)
			expect(result.active[0].name).toBe('沖縄')
			expect(result.done).toHaveLength(1)
			expect(result.done[0].name).toBe('北海道')
		})
	})

	describe('createDestination', () => {
		it('行き先を作成してIDを返す', async () => {
			const db = createMockDatabase({ destinations: [] })
			const gateways = { db }

			const result = await createDestination(gateways)({
				where: { familyId },
				data: {
					name: '九州旅行',
					requiredDays: 5,
					memo: '温泉巡り',
				},
			})

			expect(result.id).toBe(1)
			expect(result.name).toBe('九州旅行')
			expect(result.requiredDays).toBe(5)
			expect(result.isDone).toBe(false)
			expect(db._tables.destinations).toHaveLength(1)
		})
	})

	describe('updateDestination', () => {
		it('既存の行き先を更新する', async () => {
			const db = createMockDatabase({
				destinations: [
					{
						id: 1,
						family_id: familyId,
						name: '沖縄',
						memo: '',
						required_days: 3,
						is_done: 0,
					},
				],
			})
			const gateways = { db }

			const result = await updateDestination(gateways)({
				where: { familyId, id: 1 },
				data: { name: '沖縄離島巡り', requiredDays: 5 },
			})

			expect(result.name).toBe('沖縄離島巡り')
			expect(result.requiredDays).toBe(5)
			expect(result.isDone).toBe(false)
		})

		it('isDoneを更新できる', async () => {
			const db = createMockDatabase({
				destinations: [
					{
						id: 1,
						family_id: familyId,
						name: '沖縄',
						memo: '',
						required_days: 3,
						is_done: 0,
					},
				],
			})
			const gateways = { db }

			const result = await updateDestination(gateways)({
				where: { familyId, id: 1 },
				data: { isDone: true },
			})

			expect(result.isDone).toBe(true)
		})

		it('存在しない行き先はエラー', async () => {
			const db = createMockDatabase({ destinations: [] })
			const gateways = { db }

			await expect(
				updateDestination(gateways)({
					where: { familyId, id: 999 },
					data: { name: 'test' },
				}),
			).rejects.toThrow('Destination not found')
		})
	})

	describe('deleteDestination', () => {
		it('行き先を削除する', async () => {
			const db = createMockDatabase({
				destinations: [
					{
						id: 1,
						family_id: familyId,
						name: '沖縄',
						memo: '',
						required_days: 3,
						is_done: 0,
					},
				],
			})
			const gateways = { db }

			await deleteDestination(gateways)({ where: { familyId, id: 1 } })

			expect(db._tables.destinations).toHaveLength(0)
		})

		it('存在しない行き先はエラー', async () => {
			const db = createMockDatabase({ destinations: [] })
			const gateways = { db }

			await expect(deleteDestination(gateways)({ where: { familyId, id: 999 } })).rejects.toThrow(
				'Destination not found',
			)
		})
	})
})
