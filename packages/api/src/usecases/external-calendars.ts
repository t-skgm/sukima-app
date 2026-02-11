import { familyIdSchema, idSchema, titleSchema, urlSchema } from '@sukima/shared'
import { z } from 'zod'
import { BadRequestError, InternalError, NotFoundError } from './errors'
import { type ParsedEvent, parseIcal } from './ical-parser'
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
		// URLの到達可能性とiCal形式をフェッチして検証
		await fetchAndParseIcal(input.data.icalUrl)

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

		// iCalデータを取得・パース
		const parsedEvents = await fetchAndParseIcal(calendar.ical_url)

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

// === ヘルパー ===

const GOOGLE_CALENDAR_HINT =
	'Googleカレンダーの場合は「設定と共有」→「カレンダーの統合」→「iCal形式の非公開URL」を使用してください'

function isGoogleCalendarUrl(url: string): boolean {
	return url.includes('calendar.google.com')
}

function buildFetchErrorMessage(status: number, url: string): string {
	if (isGoogleCalendarUrl(url)) {
		if (status === 404 || status === 403) {
			return `Googleカレンダーへのアクセスが拒否されました。${GOOGLE_CALENDAR_HINT}`
		}
	}
	return `カレンダーの取得に失敗しました（ステータス: ${status}）`
}

/**
 * iCal URLからデータを取得・パースする
 * Google Calendar等のアクセス制限時に分かりやすいエラーメッセージを返す
 */
async function fetchAndParseIcal(url: string): Promise<ParsedEvent[]> {
	let response: Response
	try {
		response = await fetch(url)
	} catch {
		throw new BadRequestError(`カレンダーURLへの接続に失敗しました。URLが正しいか確認してください`)
	}

	if (!response.ok) {
		throw new BadRequestError(buildFetchErrorMessage(response.status, url))
	}

	const icalText = await response.text()

	// HTMLが返された場合（認証ページへのリダイレクト等）
	const trimmed = icalText.trimStart()
	if (
		trimmed.startsWith('<!DOCTYPE') ||
		trimmed.startsWith('<html') ||
		trimmed.startsWith('<HTML')
	) {
		if (isGoogleCalendarUrl(url)) {
			throw new BadRequestError(`Googleカレンダーの認証が必要なURLです。${GOOGLE_CALENDAR_HINT}`)
		}
		throw new BadRequestError(
			'カレンダーURLがiCal形式のデータを返しませんでした。URLを確認してください',
		)
	}

	// iCal形式の基本的なバリデーション
	if (!trimmed.startsWith('BEGIN:VCALENDAR')) {
		if (isGoogleCalendarUrl(url)) {
			throw new BadRequestError(
				`GoogleカレンダーからiCalデータを取得できませんでした。${GOOGLE_CALENDAR_HINT}`,
			)
		}
		throw new BadRequestError(
			'カレンダーURLがiCal形式のデータを返しませんでした。URLを確認してください',
		)
	}

	return parseIcal(icalText)
}

function toOutput(row: ExternalCalendarRow): ExternalCalendarOutput {
	return {
		id: row.id,
		name: row.name,
		icalUrl: row.ical_url,
		lastSyncedAt: row.last_synced_at,
	}
}
