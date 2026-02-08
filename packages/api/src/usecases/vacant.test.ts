import { describe, expect, it } from 'vitest'
import { calculateVacantPeriods } from './vacant'

/**
 * 2026年 曜日早見:
 * 1/1(木), 1/3(土), 1/4(日), 1/5(月), 1/10(土), 1/11(日), 1/12(月)
 * 1/25(日), 1/31(土), 2/1(日), 2/7(土), 2/8(日), 2/28(土)
 * 3/1(日), 3/7(土), 3/31(火), 4/1(水), 4/4(土)
 */
describe('calculateVacantPeriods', () => {
	const emptyHolidays = new Set<string>()

	// ============================
	// 基本ケース
	// ============================

	it('占有なしで週末を含む場合、範囲全体が空き期間になる', () => {
		// 2026-01-01(木)〜01-10(土) — 10日間、1ヶ月内
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-01', '2026-01-10', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-01',
			endDate: '2026-01-10',
			days: 10,
		})
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

	it('範囲の先頭に予定がある場合、後半が空き期間になる', () => {
		// occupied: 01-01(木)〜01-05(月), free: 01-06(火)〜01-12(月)
		// 01-10(土)・01-11(日)含む
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-01', endDate: '2026-01-05' }],
			emptyHolidays,
			'2026-01-01',
			'2026-01-12',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-06',
			endDate: '2026-01-12',
			days: 7,
		})
	})

	it('範囲の末尾に予定がある場合、前半が空き期間になる', () => {
		// free: 01-01(木)〜01-07(水), occupied: 01-08(木)〜01-12(月)
		// 01-03(土)・01-04(日)含む
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-08', endDate: '2026-01-12' }],
			emptyHolidays,
			'2026-01-01',
			'2026-01-12',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-01',
			endDate: '2026-01-07',
			days: 7,
		})
	})

	// ============================
	// 予定間のギャップ
	// ============================

	it('2つの予定の間に十分なギャップがある場合、空き期間が検出される', () => {
		// occupied: 01-01〜01-04, 01-11〜01-14
		// gap: 01-05(月)〜01-10(土) = 6日
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-04' },
				{ startDate: '2026-01-11', endDate: '2026-01-14' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-14',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-05',
			endDate: '2026-01-10',
			days: 6,
		})
	})

	it('3つの予定の間に2つの空き期間がある', () => {
		// occupied: 01-01〜01-02, 01-08〜01-09, 01-16〜01-17
		// gap1: 01-03(土)〜01-07(水) = 5日
		// gap2: 01-10(土)〜01-15(木) = 6日
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-02' },
				{ startDate: '2026-01-08', endDate: '2026-01-09' },
				{ startDate: '2026-01-16', endDate: '2026-01-17' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-17',
			3,
		)
		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ startDate: '2026-01-03', endDate: '2026-01-07' })
		expect(result[1]).toMatchObject({ startDate: '2026-01-10', endDate: '2026-01-15' })
	})

	it('隣接する予定（A.endDateの翌日がB.startDate）にはギャップなし', () => {
		// A: 01-01〜01-05, B: 01-06〜01-12
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-05' },
				{ startDate: '2026-01-06', endDate: '2026-01-12' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-12',
			3,
		)
		expect(result).toHaveLength(0)
	})

	it('1日だけのギャップはminDays未満なら除外される', () => {
		// A: 01-01〜01-04, B: 01-06〜01-10
		// gap: 01-05(月) = 1日
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-04' },
				{ startDate: '2026-01-06', endDate: '2026-01-10' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-10',
			3,
		)
		expect(result).toHaveLength(0)
	})

	// ============================
	// 重複する予定
	// ============================

	it('重複する予定はマージされて扱われる', () => {
		// A: 01-01〜01-07, B: 01-05〜01-12 → occupied: 01-01〜01-12
		// gap: 01-13(火)〜01-18(日) = 6日
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-07' },
				{ startDate: '2026-01-05', endDate: '2026-01-12' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-18',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ startDate: '2026-01-13', endDate: '2026-01-18' })
	})

	it('完全に包含される予定がある場合も正しくマージされる', () => {
		// A: 01-01〜01-14, B: 01-05〜01-08 (Aに包含)
		// gap: 01-15(水)〜01-18(日) = 4日
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-14' },
				{ startDate: '2026-01-05', endDate: '2026-01-08' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-18',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ startDate: '2026-01-15', endDate: '2026-01-18' })
	})

	// ============================
	// minDays フィルタ
	// ============================

	it('ちょうどminDays日の空きは含まれる', () => {
		// gap: 01-03(土)〜01-05(月) = 3日 = minDays
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-02' },
				{ startDate: '2026-01-06', endDate: '2026-01-10' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-10',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0].days).toBe(3)
	})

	it('minDays未満の空きは無視する', () => {
		// gaps: 1/1-1/2(2日), 1/5-1/6(2日), 1/9-1/10(2日) — 全て < 3
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
		expect(result).toHaveLength(0)
	})

	it('minDays=1で1日の空きも検出される（週末の場合）', () => {
		// gap: 01-03(土) = 1日
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-01', endDate: '2026-01-02' },
				{ startDate: '2026-01-04', endDate: '2026-01-05' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-05',
			1,
		)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ startDate: '2026-01-03', days: 1 })
	})

	// ============================
	// 週末・祝日フィルタ
	// ============================

	it('平日のみの期間は除外される', () => {
		// 01-05(月)〜01-09(金) — 平日のみ、祝日なし
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-05', '2026-01-09', 3)
		expect(result).toHaveLength(0)
	})

	it('土曜を含む期間は含まれる', () => {
		// 01-08(木)〜01-10(土) = 3日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-08', '2026-01-10', 3)
		expect(result).toHaveLength(1)
	})

	it('日曜を含む期間は含まれる', () => {
		// 01-02(金)〜01-04(日) = 3日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-02', '2026-01-04', 3)
		expect(result).toHaveLength(1)
	})

	it('祝日（平日）を含む期間は含まれる', () => {
		// 02-09(月)〜02-13(金) — 02-11(水)建国記念の日
		const holidays = new Set(['2026-02-11'])
		const result = calculateVacantPeriods([], holidays, '2026-02-09', '2026-02-13', 3)
		expect(result).toHaveLength(1)
		expect(result[0].days).toBe(5)
	})

	// ============================
	// 連休判定 (isLongWeekend)
	// ============================

	it('連休判定: 3日 + 週末 + 祝日 → isLongWeekend=true', () => {
		// 01-10(土), 01-11(日), 01-12(月)成人の日
		const holidays = new Set(['2026-01-12'])
		const result = calculateVacantPeriods([], holidays, '2026-01-10', '2026-01-12', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ days: 3, isLongWeekend: true })
	})

	it('連休判定: 5日 + 週末 + 祝日 → isLongWeekend=true', () => {
		// 01-09(金)〜01-13(火), 01-10(土)01-11(日), 01-12(月)成人の日
		const holidays = new Set(['2026-01-12'])
		const result = calculateVacantPeriods([], holidays, '2026-01-09', '2026-01-13', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ days: 5, isLongWeekend: true })
	})

	it('連休判定: 6日以上 → isLongWeekend=false', () => {
		const holidays = new Set(['2026-01-12'])
		const result = calculateVacantPeriods([], holidays, '2026-01-08', '2026-01-14', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ days: 7, isLongWeekend: false })
	})

	it('連休判定: 週末のみ（祝日なし）→ isLongWeekend=false', () => {
		// 01-02(金)〜01-04(日) = 3日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-02', '2026-01-04', 3)
		expect(result).toHaveLength(1)
		expect(result[0].isLongWeekend).toBe(false)
	})

	it('連休判定: 祝日のみ（週末なし）→ isLongWeekend=false', () => {
		// 02-10(火)〜02-12(木) = 3日、02-11(水)建国記念の日
		const holidays = new Set(['2026-02-11'])
		const result = calculateVacantPeriods([], holidays, '2026-02-10', '2026-02-12', 3)
		expect(result).toHaveLength(1)
		expect(result[0].isLongWeekend).toBe(false)
	})

	// ============================
	// 範囲の境界
	// ============================

	it('予定がrangeStartより前に開始しても、rangeStart以降のみ考慮される', () => {
		// event: 2025-12-28〜2026-01-05 (rangeStart前に開始)
		// free: 01-06(火)〜01-12(月)
		const result = calculateVacantPeriods(
			[{ startDate: '2025-12-28', endDate: '2026-01-05' }],
			emptyHolidays,
			'2026-01-01',
			'2026-01-12',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0].startDate).toBe('2026-01-06')
	})

	it('予定がrangeEndより後に終了しても、rangeEnd以前のみ考慮される', () => {
		// event: 01-08〜01-20 (rangeEnd後に終了)
		// free: 01-01(木)〜01-07(水)
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-08', endDate: '2026-01-20' }],
			emptyHolidays,
			'2026-01-01',
			'2026-01-12',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0].endDate).toBe('2026-01-07')
	})

	it('空き期間がrangeEnd末尾まで続く場合も検出される', () => {
		// event: 01-01〜01-05, free: 01-06〜01-12(rangeEnd)
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-01', endDate: '2026-01-05' }],
			emptyHolidays,
			'2026-01-01',
			'2026-01-12',
			3,
		)
		expect(result).toHaveLength(1)
		expect(result[0].endDate).toBe('2026-01-12')
	})

	it('rangeStartとrangeEndが同日の場合', () => {
		// 01-03(土) 1日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-03', 1)
		expect(result).toHaveLength(1)
		expect(result[0].days).toBe(1)
	})

	// ============================
	// 月境界での分割
	// ============================

	it('月をまたぐ空き期間は月境界で分割される', () => {
		// 01-25(日)〜02-10(火)
		// → 01-25〜01-31 (7日, 01-25(日)含む) + 02-01〜02-10 (10日, 02-07(土)含む)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-25', '2026-02-10', 3)
		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ startDate: '2026-01-25', endDate: '2026-01-31' })
		expect(result[1]).toMatchObject({ startDate: '2026-02-01', endDate: '2026-02-10' })
	})

	it('3ヶ月にまたがる空き期間は3つに分割される', () => {
		// 01-25(日)〜03-05(木)
		// → 01-25〜01-31 (7日) + 02-01〜02-28 (28日) + 03-01〜03-05 (5日)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-25', '2026-03-05', 3)
		expect(result).toHaveLength(3)
		expect(result[0]).toMatchObject({ startDate: '2026-01-25', endDate: '2026-01-31' })
		expect(result[1]).toMatchObject({ startDate: '2026-02-01', endDate: '2026-02-28' })
		expect(result[2]).toMatchObject({ startDate: '2026-03-01', endDate: '2026-03-05' })
	})

	it('1ヶ月内に収まる空き期間は分割されない', () => {
		// 01-05(月)〜01-18(日) = 14日、同一月
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-05', '2026-01-18', 3)
		expect(result).toHaveLength(1)
		expect(result[0].days).toBe(14)
	})

	it('月境界の分割後、各部分にminDaysフィルタが適用される', () => {
		// 01-30(金)〜02-02(月)
		// 分割: 01-30〜01-31 (2日 < minDays) + 02-01〜02-02 (2日 < minDays)
		// → 両方除外
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-30', '2026-02-02', 3)
		expect(result).toHaveLength(0)
	})

	it('月境界の分割後、各部分に週末・祝日フィルタが適用される', () => {
		// 03-30(月)〜04-03(金)
		// 分割: 03-30〜03-31 (2日 < minDays 除外) + 04-01〜04-03 (3日, 水〜金, 週末なし 除外)
		// → 両方除外
		const result = calculateVacantPeriods([], emptyHolidays, '2026-03-30', '2026-04-03', 3)
		expect(result).toHaveLength(0)
	})

	it('予定により中間で分割された空き期間にも月境界分割が適用される', () => {
		// range: 01-20〜02-15, occupied: 01-28〜02-03
		// raw gaps: 01-20〜01-27 (8日, 同一月, 分割不要) + 02-04〜02-15 (12日, 同一月, 分割不要)
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-28', endDate: '2026-02-03' }],
			emptyHolidays,
			'2026-01-20',
			'2026-02-15',
			3,
		)
		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ startDate: '2026-01-20', endDate: '2026-01-27' })
		expect(result[1]).toMatchObject({ startDate: '2026-02-04', endDate: '2026-02-15' })
	})

	// ============================
	// 最大30日の制限
	// ============================

	it('空き期間は最大30日に制限される', () => {
		// 03-01(日)〜03-31(火) = 31日（1ヶ月内だが31日超過）
		const result = calculateVacantPeriods([], emptyHolidays, '2026-03-01', '2026-03-31', 3)
		expect(result.every((p) => p.days <= 30)).toBe(true)
	})

	it('30日以内の空き期間は分割されない', () => {
		// 02-01(日)〜02-28(土) = 28日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-02-01', '2026-02-28', 3)
		expect(result).toHaveLength(1)
		expect(result[0].days).toBe(28)
	})

	// ============================
	// 731日問題（実際のバグケース）
	// ============================

	it('2年間の範囲で予定なしの場合、月ごとに分割され30日以下になる', () => {
		// 実際の使用ケース: rangeStart=2026-02-08, rangeEnd=2028-02-08
		const result = calculateVacantPeriods([], emptyHolidays, '2026-02-08', '2028-02-08', 3)

		// 731日の1塊にならない
		expect(result.every((p) => p.days <= 30)).toBe(true)
		// 複数に分割される
		expect(result.length).toBeGreaterThan(1)
	})

	it('2年間の範囲で予定がある場合、空き期間は月内に収まり30日以下', () => {
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-04-01', endDate: '2026-04-05' },
				{ startDate: '2026-08-10', endDate: '2026-08-15' },
			],
			emptyHolidays,
			'2026-02-08',
			'2028-02-08',
			3,
		)

		// すべて30日以下
		expect(result.every((p) => p.days <= 30)).toBe(true)
		// すべて同一月内に収まる
		for (const period of result) {
			const startMonth = period.startDate.slice(0, 7)
			const endMonth = period.endDate.slice(0, 7)
			expect(startMonth).toBe(endMonth)
		}
	})

	// ============================
	// daysBetween 精度（結果のdays値で間接テスト）
	// ============================

	it('同一日の空きは1日としてカウントされる', () => {
		// 01-03(土)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-03', 1)
		expect(result[0].days).toBe(1)
	})

	it('連続する2日の空きは2日としてカウントされる', () => {
		// 01-03(土)〜01-04(日)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-04', 1)
		expect(result[0].days).toBe(2)
	})
})
