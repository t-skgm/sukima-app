import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import { groupByMonth } from './calendar-helpers'

type CompressedViewProps = {
	items: CalendarItem[]
	onMonthClick?: (year: number, month: number) => void
}

export function CompressedView({ items, onMonthClick }: CompressedViewProps) {
	const months = groupByMonth(items)

	if (months.length === 0) return null

	return (
		<div className="space-y-2">
			{months.map((group) => {
				const summary = buildSummary(group.items)
				return (
					<div
						key={`${group.year}-${group.month}`}
						className="rounded-lg border border-gray-200 bg-gray-50 p-3"
					>
						{onMonthClick ? (
							<button
								type="button"
								className="text-sm font-semibold text-blue-600 hover:underline"
								onClick={() => onMonthClick(group.year, group.month)}
							>
								{group.label} +
							</button>
						) : (
							<span className="text-sm font-semibold text-gray-500">{group.label}</span>
						)}
						<p className="mt-1 text-xs text-gray-500">{summary}</p>
					</div>
				)
			})}
		</div>
	)
}

function buildSummary(items: CalendarItem[]): string {
	const parts: string[] = []

	const events = items.filter((i) => i.type === 'event')
	const ideas = items.filter((i) => i.type === 'idea_trip' || i.type === 'idea_monthly')
	const holidays = items.filter((i) => i.type === 'holiday')
	const vacants = items.filter((i) => i.type === 'vacant')
	const externals = items.filter((i) => i.type === 'external')

	if (events.length > 0) {
		const names = events
			.slice(0, 2)
			.map((e) => ('title' in e ? e.title : ''))
			.join('、')
		parts.push(`予定${events.length}件（${names}${events.length > 2 ? '…' : ''}）`)
	}
	if (externals.length > 0) parts.push(`外部${externals.length}件`)
	if (ideas.length > 0) parts.push(`アイデア${ideas.length}件`)
	if (holidays.length > 0) parts.push(`祝日${holidays.length}日`)
	if (vacants.length > 0) parts.push(`空き${vacants.length}件`)

	return parts.length > 0 ? parts.join(' / ') : '予定なし'
}
