import { describe, expect, it } from 'vitest'
import { getCalendar } from './calendar'
import { createMockDatabase } from './mock-database'

describe('calendar usecase', () => {
	const familyId = 'test-family-id-12345'

	describe('getCalendar', () => {
		it('空のカレンダーを返す', async () => {
			const db = createMockDatabase({
				events: [],
				ideas_trips: [],
				ideas_monthly_events: [],
				blocked_periods: [],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.items).toEqual([])
			expect(result.rangeStart).toBeDefined()
			expect(result.rangeEnd).toBeDefined()
		})

		it('イベントをカレンダーアイテムとして返す', async () => {
			const db = createMockDatabase({
				events: [
					{
						id: 1,
						family_id: familyId,
						event_type: 'trip',
						title: '沖縄旅行',
						start_date: '2026-07-20',
						end_date: '2026-07-25',
						memo: '家族旅行',
					},
				],
				ideas_trips: [],
				ideas_monthly_events: [],
				blocked_periods: [],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.items).toHaveLength(1)
			expect(result.items[0].type).toBe('event')
			if (result.items[0].type === 'event') {
				expect(result.items[0].title).toBe('沖縄旅行')
				expect(result.items[0].eventType).toBe('trip')
			}
		})

		it('旅行アイデアをカレンダーアイテムとして返す', async () => {
			const db = createMockDatabase({
				events: [],
				ideas_trips: [
					{
						id: 1,
						family_id: familyId,
						title: '北海道',
						year: 2026,
						month: 8,
						memo: 'スキー',
					},
				],
				ideas_monthly_events: [],
				blocked_periods: [],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.items).toHaveLength(1)
			expect(result.items[0].type).toBe('idea_trip')
			if (result.items[0].type === 'idea_trip') {
				expect(result.items[0].title).toBe('北海道')
				expect(result.items[0].year).toBe(2026)
				expect(result.items[0].month).toBe(8)
			}
		})

		it('月単位アイデアをカレンダーアイテムとして返す', async () => {
			const db = createMockDatabase({
				events: [],
				ideas_trips: [],
				ideas_monthly_events: [
					{
						id: 1,
						family_id: familyId,
						title: '運動会',
						year: 2026,
						month: 10,
						memo: '学校行事',
					},
				],
				blocked_periods: [],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.items).toHaveLength(1)
			expect(result.items[0].type).toBe('idea_monthly')
			if (result.items[0].type === 'idea_monthly') {
				expect(result.items[0].title).toBe('運動会')
			}
		})

		it('ブロック期間をカレンダーアイテムとして返す', async () => {
			const db = createMockDatabase({
				events: [],
				ideas_trips: [],
				ideas_monthly_events: [],
				blocked_periods: [
					{
						id: 1,
						family_id: familyId,
						title: '年末年始',
						start_date: '2026-12-28',
						end_date: '2027-01-03',
						memo: '帰省',
					},
				],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.items).toHaveLength(1)
			expect(result.items[0].type).toBe('blocked')
			if (result.items[0].type === 'blocked') {
				expect(result.items[0].title).toBe('年末年始')
			}
		})

		it('複数種類のアイテムを返す', async () => {
			const db = createMockDatabase({
				events: [
					{
						id: 1,
						family_id: familyId,
						event_type: 'trip',
						title: '沖縄',
						start_date: '2026-07-20',
						end_date: '2026-07-25',
						memo: '',
					},
				],
				ideas_trips: [
					{
						id: 1,
						family_id: familyId,
						title: '北海道',
						year: 2026,
						month: 8,
						memo: '',
					},
				],
				ideas_monthly_events: [
					{
						id: 1,
						family_id: familyId,
						title: '運動会',
						year: 2026,
						month: 10,
						memo: '',
					},
				],
				blocked_periods: [
					{
						id: 1,
						family_id: familyId,
						title: 'GW',
						start_date: '2026-04-29',
						end_date: '2026-05-06',
						memo: '',
					},
				],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.items).toHaveLength(4)
			const types = result.items.map((item) => item.type)
			expect(types).toContain('event')
			expect(types).toContain('idea_trip')
			expect(types).toContain('idea_monthly')
			expect(types).toContain('blocked')
		})

		it('他の家族のデータは含まない', async () => {
			const db = createMockDatabase({
				events: [
					{
						id: 1,
						family_id: familyId,
						event_type: 'trip',
						title: '自分の予定',
						start_date: '2026-07-20',
						end_date: '2026-07-25',
						memo: '',
					},
					{
						id: 2,
						family_id: 'other-family-id-12345',
						event_type: 'trip',
						title: '他の家族の予定',
						start_date: '2026-08-01',
						end_date: '2026-08-05',
						memo: '',
					},
				],
				ideas_trips: [],
				ideas_monthly_events: [],
				blocked_periods: [],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.items).toHaveLength(1)
			if (result.items[0].type === 'event') {
				expect(result.items[0].title).toBe('自分の予定')
			}
		})
	})
})
