import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import { groupByMonth } from './calendar-helpers'
import { CalendarItemCard } from './calendar-item-card'

type MonthlyViewProps = {
	items: CalendarItem[]
	onItemClick: (item: CalendarItem) => void
	onMonthClick?: (year: number, month: number) => void
}

export function MonthlyView({ items, onItemClick, onMonthClick }: MonthlyViewProps) {
	const months = groupByMonth(items, true)

	if (months.length === 0) return null

	return (
		<div className="space-y-4">
			{months.map((group) => (
				<div key={`${group.year}-${group.month}`}>
					{onMonthClick ? (
						<button
							type="button"
							className="mb-2 text-sm font-semibold text-blue-600 hover:underline"
							onClick={() => onMonthClick(group.year, group.month)}
						>
							{group.label} +
						</button>
					) : (
						<h3 className="mb-2 text-sm font-semibold text-gray-500">{group.label}</h3>
					)}
					{group.items.length > 0 ? (
						<div className="space-y-2">
							{group.items.map((item, index) => (
								<CalendarItemCard
									key={`${item.type}-${index}`}
									item={item}
									onClick={() => onItemClick(item)}
									compact
								/>
							))}
						</div>
					) : (
						<p className="text-xs text-gray-400">予定なし</p>
					)}
				</div>
			))}
		</div>
	)
}
