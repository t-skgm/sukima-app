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

	const baseClass = isClickable
		? 'cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5'
		: ''

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
					className={`w-full rounded-xl border border-blue-100 border-l-4 border-l-blue-500 bg-white p-4 text-left shadow-sm ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-2.5 py-0.5 text-xs font-medium text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1.5 text-sm text-gray-500">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-400">{item.memo}</p>}
				</Wrapper>
			)
		case 'anniversary':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-xl border border-pink-100 border-l-4 border-l-pink-500 bg-white p-4 text-left shadow-sm ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-2.5 py-0.5 text-xs font-medium text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1.5 text-sm text-gray-500">{formatDateJa(item.date)}</div>
					{item.memo && <p className="mt-2 text-sm text-gray-400">{item.memo}</p>}
				</Wrapper>
			)
		case 'idea_trip':
		case 'idea_monthly':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-xl border border-amber-100 border-l-4 border-l-amber-400 bg-white p-4 text-left shadow-sm ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-xs font-medium text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1.5 text-sm text-gray-500">
						{item.year}年{item.month}月
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-400">{item.memo}</p>}
				</Wrapper>
			)
		case 'blocked':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-xl border border-red-100 border-l-4 border-l-red-500 bg-white p-4 text-left shadow-sm ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-2.5 py-0.5 text-xs font-medium text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1.5 text-sm text-gray-500">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-400">{item.memo}</p>}
				</Wrapper>
			)
		case 'holiday':
			return (
				<div className="rounded-xl border border-emerald-100 border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 text-xs font-medium text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1.5 text-sm text-gray-500">{formatDateJa(item.date)}</div>
				</div>
			)
		case 'vacant':
			return (
				<Wrapper
					type={isClickable ? 'button' : undefined}
					className={`w-full rounded-xl border border-violet-100 border-l-4 border-l-violet-500 bg-white p-4 text-left shadow-sm ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-2.5 py-0.5 text-xs font-medium text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">
							{item.days}日間{item.isLongWeekend && ' (連休)'}
						</span>
					</div>
					<div className="mt-1.5 text-sm text-gray-500">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
				</Wrapper>
			)
		case 'external':
			return (
				<div className="rounded-xl border border-gray-100 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-400 to-gray-500 px-2.5 py-0.5 text-xs font-medium text-white">
							{badge.icon} {badge.label}
						</span>
						<span className="font-medium">{item.title}</span>
					</div>
					<div className="mt-1.5 text-sm text-gray-500">
						{formatDateRange(item.startDate, item.endDate)}
					</div>
					{item.memo && <p className="mt-2 text-sm text-gray-400">{item.memo}</p>}
				</div>
			)
	}
}

function getCompactColorClass(type: CalendarItem['type']): string {
	switch (type) {
		case 'event':
			return 'border-blue-100 border-l-2 border-l-blue-500 bg-white shadow-sm'
		case 'anniversary':
			return 'border-pink-100 border-l-2 border-l-pink-500 bg-white shadow-sm'
		case 'idea_trip':
		case 'idea_monthly':
			return 'border-amber-100 border-l-2 border-l-amber-400 bg-white shadow-sm'
		case 'blocked':
			return 'border-red-100 border-l-2 border-l-red-500 bg-white shadow-sm'
		case 'holiday':
			return 'border-emerald-100 border-l-2 border-l-emerald-500 bg-white shadow-sm'
		case 'vacant':
			return 'border-violet-100 border-l-2 border-l-violet-500 bg-white shadow-sm'
		case 'external':
			return 'border-gray-100 border-l-2 border-l-slate-400 bg-white shadow-sm'
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
