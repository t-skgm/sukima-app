import { describe, expect, it } from 'vitest'
import { getHolidaysForRange } from './holidays'

describe('holidays', () => {
	describe('getHolidaysForRange', () => {
		it('固定日の祝日を返す', () => {
			const holidays = getHolidaysForRange('2026-01-01', '2026-12-31')
			const titles = holidays.map((h) => h.title)

			expect(titles).toContain('元日')
			expect(titles).toContain('建国記念の日')
			expect(titles).toContain('天皇誕生日')
			expect(titles).toContain('昭和の日')
			expect(titles).toContain('憲法記念日')
			expect(titles).toContain('みどりの日')
			expect(titles).toContain('こどもの日')
			expect(titles).toContain('山の日')
			expect(titles).toContain('文化の日')
			expect(titles).toContain('勤労感謝の日')
		})

		it('ハッピーマンデー祝日の日付が正しい', () => {
			const holidays = getHolidaysForRange('2026-01-01', '2026-12-31')
			const findDate = (title: string) => holidays.find((h) => h.title === title)?.date

			// 2026年: 成人の日 = 1月第2月曜 = 1/12
			expect(findDate('成人の日')).toBe('2026-01-12')
			// 2026年: 海の日 = 7月第3月曜 = 7/20
			expect(findDate('海の日')).toBe('2026-07-20')
			// 2026年: 敬老の日 = 9月第3月曜 = 9/21
			expect(findDate('敬老の日')).toBe('2026-09-21')
			// 2026年: スポーツの日 = 10月第2月曜 = 10/12
			expect(findDate('スポーツの日')).toBe('2026-10-12')
		})

		it('春分・秋分の日付が正しい', () => {
			const holidays = getHolidaysForRange('2026-01-01', '2026-12-31')
			const findDate = (title: string) => holidays.find((h) => h.title === title)?.date

			expect(findDate('春分の日')).toBe('2026-03-20')
			expect(findDate('秋分の日')).toBe('2026-09-23')
		})

		it('振替休日を追加する: 2026年5/3(日)→5/6が振替休日', () => {
			// 2026年: 5/3(日)憲法記念日, 5/4(月)みどりの日, 5/5(火)こどもの日 → 5/6が振替休日
			const holidays = getHolidaysForRange('2026-05-01', '2026-05-10')
			const found = holidays.find((h) => h.date === '2026-05-06')

			expect(found).toBeDefined()
			expect(found?.title).toBe('振替休日')
		})

		it('2026年の国民の休日: 9/21敬老の日と9/23秋分の日の間の9/22', () => {
			const holidays = getHolidaysForRange('2026-09-01', '2026-09-30')
			const found = holidays.find((h) => h.date === '2026-09-22')

			expect(found).toBeDefined()
			expect(found?.title).toBe('国民の休日')
		})

		it('範囲でフィルタされる', () => {
			const holidays = getHolidaysForRange('2026-04-01', '2026-06-30')

			for (const h of holidays) {
				expect(h.date >= '2026-04-01').toBe(true)
				expect(h.date <= '2026-06-30').toBe(true)
			}
		})

		it('複数年をまたぐ範囲に対応する', () => {
			const holidays = getHolidaysForRange('2026-12-01', '2027-01-31')
			const titles = holidays.map((h) => h.title)

			// 2026年11月の祝日は含まない
			expect(titles).not.toContain('昭和の日')
			// 2027年1月の祝日を含む
			expect(titles).toContain('元日')
			expect(titles).toContain('成人の日')
		})
	})
})
