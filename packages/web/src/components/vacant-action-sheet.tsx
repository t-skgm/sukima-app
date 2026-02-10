import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { formatDateRange } from '@/components/calendar/calendar-item-card'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useFamilyApi } from '@/lib/family-api-context'

type VacantItem = Extract<CalendarItem, { type: 'vacant' }>

type EventType = 'trip' | 'school' | 'personal' | 'other'

type VacantActionSheetProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	vacant: VacantItem
	onAddEvent: (defaultValues?: {
		eventType?: EventType
		title?: string
		startDate?: string
		endDate?: string
	}) => void
}

export function VacantActionSheet({
	open,
	onOpenChange,
	vacant,
	onAddEvent,
}: VacantActionSheetProps) {
	const api = useFamilyApi()
	const rangeStart = dayjs().format('YYYY-MM-DD')
	const { data: destinations } = useQuery(
		api.destinations.list.queryOptions({ input: { rangeStart } }),
	)

	const matchingDestinations =
		destinations?.active.filter((d) => d.requiredDays <= vacant.days) ?? []

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>空き期間</SheetTitle>
				</SheetHeader>
				<div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
					{/* 期間情報 */}
					<div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
						<p className="font-medium">{formatDateRange(vacant.startDate, vacant.endDate)}</p>
						<p className="text-sm text-gray-600">
							{vacant.days}日間{vacant.isLongWeekend && ' (連休)'}
						</p>
					</div>

					{/* 予定を追加 */}
					<Button
						className="w-full"
						onClick={() =>
							onAddEvent({
								startDate: vacant.startDate,
								endDate: vacant.endDate,
							})
						}
					>
						予定を追加
					</Button>

					{/* 行き先ストックから選ぶ */}
					{matchingDestinations.length > 0 && (
						<div>
							<h3 className="mb-2 text-sm font-semibold text-gray-600">行き先ストックから選ぶ</h3>
							<div className="space-y-2">
								{matchingDestinations.map((dest) => (
									<button
										key={dest.id}
										type="button"
										className="w-full rounded-lg border border-gray-200 p-3 text-left transition-shadow hover:shadow-md"
										onClick={() =>
											onAddEvent({
												eventType: 'trip',
												title: dest.name,
												startDate: vacant.startDate,
												endDate: computeEndDate(
													vacant.startDate,
													dest.requiredDays,
													vacant.endDate,
												),
											})
										}
									>
										<p className="font-medium">{dest.name}</p>
										<p className="text-xs text-gray-500">
											{dest.requiredDays}日間必要
											{dest.memo && ` — ${dest.memo}`}
										</p>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	)
}

function computeEndDate(startDate: string, requiredDays: number, maxEndDate: string): string {
	const end = dayjs(startDate).add(requiredDays - 1, 'day')

	if (end.isAfter(dayjs(maxEndDate))) {
		return maxEndDate
	}

	return end.format('YYYY-MM-DD')
}
