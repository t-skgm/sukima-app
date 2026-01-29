import { createFamilyApi } from '@/lib/api'
import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useMemo } from 'react'

export const Route = createFileRoute('/c/$familyId/')({
	component: CalendarPage,
})

function CalendarPage() {
	const { familyId } = Route.useParams()
	const api = useMemo(() => createFamilyApi(familyId), [familyId])

	const { data, isLoading, error } = useQuery(api.calendar.get.queryOptions({ input: {} }))

	if (isLoading) {
		return (
			<div className="p-4">
				<div className="animate-pulse">
					<div className="mb-4 h-8 w-48 rounded bg-gray-200" />
					<div className="space-y-3">
						<div className="h-16 rounded bg-gray-200" />
						<div className="h-16 rounded bg-gray-200" />
						<div className="h-16 rounded bg-gray-200" />
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-4">
				<h1 className="mb-4 text-xl font-bold text-red-600">エラー</h1>
				<p className="text-gray-600">カレンダーの読み込みに失敗しました: {error.message}</p>
			</div>
		)
	}

	return (
		<div className="p-4">
			<h1 className="mb-4 text-xl font-bold">カレンダー</h1>
			{data && (
				<>
					<p className="mb-4 text-sm text-gray-500">
						{data.rangeStart} 〜 {data.rangeEnd}
					</p>
					<div className="space-y-3">
						{data.items.length === 0 ? (
							<p className="text-gray-400">予定がありません</p>
						) : (
							data.items.map((item, index) => (
								<CalendarItemCard key={`${item.type}-${index}`} item={item} />
							))
						)}
					</div>
				</>
			)}
		</div>
	)
}

function CalendarItemCard({ item }: { item: CalendarItem }) {
	switch (item.type) {
		case 'event':
			return (
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<div className="flex items-center gap-2">
						<span className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white">
							{eventTypeLabel(item.eventType)}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</div>
			)
		case 'idea_trip':
		case 'idea_monthly':
			return (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
					<div className="flex items-center gap-2">
						<span className="rounded bg-yellow-500 px-2 py-0.5 text-xs text-white">
							{item.type === 'idea_trip' ? '旅行アイデア' : '月イベント'}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{item.year}年{item.month}月
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</div>
			)
		case 'blocked':
			return (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4">
					<div className="flex items-center gap-2">
						<span className="rounded bg-red-500 px-2 py-0.5 text-xs text-white">ブロック</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</div>
			)
		case 'holiday':
			return (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4">
					<div className="flex items-center gap-2">
						<span className="rounded bg-green-500 px-2 py-0.5 text-xs text-white">祝日</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">{item.date}</div>
				</div>
			)
		case 'vacant':
			return (
				<div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
					<div className="flex items-center gap-2">
						<span className="rounded bg-purple-500 px-2 py-0.5 text-xs text-white">空き期間</span>
						<span className="font-medium">
							{item.days}日間{item.isLongWeekend && ' (連休)'}
						</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
				</div>
			)
	}
}

function eventTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		trip: '旅行',
		anniversary: '記念日',
		school: '学校',
		personal: '個人',
		other: 'その他',
	}
	return labels[type] ?? type
}

function formatDateRange(start: string, end: string): string {
	const startDate = new Date(start)
	const endDate = new Date(end)
	const startStr = format(startDate, 'M/d(E)', { locale: ja })
	const endStr = format(endDate, 'M/d(E)', { locale: ja })
	if (start === end) {
		return startStr
	}
	return `${startStr} 〜 ${endStr}`
}
