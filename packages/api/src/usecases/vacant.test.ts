import { describe, expect, it } from 'vitest'
import { calculateVacantPeriods } from './vacant'

describe('vacant', () => {
	describe('calculateVacantPeriods', () => {
		const emptyHolidays = new Set<string>()

		it('占有なしで週末を含む場合、範囲全体が空き期間になる', () => {
			// 2026-01-01(木)〜2026-01-10(土) — 週末を含む
			const result = calculateVacantPeriods([], emptyHolidays, '2026-01-01', '2026-01-10', 3)

			expect(result).toHaveLength(1)
			expect(result[0].startDate).toBe('2026-01-01')
			expect(result[0].endDate).toBe('2026-01-10')
			expect(result[0].days).toBe(10)
		})

		it('占有範囲で分割される', () => {
			// 2026-01-01(木)〜01-04(日): 週末含む, 01-07(水)〜01-12(月): 01-10(土)含む
			const result = calculateVacantPeriods(
				[{ startDate: '2026-01-05', endDate: '2026-01-06' }],
				emptyHolidays,
				'2026-01-01',
				'2026-01-12',
				3,
			)

			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({
				startDate: '2026-01-01',
				endDate: '2026-01-04',
				days: 4,
				isLongWeekend: false,
			})
			expect(result[1]).toEqual({
				startDate: '2026-01-07',
				endDate: '2026-01-12',
				days: 6,
				isLongWeekend: false,
			})
		})

		it('minDays未満の空きは無視する', () => {
			const result = calculateVacantPeriods(
				[
					{ startDate: '2026-01-03', endDate: '2026-01-04' },
					{ startDate: '2026-01-07', endDate: '2026-01-08' },
				],
				emptyHolidays,
				'2026-01-01',
				'2026-01-10',
				3,
			)

			// 1/1-1/2は2日 (< 3), 1/5-1/6は2日 (< 3), 1/9-1/10は2日 (< 3)
			expect(result).toHaveLength(0)
		})

		it('全て占有済みなら空き期間なし', () => {
			const result = calculateVacantPeriods(
				[{ startDate: '2026-01-01', endDate: '2026-01-10' }],
				emptyHolidays,
				'2026-01-01',
				'2026-01-10',
				3,
			)

			expect(result).toHaveLength(0)
		})

		it('連休判定: 週末+祝日を含む3〜5日の空きはisLongWeekend=true', () => {
			// 2026-01-10は土曜、1/11は日曜、1/12は成人の日
			const holidays = new Set(['2026-01-12'])

			const result = calculateVacantPeriods([], holidays, '2026-01-10', '2026-01-12', 3)

			expect(result).toHaveLength(1)
			expect(result[0].isLongWeekend).toBe(true)
			expect(result[0].days).toBe(3)
		})

		it('6日以上の空きはisLongWeekend=false', () => {
			const holidays = new Set(['2026-01-12'])

			const result = calculateVacantPeriods([], holidays, '2026-01-08', '2026-01-14', 3)

			expect(result).toHaveLength(1)
			expect(result[0].isLongWeekend).toBe(false)
			expect(result[0].days).toBe(7)
		})

		it('平日のみの期間は除外される', () => {
			// 2026-01-05(月)〜01-09(金) — 平日のみ、祝日なし
			const result = calculateVacantPeriods([], emptyHolidays, '2026-01-05', '2026-01-09', 3)

			expect(result).toHaveLength(0)
		})

		it('土日を含む期間は含まれる', () => {
			// 2026-01-08(木)〜01-12(月) — 01-10(土), 01-11(日)含む
			const result = calculateVacantPeriods([], emptyHolidays, '2026-01-08', '2026-01-12', 3)

			expect(result).toHaveLength(1)
			expect(result[0].days).toBe(5)
		})

		it('祝日（平日）を含む期間は含まれる', () => {
			// 2026-02-09(月)〜02-13(金) — 02-11(水)は建国記念の日
			const holidays = new Set(['2026-02-11'])
			const result = calculateVacantPeriods([], holidays, '2026-02-09', '2026-02-13', 3)

			expect(result).toHaveLength(1)
			expect(result[0].days).toBe(5)
		})
	})
})
