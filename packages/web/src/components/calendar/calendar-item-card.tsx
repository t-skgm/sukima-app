import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import {
	Ban,
	CalendarDays,
	CalendarSync,
	GraduationCap,
	Heart,
	Lightbulb,
	Plane,
	Sparkles,
	Sunrise,
	User,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDateJa } from './calendar-helpers'

const iconClass = 'inline h-3 w-3'

type Badge = { icon: ReactNode; label: string }

const eventTypeBadges: Record<string, Badge> = {
	trip: { icon: <Plane className={iconClass} />, label: '旅行' },
	school: { icon: <GraduationCap className={iconClass} />, label: '学校' },
	personal: { icon: <User className={iconClass} />, label: '個人' },
	other: { icon: <CalendarDays className={iconClass} />, label: 'その他' },
}

/** アイテムのバッジ情報（アイコン+ラベル）を返す */
function getBadge(item: CalendarItem): Badge {
	switch (item.type) {
		case 'event':
			return eventTypeBadges[item.eventType] ?? eventTypeBadges.other
		case 'anniversary':
			return { icon: <Heart className={iconClass} />, label: '記念日' }
		case 'idea_trip':
			return { icon: <Lightbulb className={iconClass} />, label: '旅行アイデア' }
		case 'idea_monthly':
			return { icon: <Lightbulb className={iconClass} />, label: '月イベント' }
		case 'blocked':
			return { icon: <Ban className={iconClass} />, label: 'ブロック' }
		case 'holiday':
			return { icon: <Sunrise className={iconClass} />, label: '祝日' }
		case 'vacant':
			return { icon: <Sparkles className={iconClass} />, label: '空き期間' }
		case 'external':
			return { icon: <CalendarSync className={iconClass} />, label: item.calendarName }
	}
}

/** compact表示用のアイコンのみ取得 */
function getCompactIcon(item: CalendarItem): ReactNode {
	return getBadge(item).icon
}

export function formatDateRange(start: string, end: string): string {
	const startStr = dayjs(start).locale('ja').format('M/D(dd)')
	const endStr = dayjs(end).locale('ja').format('M/D(dd)')
	if (start === end) {
		return startStr
	}
	return `${startStr} 〜 ${endStr}`
}

type CalendarItemCardProps = {
	item: CalendarItem
	onClick: () => void
	compact?: boolean
}

export function CalendarItemCard({ item, onClick, compact }: CalendarItemCardProps) {
	const isEditable =
		item.type === 'event' ||
		item.type === 'anniversary' ||
		item.type === 'blocked' ||
		item.type === 'idea_trip' ||
		item.type === 'idea_monthly'

	const isClickable = isEditable || item.type === 'vacant'

	const baseClass = isClickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''

	const Wrapper = isClickable ? 'button' : 'div'
	const badge = getBadge(item)

	if (compact) {
		return (
			<Wrapper
				type={isClickable ? 'button' : undefined}
				className={`w-full rounded border p-2 text-left text-sm ${getCompactColorClass(item.type)} ${baseClass}`}
				onClick={onClick}
			>
				<span className="mr-1.5 inline-flex align-text-bottom">{getCompactIcon(item)}</span>
				{getCompactLabel(item)}
			</Wrapper>
		)
	}

	switch (item.type) {
		case 'event':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-lg border border-blue-200 bg-blue-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded bg-blue-500 px-2 py-0.5 text-xs text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</Wrapper>
			)
		case 'anniversary':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-lg border border-pink-200 bg-pink-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded bg-pink-500 px-2 py-0.5 text-xs text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">{formatDateJa(item.date)}</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</Wrapper>
			)
		case 'idea_trip':
		case 'idea_monthly':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded bg-yellow-500 px-2 py-0.5 text-xs text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{item.year}年{item.month}月
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</Wrapper>
			)
		case 'blocked':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-lg border border-red-200 bg-red-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded bg-red-500 px-2 py-0.5 text-xs text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</Wrapper>
			)
		case 'holiday':
			return (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4">
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded bg-green-500 px-2 py-0.5 text-xs text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">{formatDateJa(item.date)}</div>
				</div>
			)
		case 'vacant':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-lg border border-purple-200 bg-purple-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded bg-purple-500 px-2 py-0.5 text-xs text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">
							{item.days}日間{item.isLongWeekend && ' (連休)'}
						</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
				</Wrapper>
			)
		case 'external':
			return (
				<div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded bg-gray-500 px-2 py-0.5 text-xs text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1 text-sm text-gray-600">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-500">{item.memo}</p>}
				</div>
			)
	}
}

function getCompactColorClass(type: CalendarItem['type']): string {
	switch (type) {
		case 'event':
			return 'border-blue-200 bg-blue-50'
		case 'anniversary':
			return 'border-pink-200 bg-pink-50'
		case 'idea_trip':
		case 'idea_monthly':
			return 'border-yellow-200 bg-yellow-50'
		case 'blocked':
			return 'border-red-200 bg-red-50'
		case 'holiday':
			return 'border-green-200 bg-green-50'
		case 'vacant':
			return 'border-purple-200 bg-purple-50'
		case 'external':
			return 'border-gray-300 bg-gray-50'
	}
}

function getCompactLabel(item: CalendarItem): string {
	switch (item.type) {
		case 'event':
		case 'anniversary':
		case 'idea_trip':
		case 'idea_monthly':
		case 'blocked':
		case 'external':
			return item.title
		case 'holiday':
			return item.title
		case 'vacant':
			return `${item.days}日間の空き`
	}
}
