import { familyIdSchema, idSchema, titleSchema, urlSchema } from '@sukima/shared'
import { z } from 'zod'
import { BadRequestError, InternalError, NotFoundError } from './errors'
import { parseIcal } from './ical-parser'
import type { Gateways } from './types'

// === スキーマ ===

export const createExternalCalendarInputSchema = z.object({
	where: z.object({ familyId: familyIdSchema }),
	data: z.object({
		name: titleSchema,
		icalUrl: urlSchema,
	}),
})
export type CreateExternalCalendarInput = z.infer<typeof createExternalCalendarInputSchema>

export const deleteExternalCalendarInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type DeleteExternalCalendarInput = z.infer<typeof deleteExternalCalendarInputSchema>

export const syncExternalCalendarInputSchema = z.object({
	where: z.object({
		familyId: familyIdSchema,
		id: idSchema,
	}),
})
export type SyncExternalCalendarInput = z.infer<typeof syncExternalCalendarInputSchema>

export const listExternalCalendarsInputSchema = z.object({
	where: z.object({ familyId: familyIdSchema }),
})
export type ListExternalCalendarsInput = z.infer<typeof listExternalCalendarsInputSchema>

// === Output ===

export const externalCalendarOutputSchema = z.object({
	id: idSchema,
	name: z.string(),
	icalUrl: z.string(),
	lastSyncedAt: z.string().nullable(),
})
export type ExternalCalendarOutput = z.infer<typeof externalCalendarOutputSchema>

export const syncResultOutputSchema = z.object({
	calendar: externalCalendarOutputSchema,
	syncedCount: z.number().int(),
})
export type SyncResultOutput = z.infer<typeof syncResultOutputSchema>

// === 内部型 ===

type ExternalCalendarRow = {
	id: number
	name: string
	ical_url: string
	last_synced_at: string | null
}

// === 内部関数 ===

const isGoogleCalendarUrl = (url: string): boolean => url.includes('calendar.google.com')

const buildFetchErrorMessage = (url: string, status: number): string => {
	if (status === 403 && isGoogleCalendarUrl(url)) {
		return 'Googleカレンダーへのアクセスが拒否されました。カレンダーの設定から「限定公開URL」を取得して登録してください（「公開URL」は非公開カレンダーでは使用できません）'
	}
	if (status === 403) {
		return 'カレンダーへのアクセスが拒否されました。公開設定またはURLを確認してください'
	}
	if (status === 404) {
		return 'カレンダーが見つかりませんでした。URLを確認してください'
	}
	return `カレンダーの取得に失敗しました（${status}）`
}

/**
 * iCal URLにアクセスできるか検証する
 */
const validateIcalUrlAccess = async (url: string): Promise<void> => {
	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new BadRequestError(buildFetchErrorMessage(url, response.status))
		}
	} catch (error) {
		if (error instanceof BadRequestError) throw error
		throw new BadRequestError('カレンダーURLに接続できませんでした。URLが正しいか確認してください')
	}
}

// === ユースケース ===

export const listExternalCalendars =
	(gateways: Gateways) =>
	async (input: ListExternalCalendarsInput): Promise<ExternalCalendarOutput[]> => {
		const result = await gateways.db
			.prepare(
				'SELECT id, name, ical_url, last_synced_at FROM external_calendars WHERE family_id = ? ORDER BY created_at ASC',
			)
			.bind(input.where.familyId)
			.all<ExternalCalendarRow>()

		return result.results.map(toOutput)
	}

export const createExternalCalendar =
	(gateways: Gateways) =>
	async (input: CreateExternalCalendarInput): Promise<ExternalCalendarOutput> => {
		// 登録前にURLがアクセス可能か検証する
		await validateIcalUrlAccess(input.data.icalUrl)

		const now = new Date().toISOString()

		const result = await gateways.db
			.prepare(
				'INSERT INTO external_calendars (family_id, name, ical_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING id',
			)
			.bind(input.where.familyId, input.data.name, input.data.icalUrl, now, now)
			.first<{ id: number }>()

		if (!result) {
			throw new InternalError('Failed to create external calendar')
		}

		return {
			id: result.id,
			name: input.data.name,
			icalUrl: input.data.icalUrl,
			lastSyncedAt: null,
		}
	}

export const deleteExternalCalendar =
	(gateways: Gateways) =>
	async (input: DeleteExternalCalendarInput): Promise<void> => {
		// external_eventsはON DELETE CASCADEで自動削除
		const result = await gateways.db
			.prepare('DELETE FROM external_calendars WHERE id = ? AND family_id = ?')
			.bind(input.where.id, input.where.familyId)
			.run()

		if (!result.meta.changes) {
			throw new NotFoundError('External calendar not found')
		}
	}

/**
 * 外部カレンダーを同期する
 * iCal URLからデータを取得し、external_eventsテーブルにupsertする
 */
export const syncExternalCalendar =
	(gateways: Gateways) =>
	async (input: SyncExternalCalendarInput): Promise<SyncResultOutput> => {
		const calendar = await gateways.db
			.prepare(
				'SELECT id, name, ical_url, last_synced_at FROM external_calendars WHERE id = ? AND family_id = ?',
			)
			.bind(input.where.id, input.where.familyId)
			.first<ExternalCalendarRow>()

		if (!calendar) {
			throw new NotFoundError('External calendar not found')
		}

		// iCalデータを取得
		const response = await fetch(calendar.ical_url)
		if (!response.ok) {
			throw new BadRequestError(buildFetchErrorMessage(calendar.ical_url, response.status))
		}

		const icalText = await response.text()
		const parsedEvents = parseIcal(icalText)

		const now = new Date().toISOString()

		// 既存のイベントを全削除して再挿入（シンプルなfull sync）
		await gateways.db
			.prepare('DELETE FROM external_events WHERE external_calendar_id = ?')
			.bind(calendar.id)
			.run()

		// バッチで挿入
		if (parsedEvents.length > 0) {
			const statements = parsedEvents.map((event) =>
				gateways.db
					.prepare(
						'INSERT INTO external_events (family_id, external_calendar_id, uid, title, start_date, end_date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
					)
					.bind(
						input.where.familyId,
						calendar.id,
						event.uid,
						event.title,
						event.startDate,
						event.endDate,
						event.description,
						now,
						now,
					),
			)

			// D1 batchは上限があるため、100件ずつ処理
			for (let i = 0; i < statements.length; i += 100) {
				const batch = statements.slice(i, i + 100)
				await gateways.db.batch(batch)
			}
		}

		// last_synced_atを更新
		await gateways.db
			.prepare('UPDATE external_calendars SET last_synced_at = ?, updated_at = ? WHERE id = ?')
			.bind(now, now, calendar.id)
			.run()

		return {
			calendar: {
				id: calendar.id,
				name: calendar.name,
				icalUrl: calendar.ical_url,
				lastSyncedAt: now,
			},
			syncedCount: parsedEvents.length,
		}
	}

function toOutput(row: ExternalCalendarRow): ExternalCalendarOutput {
	return {
		id: row.id,
		name: row.name,
		icalUrl: row.ical_url,
		lastSyncedAt: row.last_synced_at,
	}
}
