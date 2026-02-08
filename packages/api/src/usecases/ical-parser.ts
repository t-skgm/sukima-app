/**
 * 軽量iCalパーサー
 * Google Calendar等の.icsファイルからVEVENTを抽出する
 */

export type ParsedEvent = {
	uid: string
	title: string
	startDate: string // YYYY-MM-DD
	endDate: string // YYYY-MM-DD
	description: string
}

/**
 * iCalテキストからイベントを抽出する
 * 終日イベントと日時指定イベントの両方に対応
 */
export function parseIcal(icalText: string): ParsedEvent[] {
	// RFC 5545: 行の折り返し（CRLF + スペース/タブ）を展開
	const unfolded = icalText.replace(/\r?\n[ \t]/g, '')
	const lines = unfolded.split(/\r?\n/)

	const events: ParsedEvent[] = []
	let inEvent = false
	let uid = ''
	let summary = ''
	let dtstart = ''
	let dtend = ''
	let description = ''

	for (const line of lines) {
		if (line === 'BEGIN:VEVENT') {
			inEvent = true
			uid = ''
			summary = ''
			dtstart = ''
			dtend = ''
			description = ''
			continue
		}

		if (line === 'END:VEVENT') {
			if (inEvent && uid && dtstart) {
				const startDate = parseIcalDate(dtstart)
				if (startDate) {
					// DTENDが無い場合は終日1日イベントとして扱う
					let endDate = dtend ? parseIcalDate(dtend) : null
					if (!endDate) {
						endDate = startDate
					} else if (isDateOnly(dtstart) && endDate > startDate) {
						// 終日イベントのDTENDは排他的（翌日）なので前日に調整
						endDate = subtractOneDay(endDate)
					}
					events.push({
						uid,
						title: unescapeText(summary || '（タイトルなし）'),
						startDate,
						endDate,
						description: unescapeText(description),
					})
				}
			}
			inEvent = false
			continue
		}

		if (!inEvent) continue

		// プロパティ解析（パラメータ付きにも対応: DTSTART;VALUE=DATE:20260101）
		const colonIdx = line.indexOf(':')
		if (colonIdx === -1) continue

		const key = line.slice(0, colonIdx)
		const value = line.slice(colonIdx + 1)
		const baseName = key.split(';')[0]

		switch (baseName) {
			case 'UID':
				uid = value
				break
			case 'SUMMARY':
				summary = value
				break
			case 'DTSTART':
				dtstart = value
				break
			case 'DTEND':
				dtend = value
				break
			case 'DESCRIPTION':
				description = value
				break
		}
	}

	return events
}

/** iCalの日付/日時文字列をYYYY-MM-DD形式に変換 */
function parseIcalDate(value: string): string | null {
	// 終日: YYYYMMDD
	const dateMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/)
	if (dateMatch) {
		return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
	}

	// 日時: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
	const datetimeMatch = value.match(/^(\d{4})(\d{2})(\d{2})T/)
	if (datetimeMatch) {
		return `${datetimeMatch[1]}-${datetimeMatch[2]}-${datetimeMatch[3]}`
	}

	return null
}

/** VALUE=DATE形式（終日イベント）かどうか */
function isDateOnly(value: string): boolean {
	return /^\d{8}$/.test(value)
}

/** YYYY-MM-DD形式の日付から1日引く */
function subtractOneDay(dateStr: string): string {
	const [y, m, d] = dateStr.split('-').map(Number)
	const date = new Date(y, m - 1, d - 1)
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, '0'),
		String(date.getDate()).padStart(2, '0'),
	].join('-')
}

/** iCalエスケープ文字を戻す */
function unescapeText(text: string): string {
	return text.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}
