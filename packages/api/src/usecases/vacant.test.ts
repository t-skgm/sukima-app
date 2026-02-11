import { describe, expect, it } from 'vitest'
import { calculateVacantPeriods } from './vacant'

/**
 * 2026年 曜日早見:
 * 1/1(木), 1/2(金), 1/3(土), 1/4(日), 1/5(月)
 * 1/10(土), 1/11(日), 1/12(月)
 * 1/17(土), 1/18(日), 1/24(土), 1/25(日), 1/31(土)
 * 2/1(日), 2/7(土), 2/8(日), 2/14(土), 2/15(日)
 * 2/21(土), 2/22(日), 2/28(土)
 * 3/1(日), 3/7(土), 3/8(日)
 */
describe('calculateVacantPeriods', () => {
	const emptyHolidays = new Set<string>()

	// ============================
	// 基本ケース: 連続する休日のみが空き期間
	// ============================

	it('平日は空き期間に含まれず、連続する土日のみが空き期間になる', () => {
		// 01-01(木)〜01-12(月) 祝日なし
		// 連続休日: 01-03(土)+01-04(日)=2日, 01-10(土)+01-11(日)=2日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-01', '2026-01-12', 2)
		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ startDate: '2026-01-03', endDate: '2026-01-04', days: 2 })
		expect(result[1]).toMatchObject({ startDate: '2026-01-10', endDate: '2026-01-11', days: 2 })
	})

	it('平日のみの範囲は空き期間なし', () => {
		// 01-05(月)〜01-09(金) — 平日のみ
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-05', '2026-01-09', 1)
		expect(result).toHaveLength(0)
	})

	it('全て占有済みなら空き期間なし', () => {
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-01', endDate: '2026-01-10' }],
			emptyHolidays,
			'2026-01-01',
			'2026-01-10',
			1,
		)
		expect(result).toHaveLength(0)
	})

	it('minDays未満の連続休日は除外される', () => {
		// 01-03(土)+01-04(日)=2日 < minDays=3 → 除外
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-01', '2026-01-07', 3)
		expect(result).toHaveLength(0)
	})

	it('minDays=1で1日の休日も検出される', () => {
		// 01-03(土) のみの範囲
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-03', 1)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ startDate: '2026-01-03', endDate: '2026-01-03', days: 1 })
	})

	// ============================
	// 祝日と連続休日
	// ============================

	it('3連休（土日+月曜祝日）が空き期間として検出される', () => {
		// 01-10(土), 01-11(日), 01-12(月)成人の日 = 3連休
		const holidays = new Set(['2026-01-12'])
		const result = calculateVacantPeriods([], holidays, '2026-01-05', '2026-01-16', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-10',
			endDate: '2026-01-12',
			days: 3,
		})
	})

	it('金曜祝日+土日で3連休になる', () => {
		// 01-09(金)を祝日とした場合: 01-09(金holiday)+01-10(土)+01-11(日)=3連休
		const holidays = new Set(['2026-01-09'])
		const result = calculateVacantPeriods([], holidays, '2026-01-05', '2026-01-14', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-09',
			endDate: '2026-01-11',
			days: 3,
		})
	})

	it('孤立した平日祝日は土日とは別の休日グループになる', () => {
		// 02-07(土)+02-08(日)=2日, 02-11(水)建国記念の日=1日, 02-14(土)+02-15(日)=2日
		const holidays = new Set(['2026-02-11'])
		const result = calculateVacantPeriods([], holidays, '2026-02-02', '2026-02-20', 1)
		expect(result).toHaveLength(3)
		expect(result[0]).toMatchObject({ startDate: '2026-02-07', endDate: '2026-02-08', days: 2 })
		expect(result[1]).toMatchObject({ startDate: '2026-02-11', endDate: '2026-02-11', days: 1 })
		expect(result[2]).toMatchObject({ startDate: '2026-02-14', endDate: '2026-02-15', days: 2 })
	})

	it('天皇誕生日: 土日+月曜祝日で3連休', () => {
		// 02-21(土), 02-22(日), 02-23(月)天皇誕生日 = 3連休
		const holidays = new Set(['2026-02-23'])
		const result = calculateVacantPeriods([], holidays, '2026-02-16', '2026-02-27', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-02-21',
			endDate: '2026-02-23',
			days: 3,
		})
	})

	it('GW: 複数の祝日が連続する大型連休', () => {
		// GW 2026:
		// 05-02(土), 05-03(日)憲法記念日, 05-04(月)みどりの日, 05-05(火)こどもの日, 05-06(水)振替休日
		// = 5日連続の休日
		const holidays = new Set(['2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06'])
		const result = calculateVacantPeriods([], holidays, '2026-04-27', '2026-05-10', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-05-02',
			endDate: '2026-05-06',
			days: 5,
		})
	})

	// ============================
	// 予定との組み合わせ
	// ============================

	it('予定が休日の一部を占有する場合、残りの連続休日のみが空き期間', () => {
		// 01-10(土)に予定あり → 01-11(日)+01-12(月)成人の日=2日が空き
		const holidays = new Set(['2026-01-12'])
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-10', endDate: '2026-01-10' }],
			holidays,
			'2026-01-05',
			'2026-01-16',
			2,
		)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-11',
			endDate: '2026-01-12',
			days: 2,
		})
	})

	it('予定が平日にある場合、隣接する休日には影響しない', () => {
		// 01-05(月)〜01-09(金)に予定 → 01-03(土)+01-04(日)と01-10(土)+01-11(日)は影響なし
		const result = calculateVacantPeriods(
			[{ startDate: '2026-01-05', endDate: '2026-01-09' }],
			emptyHolidays,
			'2026-01-01',
			'2026-01-14',
			2,
		)
		expect(result).toHaveLength(2)
		expect(result[0]).toMatchObject({ startDate: '2026-01-03', endDate: '2026-01-04', days: 2 })
		expect(result[1]).toMatchObject({ startDate: '2026-01-10', endDate: '2026-01-11', days: 2 })
	})

	it('重複する予定が休日を占有する場合', () => {
		// 01-02(金)〜01-05(月) により 01-03(土)+01-04(日)が占有される
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-01-02', endDate: '2026-01-04' },
				{ startDate: '2026-01-03', endDate: '2026-01-05' },
			],
			emptyHolidays,
			'2026-01-01',
			'2026-01-07',
			1,
		)
		expect(result).toHaveLength(0)
	})

	// ============================
	// 月境界
	// ============================

	it('月をまたぐ連続休日は分割されない', () => {
		// 01-31(土)+02-01(日) = 2日連続休日、月をまたぐが1つの空き期間
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-26', '2026-02-06', 2)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-31',
			endDate: '2026-02-01',
			days: 2,
		})
	})

	it('月をまたぐ3連休（金曜祝日+土日）', () => {
		// 01-30(金)を祝日とした場合: 01-30(金holiday)+01-31(土)+02-01(日)=3連休
		const holidays = new Set(['2026-01-30'])
		const result = calculateVacantPeriods([], holidays, '2026-01-26', '2026-02-06', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({
			startDate: '2026-01-30',
			endDate: '2026-02-01',
			days: 3,
		})
	})

	// ============================
	// 連休判定 (isLongWeekend)
	// ============================

	it('連休判定: 3日 + 週末 + 祝日 → isLongWeekend=true', () => {
		// 01-10(土), 01-11(日), 01-12(月)成人の日
		const holidays = new Set(['2026-01-12'])
		const result = calculateVacantPeriods([], holidays, '2026-01-05', '2026-01-16', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ days: 3, isLongWeekend: true })
	})

	it('連休判定: 週末のみ（祝日なし）→ isLongWeekend=false', () => {
		// 01-03(土)+01-04(日) = 2日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-01', '2026-01-07', 2)
		expect(result).toHaveLength(1)
		expect(result[0].isLongWeekend).toBe(false)
	})

	it('連休判定: 6日以上 → isLongWeekend=false', () => {
		// 05-02(土)〜05-07(木): 05-07も祝日にして6連休
		const holidays = new Set(['2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07'])
		const result = calculateVacantPeriods([], holidays, '2026-04-27', '2026-05-10', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ days: 6, isLongWeekend: false })
	})

	it('連休判定: 5日 + 週末 + 祝日 → isLongWeekend=true', () => {
		// GW 2026: 05-02(土)〜05-06(水) = 5日
		const holidays = new Set(['2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06'])
		const result = calculateVacantPeriods([], holidays, '2026-04-27', '2026-05-10', 3)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ days: 5, isLongWeekend: true })
	})

	// ============================
	// 2年間の範囲（731日問題の回帰テスト）
	// ============================

	it('2年間の範囲でも各空き期間は連続する休日のみで構成される', () => {
		const result = calculateVacantPeriods([], emptyHolidays, '2026-02-08', '2028-02-08', 2)
		// 連続する休日は通常2〜3日なので、30日を超えることはない
		expect(result.every((p) => p.days <= 30)).toBe(true)
		// 複数の空き期間が検出される
		expect(result.length).toBeGreaterThan(1)
	})

	it('2年間の範囲で予定がある場合も正しく計算される', () => {
		const result = calculateVacantPeriods(
			[
				{ startDate: '2026-04-01', endDate: '2026-04-05' },
				{ startDate: '2026-08-10', endDate: '2026-08-15' },
			],
			emptyHolidays,
			'2026-02-08',
			'2028-02-08',
			2,
		)
		expect(result.every((p) => p.days <= 30)).toBe(true)
		expect(result.length).toBeGreaterThan(1)
	})

	// ============================
	// 範囲の境界
	// ============================

	it('rangeStartが休日の場合、その日が空き期間に含まれる', () => {
		// 01-03(土) 開始
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-04', 2)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ startDate: '2026-01-03', endDate: '2026-01-04', days: 2 })
	})

	it('rangeStartが平日の場合、次の休日から空き期間が始まる', () => {
		// 01-05(月) 開始 → 01-10(土)+01-11(日)が最初の休日
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-05', '2026-01-14', 2)
		expect(result).toHaveLength(1)
		expect(result[0]).toMatchObject({ startDate: '2026-01-10', endDate: '2026-01-11', days: 2 })
	})

	it('rangeStartとrangeEndが同日の休日', () => {
		// 01-03(土)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-03', 1)
		expect(result).toHaveLength(1)
		expect(result[0].days).toBe(1)
	})

	it('rangeStartとrangeEndが同日の平日', () => {
		// 01-05(月)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-05', '2026-01-05', 1)
		expect(result).toHaveLength(0)
	})

	// ============================
	// daysBetween 精度（結果のdays値で間接テスト）
	// ============================

	it('同一日の休日は1日としてカウントされる', () => {
		// 01-03(土)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-03', 1)
		expect(result[0].days).toBe(1)
	})

	it('連続する2日の休日は2日としてカウントされる', () => {
		// 01-03(土)〜01-04(日)
		const result = calculateVacantPeriods([], emptyHolidays, '2026-01-03', '2026-01-04', 1)
		expect(result[0].days).toBe(2)
	})
})
