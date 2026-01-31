import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import { groupByWeek } from './calendar-helpers'
import { CalendarItemCard } from './calendar-item-card'

type WeeklyViewProps = {
	items: CalendarItem[]
	onItemClick: (item: CalendarItem) => void
}

export function WeeklyView({ items, onItemClick }: WeeklyViewProps) {
	const weeks = groupByWeek(items)

	if (weeks.length === 0) return null

	return (
		<div className="space-y-4">
			{weeks.map((week) => (
				<div key={week.weekStart}>
					<h3 className="mb-2 text-sm font-semibold text-gray-500">{week.label}</h3>
					<div className="space-y-2">
						{week.items.map((item, index) => (
							<CalendarItemCard
								key={`${item.type}-${index}`}
								item={item}
								onClick={() => onItemClick(item)}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	)
}
