import { describe, expect, it } from 'vitest'
import {
	createBlockedPeriod,
	deleteBlockedPeriod,
	listBlockedPeriods,
	updateBlockedPeriod,
} from './blocked-periods'
import { createMockDatabase } from './mock-database'

describe('blocked-periods usecase', () => {
	const familyId = 'test-family-id-12345'

	describe('listBlockedPeriods', () => {
		it('空のリストを返す', async () => {
			const db = createMockDatabase({ blocked_periods: [] })
			const gateways = { db }

			const result = await listBlockedPeriods(gateways)({ where: { familyId } })

			expect(result).toEqual([])
		})

		it('家族IDに紐づくブロック期間のみ返す', async () => {
			const db = createMockDatabase({
				blocked_periods: [
					{
						id: 1,
						family_id: familyId,
						title: '年末年始',
						start_date: '2025-12-28',
						end_date: '2026-01-03',
						memo: '帰省',
					},
					{
						id: 2,
						family_id: 'other-family-id-12345',
						title: '他の家族',
						start_date: '2025-04-01',
						end_date: '2025-04-02',
						memo: '',
					},
				],
			})
			const gateways = { db }

			const result = await listBlockedPeriods(gateways)({ where: { familyId } })

			expect(result).toHaveLength(1)
			expect(result[0].title).toBe('年末年始')
		})
	})

	describe('createBlockedPeriod', () => {
		it('ブロック期間を作成してIDを返す', async () => {
			const db = createMockDatabase({ blocked_periods: [] })
			const gateways = { db }

			const result = await createBlockedPeriod(gateways)({
				where: { familyId },
				data: {
					title: 'GW',
					startDate: '2025-04-29',
					endDate: '2025-05-06',
					memo: '連休',
				},
			})

			expect(result.id).toBe(1)
			expect(result.title).toBe('GW')
			expect(result.startDate).toBe('2025-04-29')
			expect(result.endDate).toBe('2025-05-06')
			expect(db._tables.blocked_periods).toHaveLength(1)
		})
	})

	describe('updateBlockedPeriod', () => {
		it('既存のブロック期間を更新する', async () => {
			const db = createMockDatabase({
				blocked_periods: [
					{
						id: 1,
						family_id: familyId,
						title: '年末年始',
						start_date: '2025-12-28',
						end_date: '2026-01-03',
						memo: '',
					},
				],
			})
			const gateways = { db }

			const result = await updateBlockedPeriod(gateways)({
				where: { familyId, id: 1 },
				data: { title: '年末年始休暇', memo: '帰省予定' },
			})

			expect(result.title).toBe('年末年始休暇')
			expect(result.memo).toBe('帰省予定')
			expect(result.startDate).toBe('2025-12-28') // 変更なし
		})

		it('存在しないブロック期間はエラー', async () => {
			const db = createMockDatabase({ blocked_periods: [] })
			const gateways = { db }

			await expect(
				updateBlockedPeriod(gateways)({
					where: { familyId, id: 999 },
					data: { title: 'test' },
				}),
			).rejects.toThrow('Blocked period not found')
		})
	})

	describe('deleteBlockedPeriod', () => {
		it('ブロック期間を削除する', async () => {
			const db = createMockDatabase({
				blocked_periods: [
					{
						id: 1,
						family_id: familyId,
						title: 'GW',
						start_date: '2025-04-29',
						end_date: '2025-05-06',
						memo: '',
					},
				],
			})
			const gateways = { db }

			await deleteBlockedPeriod(gateways)({ where: { familyId, id: 1 } })

			expect(db._tables.blocked_periods).toHaveLength(0)
		})

		it('存在しないブロック期間はエラー', async () => {
			const db = createMockDatabase({ blocked_periods: [] })
			const gateways = { db }

			await expect(deleteBlockedPeriod(gateways)({ where: { familyId, id: 999 } })).rejects.toThrow(
				'Blocked period not found',
			)
		})
	})
})
