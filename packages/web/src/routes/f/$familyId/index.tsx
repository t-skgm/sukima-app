import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarPlus, Plus } from 'lucide-react'
import { useState } from 'react'
import { BlockedPeriodForm } from '@/components/blocked-period-form'
import { ConfirmIdeaDialog } from '@/components/confirm-idea-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { EventForm } from '@/components/event-form'
import { IdeaForm } from '@/components/idea-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

export const Route = createFileRoute('/f/$familyId/')({
	component: CalendarPage,
})

type AddType = 'event' | 'blocked' | 'idea_trip' | 'idea_monthly'
type EditableItem = Extract<
	CalendarItem,
	{ type: 'event' | 'blocked' | 'idea_trip' | 'idea_monthly' }
>

function CalendarPage() {
	const api = useFamilyApi()
	const { data, isLoading, error } = useQuery(api.calendar.get.queryOptions({ input: {} }))

	const [addMenuOpen, setAddMenuOpen] = useState(false)
	const [addingType, setAddingType] = useState<AddType | null>(null)
	const [editingItem, setEditingItem] = useState<EditableItem | null>(null)
	const [deletingItem, setDeletingItem] = useState<EditableItem | null>(null)
	const [confirmingIdea, setConfirmingIdea] = useState<{
		type: 'idea_trip' | 'idea_monthly'
		id: number
		title: string
	} | null>(null)

	const { invalidate } = useInvalidateOnSuccess()

	const deleteEventMutation = useMutation({
		...api.events.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.events.list.key()).onSuccess()
			setDeletingItem(null)
			setEditingItem(null)
		},
	})

	const deleteBlockedMutation = useMutation({
		...api.blockedPeriods.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.blockedPeriods.list.key()).onSuccess()
			setDeletingItem(null)
			setEditingItem(null)
		},
	})

	const deleteTripIdeaMutation = useMutation({
		...api.ideas.trips.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.ideas.trips.list.key()).onSuccess()
			setDeletingItem(null)
			setEditingItem(null)
		},
	})

	const deleteMonthlyIdeaMutation = useMutation({
		...api.ideas.monthly.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.ideas.monthly.list.key()).onSuccess()
			setDeletingItem(null)
			setEditingItem(null)
		},
	})

	const handleDelete = () => {
		if (!deletingItem) return
		switch (deletingItem.type) {
			case 'event':
				deleteEventMutation.mutate({ id: deletingItem.id })
				break
			case 'blocked':
				deleteBlockedMutation.mutate({ id: deletingItem.id })
				break
			case 'idea_trip':
				deleteTripIdeaMutation.mutate({ id: deletingItem.id })
				break
			case 'idea_monthly':
				deleteMonthlyIdeaMutation.mutate({ id: deletingItem.id })
				break
		}
	}

	const isDeletePending =
		deleteEventMutation.isPending ||
		deleteBlockedMutation.isPending ||
		deleteTripIdeaMutation.isPending ||
		deleteMonthlyIdeaMutation.isPending

	const openAdd = (type: AddType) => {
		setAddMenuOpen(false)
		setAddingType(type)
	}

	const handleCardClick = (item: CalendarItem) => {
		if (
			item.type === 'event' ||
			item.type === 'blocked' ||
			item.type === 'idea_trip' ||
			item.type === 'idea_monthly'
		) {
			setEditingItem(item)
		}
	}

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
		<div className="p-4 pb-24">
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
								<CalendarItemCard
									key={`${item.type}-${index}`}
									item={item}
									onClick={() => handleCardClick(item)}
								/>
							))
						)}
					</div>
				</>
			)}

			{/* FAB */}
			<Button
				size="lg"
				className="fixed right-4 bottom-20 z-10 h-14 w-14 rounded-full shadow-lg"
				onClick={() => setAddMenuOpen(true)}
			>
				<Plus className="h-6 w-6" />
			</Button>

			{/* 追加メニュー */}
			<Dialog open={addMenuOpen} onOpenChange={setAddMenuOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>追加する項目</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2">
						{[
							{ type: 'event' as const, label: '予定', icon: '📅' },
							{ type: 'blocked' as const, label: 'ブロック期間', icon: '🚫' },
							{ type: 'idea_trip' as const, label: '旅行アイデア', icon: '✈️' },
							{ type: 'idea_monthly' as const, label: '月イベント', icon: '💡' },
						].map(({ type, label, icon }) => (
							<Button
								key={type}
								variant="outline"
								className="justify-start text-left"
								onClick={() => openAdd(type)}
							>
								<span className="mr-2">{icon}</span>
								{label}
							</Button>
						))}
					</div>
				</DialogContent>
			</Dialog>

			{/* 追加Sheet */}
			<Sheet open={!!addingType} onOpenChange={(open) => !open && setAddingType(null)}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>
							{addingType === 'event' && '予定を追加'}
							{addingType === 'blocked' && 'ブロック期間を追加'}
							{addingType === 'idea_trip' && '旅行アイデアを追加'}
							{addingType === 'idea_monthly' && '月イベントを追加'}
						</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto px-4 pb-4">
						{addingType === 'event' && (
							<EventForm mode="create" onSuccess={() => setAddingType(null)} />
						)}
						{addingType === 'blocked' && (
							<BlockedPeriodForm mode="create" onSuccess={() => setAddingType(null)} />
						)}
						{addingType === 'idea_trip' && (
							<IdeaForm ideaType="trip" mode="create" onSuccess={() => setAddingType(null)} />
						)}
						{addingType === 'idea_monthly' && (
							<IdeaForm ideaType="monthly" mode="create" onSuccess={() => setAddingType(null)} />
						)}
					</div>
				</SheetContent>
			</Sheet>

			{/* 編集Sheet */}
			<Sheet open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>
							{editingItem?.type === 'event' && '予定を編集'}
							{editingItem?.type === 'blocked' && 'ブロック期間を編集'}
							{editingItem?.type === 'idea_trip' && '旅行アイデアを編集'}
							{editingItem?.type === 'idea_monthly' && '月イベントを編集'}
						</SheetTitle>
					</SheetHeader>
					{editingItem && (
						<div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
							{editingItem.type === 'event' && (
								<EventForm
									mode="edit"
									initialData={editingItem}
									onSuccess={() => setEditingItem(null)}
								/>
							)}
							{editingItem.type === 'blocked' && (
								<BlockedPeriodForm
									mode="edit"
									initialData={editingItem}
									onSuccess={() => setEditingItem(null)}
								/>
							)}
							{editingItem.type === 'idea_trip' && (
								<>
									<IdeaForm
										ideaType="trip"
										mode="edit"
										initialData={editingItem}
										onSuccess={() => setEditingItem(null)}
									/>
									<Button
										variant="outline"
										className="w-full"
										onClick={() => {
											setConfirmingIdea({
												type: 'idea_trip',
												id: editingItem.id,
												title: editingItem.title,
											})
										}}
									>
										<CalendarPlus className="mr-1 h-4 w-4" />
										日程を確定
									</Button>
								</>
							)}
							{editingItem.type === 'idea_monthly' && (
								<>
									<IdeaForm
										ideaType="monthly"
										mode="edit"
										initialData={editingItem}
										onSuccess={() => setEditingItem(null)}
									/>
									<Button
										variant="outline"
										className="w-full"
										onClick={() => {
											setConfirmingIdea({
												type: 'idea_monthly',
												id: editingItem.id,
												title: editingItem.title,
											})
										}}
									>
										<CalendarPlus className="mr-1 h-4 w-4" />
										日程を確定
									</Button>
								</>
							)}
							<Button
								variant="destructive"
								className="w-full"
								onClick={() => setDeletingItem(editingItem)}
							>
								削除
							</Button>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* 削除確認 */}
			<DeleteConfirmDialog
				open={!!deletingItem}
				onOpenChange={(open) => !open && setDeletingItem(null)}
				onConfirm={handleDelete}
				isPending={isDeletePending}
				itemName={deletingItem ? ('title' in deletingItem ? deletingItem.title : '') : ''}
			/>

			{/* アイデア確定 */}
			{confirmingIdea && (
				<ConfirmIdeaDialog
					open={!!confirmingIdea}
					onOpenChange={(open) => !open && setConfirmingIdea(null)}
					ideaType={confirmingIdea.type === 'idea_trip' ? 'trip' : 'monthly'}
					ideaId={confirmingIdea.id}
					ideaTitle={confirmingIdea.title}
					onSuccess={() => {
						setConfirmingIdea(null)
						setEditingItem(null)
					}}
				/>
			)}
		</div>
	)
}

function CalendarItemCard({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
	const isEditable =
		item.type === 'event' ||
		item.type === 'blocked' ||
		item.type === 'idea_trip' ||
		item.type === 'idea_monthly'

	const baseClass = isEditable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''

	const Wrapper = isEditable ? 'button' : 'div'

	switch (item.type) {
		case 'event':
			return (
				<Wrapper
					type={isEditable ? 'button' : undefined}
					className={`w-full rounded-lg border border-blue-200 bg-blue-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
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
				</Wrapper>
			)
		case 'idea_trip':
		case 'idea_monthly':
			return (
				<Wrapper
					type={isEditable ? 'button' : undefined}
					className={`w-full rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
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
				</Wrapper>
			)
		case 'blocked':
			return (
				<Wrapper
					type={isEditable ? 'button' : undefined}
					className={`w-full rounded-lg border border-red-200 bg-red-50 p-4 text-left ${baseClass}`}
					onClick={onClick}
				>
					<div className="flex items-center gap-2">
						<span className="rounded bg-red-500 px-2 py-0.5 text-xs text-white">ブロック</span>
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
