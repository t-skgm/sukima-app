import { describe, expect, it } from 'vitest'
import { getCalendar } from './calendar'
import { createMockDatabase } from './mock-database'

describe('calendar usecase', () => {
	const familyId = 'test-family-id-12345'

	describe('getCalendar', () => {
		it('ユーザーデータがない場合も祝日と空き期間を返す', async () => {
			const db = createMockDatabase({
				events: [],
				ideas_trips: [],
				ideas_monthly_events: [],
				blocked_periods: [],
			})
			const gateways = { db }

			const result = await getCalendar(gateways)({ where: { familyId } })

			expect(result.rangeStart).toBeDefined()
			expect(result.rangeEnd).toBeDefined()

			// ユーザー作成アイテムはない
			const userItems = result.items.filter(
				(i) =>
					i.type === 'event' ||
					i.type === 'blocked' ||
					i.type === 'idea_trip' ||
					i.type === 'idea_monthly',
			)
			expect(userItems).toHaveLength(0)

			// 祝日は存在する
			const holidays = result.items.filter((i) => i.type === 'holiday')
			expect(holidays.length).toBeGreaterThan(0)

			// 空き期間も存在する
			const vacant = result.items.filter((i) => i.type === 'vacant')
			expect(vacant.length).toBeGreaterThan(0)
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

			const events = result.items.filter((i) => i.type === 'event')
			expect(events).toHaveLength(1)
			if (events[0].type === 'event') {
				expect(events[0].title).toBe('沖縄旅行')
				expect(events[0].eventType).toBe('trip')
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

			const ideas = result.items.filter((i) => i.type === 'idea_trip')
			expect(ideas).toHaveLength(1)
			if (ideas[0].type === 'idea_trip') {
				expect(ideas[0].title).toBe('北海道')
				expect(ideas[0].year).toBe(2026)
				expect(ideas[0].month).toBe(8)
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

			const ideas = result.items.filter((i) => i.type === 'idea_monthly')
			expect(ideas).toHaveLength(1)
			if (ideas[0].type === 'idea_monthly') {
				expect(ideas[0].title).toBe('運動会')
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

			const blocked = result.items.filter((i) => i.type === 'blocked')
			expect(blocked).toHaveLength(1)
			if (blocked[0].type === 'blocked') {
				expect(blocked[0].title).toBe('年末年始')
			}
		})

		it('複数種類のアイテムを返す（祝日・空き期間含む）', async () => {
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

			const types = new Set(result.items.map((item) => item.type))
			expect(types).toContain('event')
			expect(types).toContain('idea_trip')
			expect(types).toContain('idea_monthly')
			expect(types).toContain('blocked')
			expect(types).toContain('holiday')
			expect(types).toContain('vacant')
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

			const events = result.items.filter((i) => i.type === 'event')
			expect(events).toHaveLength(1)
			if (events[0].type === 'event') {
				expect(events[0].title).toBe('自分の予定')
			}
		})

		it('アイテムが日付順にソートされている', async () => {
			const db = createMockDatabase({
				events: [
					{
						id: 1,
						family_id: familyId,
						event_type: 'trip',
						title: '夏旅行',
						start_date: '2026-08-10',
						end_date: '2026-08-15',
						memo: '',
					},
				],
				ideas_trips: [],
				ideas_monthly_events: [],
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

			// 最初のアイテムの日付がrangeStartに近い
			expect(result.items.length).toBeGreaterThan(0)

			// blockedがeventより前に来る（4月 < 8月）
			const blockedIdx = result.items.findIndex(
				(i) => i.type === 'blocked' && 'title' in i && i.title === 'GW',
			)
			const eventIdx = result.items.findIndex(
				(i) => i.type === 'event' && 'title' in i && i.title === '夏旅行',
			)
			expect(blockedIdx).toBeLessThan(eventIdx)
		})
	})
})
