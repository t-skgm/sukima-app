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
						className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
					>
						{onMonthClick ? (
							<button
								type="button"
								className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-200"
								onClick={() => onMonthClick(group.year, group.month)}
							>
								{group.label} <span className="text-violet-400">+</span>
							</button>
						) : (
							<span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-600">
								{group.label}
							</span>
						)}
						<p className="mt-1.5 text-xs text-gray-400">{summary}</p>
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
