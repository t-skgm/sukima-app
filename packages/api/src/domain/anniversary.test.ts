import { describe, expect, it } from 'vitest'
import { type AnniversaryEntry, expandAnniversaries } from './anniversary'

describe('expandAnniversaries', () => {
	const entry: AnniversaryEntry = {
		id: 1,
		title: '誕生日',
		month: 3,
		day: 15,
		memo: '',
	}

	it('表示範囲内の各年に展開される', () => {
		const result = expandAnniversaries([entry], '2024-01-01', '2026-12-31')

		expect(result).toHaveLength(3)
		expect(result.map((r) => r.date)).toEqual(['2024-03-15', '2025-03-15', '2026-03-15'])
	})

	it('範囲外の年は含まれない', () => {
		const result = expandAnniversaries([entry], '2024-04-01', '2025-03-14')

		expect(result).toHaveLength(0)
	})

	it('範囲の境界日が含まれる', () => {
		const result = expandAnniversaries([entry], '2024-03-15', '2025-03-15')

		expect(result).toHaveLength(2)
		expect(result.map((r) => r.date)).toEqual(['2024-03-15', '2025-03-15'])
	})

	it('複数の記念日が正しく展開される', () => {
		const entries: AnniversaryEntry[] = [
			{ id: 1, title: '誕生日', month: 1, day: 10, memo: '' },
			{ id: 2, title: '結婚記念日', month: 12, day: 25, memo: '' },
		]

		const result = expandAnniversaries(entries, '2024-01-01', '2024-12-31')

		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ id: 1, date: '2024-01-10' })
		expect(result[1]).toMatchObject({ id: 2, date: '2024-12-25' })
	})

	it('空の入力には空配列を返す', () => {
		const result = expandAnniversaries([], '2024-01-01', '2025-12-31')
		expect(result).toEqual([])
	})

	it('展開結果にidやtitle等の元データが含まれる', () => {
		const result = expandAnniversaries(
			[{ id: 42, title: '記念日', month: 7, day: 4, memo: 'メモ' }],
			'2024-01-01',
			'2024-12-31',
		)

		expect(result[0]).toMatchObject({
			id: 42,
			title: '記念日',
			date: '2024-07-04',
			month: 7,
			day: 4,
			memo: 'メモ',
		})
	})
})
