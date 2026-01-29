import { describe, expect, it } from 'vitest'
import {
	confirmMonthlyIdea,
	confirmTripIdea,
	createMonthlyIdea,
	createTripIdea,
	deleteMonthlyIdea,
	deleteTripIdea,
	listMonthlyIdeas,
	listTripIdeas,
	updateMonthlyIdea,
	updateTripIdea,
} from './ideas'
import { createMockDatabase } from './mock-database'

describe('ideas usecase', () => {
	const familyId = 'test-family-id-12345'

	describe('Trip Ideas', () => {
		describe('listTripIdeas', () => {
			it('空のリストを返す', async () => {
				const db = createMockDatabase({ ideas_trips: [] })
				const gateways = { db }

				const result = await listTripIdeas(gateways)({ where: { familyId } })

				expect(result).toEqual([])
			})

			it('家族IDに紐づく旅行アイデアのみ返す', async () => {
				const db = createMockDatabase({
					ideas_trips: [
						{ id: 1, family_id: familyId, title: '沖縄', year: 2025, month: 7, memo: '家族旅行' },
						{
							id: 2,
							family_id: 'other-family-id-12345',
							title: '北海道',
							year: 2025,
							month: 8,
							memo: '',
						},
					],
				})
				const gateways = { db }

				const result = await listTripIdeas(gateways)({ where: { familyId } })

				expect(result).toHaveLength(1)
				expect(result[0].title).toBe('沖縄')
			})
		})

		describe('createTripIdea', () => {
			it('旅行アイデアを作成してIDを返す', async () => {
				const db = createMockDatabase({ ideas_trips: [] })
				const gateways = { db }

				const result = await createTripIdea(gateways)({
					where: { familyId },
					data: {
						title: '京都旅行',
						year: 2025,
						month: 11,
						memo: '紅葉シーズン',
					},
				})

				expect(result.id).toBe(1)
				expect(result.title).toBe('京都旅行')
				expect(result.year).toBe(2025)
				expect(result.month).toBe(11)
				expect(db._tables.ideas_trips).toHaveLength(1)
			})
		})

		describe('updateTripIdea', () => {
			it('既存の旅行アイデアを更新する', async () => {
				const db = createMockDatabase({
					ideas_trips: [
						{ id: 1, family_id: familyId, title: '沖縄', year: 2025, month: 7, memo: '' },
					],
				})
				const gateways = { db }

				const result = await updateTripIdea(gateways)({
					where: { familyId, id: 1 },
					data: { title: '沖縄旅行', memo: '家族旅行' },
				})

				expect(result.title).toBe('沖縄旅行')
				expect(result.memo).toBe('家族旅行')
				expect(result.month).toBe(7) // 変更なし
			})

			it('存在しない旅行アイデアはエラー', async () => {
				const db = createMockDatabase({ ideas_trips: [] })
				const gateways = { db }

				await expect(
					updateTripIdea(gateways)({
						where: { familyId, id: 999 },
						data: { title: 'test' },
					}),
				).rejects.toThrow('Trip idea not found')
			})
		})

		describe('deleteTripIdea', () => {
			it('旅行アイデアを削除する', async () => {
				const db = createMockDatabase({
					ideas_trips: [
						{ id: 1, family_id: familyId, title: '沖縄', year: 2025, month: 7, memo: '' },
					],
				})
				const gateways = { db }

				await deleteTripIdea(gateways)({ where: { familyId, id: 1 } })

				expect(db._tables.ideas_trips).toHaveLength(0)
			})

			it('存在しない旅行アイデアはエラー', async () => {
				const db = createMockDatabase({ ideas_trips: [] })
				const gateways = { db }

				await expect(deleteTripIdea(gateways)({ where: { familyId, id: 999 } })).rejects.toThrow(
					'Trip idea not found',
				)
			})
		})

		describe('confirmTripIdea', () => {
			it('旅行アイデアを確定してイベントを作成する', async () => {
				const db = createMockDatabase({
					ideas_trips: [
						{ id: 1, family_id: familyId, title: '沖縄', year: 2025, month: 7, memo: '家族旅行' },
					],
					events: [],
				})
				const gateways = { db }

				const result = await confirmTripIdea(gateways)({
					where: { familyId, id: 1 },
					data: { startDate: '2025-07-20', endDate: '2025-07-25' },
				})

				expect(result.event.eventType).toBe('trip')
				expect(result.event.title).toBe('沖縄')
				expect(result.event.startDate).toBe('2025-07-20')
				expect(result.event.endDate).toBe('2025-07-25')
				expect(db._tables.ideas_trips).toHaveLength(0) // アイデアは削除される
				expect(db._tables.events).toHaveLength(1) // イベントが作成される
			})

			it('存在しない旅行アイデアはエラー', async () => {
				const db = createMockDatabase({ ideas_trips: [], events: [] })
				const gateways = { db }

				await expect(
					confirmTripIdea(gateways)({
						where: { familyId, id: 999 },
						data: { startDate: '2025-07-20', endDate: '2025-07-25' },
					}),
				).rejects.toThrow('Trip idea not found')
			})
		})
	})

	describe('Monthly Ideas', () => {
		describe('listMonthlyIdeas', () => {
			it('空のリストを返す', async () => {
				const db = createMockDatabase({ ideas_monthly_events: [] })
				const gateways = { db }

				const result = await listMonthlyIdeas(gateways)({ where: { familyId } })

				expect(result).toEqual([])
			})

			it('家族IDに紐づく月単位アイデアのみ返す', async () => {
				const db = createMockDatabase({
					ideas_monthly_events: [
						{
							id: 1,
							family_id: familyId,
							title: '誕生日会',
							year: 2025,
							month: 3,
							memo: '準備必要',
						},
						{
							id: 2,
							family_id: 'other-family-id-12345',
							title: '他の予定',
							year: 2025,
							month: 4,
							memo: '',
						},
					],
				})
				const gateways = { db }

				const result = await listMonthlyIdeas(gateways)({ where: { familyId } })

				expect(result).toHaveLength(1)
				expect(result[0].title).toBe('誕生日会')
			})
		})

		describe('createMonthlyIdea', () => {
			it('月単位アイデアを作成してIDを返す', async () => {
				const db = createMockDatabase({ ideas_monthly_events: [] })
				const gateways = { db }

				const result = await createMonthlyIdea(gateways)({
					where: { familyId },
					data: {
						title: '運動会',
						year: 2025,
						month: 10,
						memo: '学校行事',
					},
				})

				expect(result.id).toBe(1)
				expect(result.title).toBe('運動会')
				expect(result.year).toBe(2025)
				expect(result.month).toBe(10)
				expect(db._tables.ideas_monthly_events).toHaveLength(1)
			})
		})

		describe('updateMonthlyIdea', () => {
			it('既存の月単位アイデアを更新する', async () => {
				const db = createMockDatabase({
					ideas_monthly_events: [
						{ id: 1, family_id: familyId, title: '運動会', year: 2025, month: 10, memo: '' },
					],
				})
				const gateways = { db }

				const result = await updateMonthlyIdea(gateways)({
					where: { familyId, id: 1 },
					data: { memo: '雨天延期の可能性あり' },
				})

				expect(result.title).toBe('運動会')
				expect(result.memo).toBe('雨天延期の可能性あり')
			})

			it('存在しない月単位アイデアはエラー', async () => {
				const db = createMockDatabase({ ideas_monthly_events: [] })
				const gateways = { db }

				await expect(
					updateMonthlyIdea(gateways)({
						where: { familyId, id: 999 },
						data: { title: 'test' },
					}),
				).rejects.toThrow('Monthly idea not found')
			})
		})

		describe('deleteMonthlyIdea', () => {
			it('月単位アイデアを削除する', async () => {
				const db = createMockDatabase({
					ideas_monthly_events: [
						{ id: 1, family_id: familyId, title: '運動会', year: 2025, month: 10, memo: '' },
					],
				})
				const gateways = { db }

				await deleteMonthlyIdea(gateways)({ where: { familyId, id: 1 } })

				expect(db._tables.ideas_monthly_events).toHaveLength(0)
			})

			it('存在しない月単位アイデアはエラー', async () => {
				const db = createMockDatabase({ ideas_monthly_events: [] })
				const gateways = { db }

				await expect(deleteMonthlyIdea(gateways)({ where: { familyId, id: 999 } })).rejects.toThrow(
					'Monthly idea not found',
				)
			})
		})

		describe('confirmMonthlyIdea', () => {
			it('月単位アイデアを確定してイベントを作成する', async () => {
				const db = createMockDatabase({
					ideas_monthly_events: [
						{
							id: 1,
							family_id: familyId,
							title: '運動会',
							year: 2025,
							month: 10,
							memo: '学校行事',
						},
					],
					events: [],
				})
				const gateways = { db }

				const result = await confirmMonthlyIdea(gateways)({
					where: { familyId, id: 1 },
					data: { startDate: '2025-10-15', endDate: '2025-10-15' },
				})

				expect(result.event.eventType).toBe('other')
				expect(result.event.title).toBe('運動会')
				expect(result.event.startDate).toBe('2025-10-15')
				expect(db._tables.ideas_monthly_events).toHaveLength(0)
				expect(db._tables.events).toHaveLength(1)
			})

			it('存在しない月単位アイデアはエラー', async () => {
				const db = createMockDatabase({ ideas_monthly_events: [], events: [] })
				const gateways = { db }

				await expect(
					confirmMonthlyIdea(gateways)({
						where: { familyId, id: 999 },
						data: { startDate: '2025-10-15', endDate: '2025-10-15' },
					}),
				).rejects.toThrow('Monthly idea not found')
			})
		})
	})
})
