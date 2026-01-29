import { z } from 'zod'

// === ID系 ===

/** 正の整数ID */
export const idSchema = z.number().int().positive()

/** 家族ID（共有リンク用、16文字以上の英数字） */
export const familyIdSchema = z.string().min(16)

// === 日付系 ===

/** 日付文字列 (YYYY-MM-DD) */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式')

// === テキスト系 ===

/** タイトル（1-100文字） */
export const titleSchema = z.string().min(1).max(100)

/** メモ（0-1000文字） */
export const memoSchema = z.string().max(1000)

/** 家族名（0-50文字） */
export const familyNameSchema = z.string().max(50)

/** URL */
export const urlSchema = z.string().url().max(2000)

// === ドメイン固有 ===

/** 予定種別 */
export const eventTypeSchema = z.enum(['trip', 'anniversary', 'school', 'personal', 'other'])

/** 年（2024-2030） */
export const yearSchema = z.number().int().min(2024).max(2030)

/** 月（1-12） */
export const monthSchema = z.number().int().min(1).max(12)

/** 必要日数（1-14日） */
export const requiredDaysSchema = z.number().int().min(1).max(14)
