import type { CalendarItem } from '@sukima/api/src/usecases/calendar'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { CalendarPlus, Plus } from 'lucide-react'
import { useState } from 'react'
import { AnniversaryForm } from '@/components/anniversary-form'
import { BlockedPeriodForm } from '@/components/blocked-period-form'
import { formatDateJa, splitByViewMode } from '@/components/calendar/calendar-helpers'
import { CompressedView } from '@/components/calendar/compressed-view'
import { MonthlyView } from '@/components/calendar/monthly-view'
import { WeeklyView } from '@/components/calendar/weekly-view'
import { ConfirmIdeaDialog } from '@/components/confirm-idea-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { EventForm } from '@/components/event-form'
import { IdeaForm } from '@/components/idea-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { VacantActionSheet } from '@/components/vacant-action-sheet'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

export const Route = createFileRoute('/f/$familyId/')({
	component: CalendarPage,
})

type AddType = 'event' | 'anniversary' | 'blocked' | 'idea_trip' | 'idea_monthly'
type EditableItem = Extract<
	CalendarItem,
	{ type: 'event' | 'anniversary' | 'blocked' | 'idea_trip' | 'idea_monthly' }
>
type VacantItem = Extract<CalendarItem, { type: 'vacant' }>

function CalendarPage() {
	const api = useFamilyApi()
	const rangeStart = dayjs().format('YYYY-MM-DD')
	const { data, isLoading, error } = useQuery(
		api.calendar.get.queryOptions({ input: { rangeStart } }),
	)

	const [addMenuOpen, setAddMenuOpen] = useState(false)
	const [addingType, setAddingType] = useState<AddType | null>(null)
	const [editingItem, setEditingItem] = useState<EditableItem | null>(null)
	const [deletingItem, setDeletingItem] = useState<EditableItem | null>(null)
	const [confirmingIdea, setConfirmingIdea] = useState<{
		type: 'idea_trip' | 'idea_monthly'
		id: number
		title: string
	} | null>(null)
	const [selectedVacant, setSelectedVacant] = useState<VacantItem | null>(null)

	// アイデア追加時の年月プリフィル
	const [ideaDefaultYear, setIdeaDefaultYear] = useState<number | undefined>()
	const [ideaDefaultMonth, setIdeaDefaultMonth] = useState<number | undefined>()

	// EventFormのdefaultValues（空き期間からの予定追加用）
	const [eventDefaultValues, setEventDefaultValues] = useState<
		| Partial<{
				eventType: 'trip' | 'school' | 'personal' | 'other'
				title: string
				startDate: string
				endDate: string
		  }>
		| undefined
	>()

	const { invalidate } = useInvalidateOnSuccess()

	const deleteEventMutation = useMutation({
		...api.events.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.events.list.key()).onSuccess()
			setDeletingItem(null)
			setEditingItem(null)
		},
	})

	const deleteAnniversaryMutation = useMutation({
		...api.anniversaries.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.anniversaries.list.key()).onSuccess()
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
			case 'anniversary':
				deleteAnniversaryMutation.mutate({ id: deletingItem.id })
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
		deleteAnniversaryMutation.isPending ||
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
			item.type === 'anniversary' ||
			item.type === 'blocked' ||
			item.type === 'idea_trip' ||
			item.type === 'idea_monthly'
		) {
			setEditingItem(item)
		} else if (item.type === 'vacant') {
			setSelectedVacant(item)
		}
	}

	const handleMonthClick = (year: number, month: number) => {
		setIdeaDefaultYear(year)
		setIdeaDefaultMonth(month)
		setAddingType('idea_trip')
	}

	const handleVacantAddEvent = (defaultVals?: {
		eventType?: 'trip' | 'school' | 'personal' | 'other'
		title?: string
		startDate?: string
		endDate?: string
	}) => {
		setSelectedVacant(null)
		setEventDefaultValues(defaultVals)
		setAddingType('event')
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

	const viewGroups = data ? splitByViewMode(data.items) : null

	return (
		<div className="p-4 pb-24">
			<h1 className="mb-4 text-xl font-bold text-gray-800">カレンダー</h1>
			{data && viewGroups && (
				<>
					<p className="mb-4 inline-block rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-600">
						{formatDateJa(data.rangeStart)} 〜 {formatDateJa(data.rangeEnd)}
					</p>

					{data.items.length === 0 ? (
						<p className="text-gray-400">予定がありません</p>
					) : (
						<div className="space-y-6">
							{/* 直近3ヶ月: 週単位表示 */}
							{viewGroups.weekly.length > 0 && (
								<section>
									<WeeklyView items={viewGroups.weekly} onItemClick={handleCardClick} />
								</section>
							)}

							{/* 4〜12ヶ月先: 月単位表示 */}
							{viewGroups.monthly.length > 0 && (
								<section>
									<h2 className="mb-3 border-t border-gray-100 pt-3 text-sm font-bold text-gray-400">
										今後の予定
									</h2>
									<MonthlyView
										items={viewGroups.monthly}
										onItemClick={handleCardClick}
										onMonthClick={handleMonthClick}
									/>
								</section>
							)}

							{/* 13〜24ヶ月先: 圧縮表示 */}
							{viewGroups.compressed.length > 0 && (
								<section>
									<h2 className="mb-3 border-t border-gray-100 pt-3 text-sm font-bold text-gray-400">
										来年以降
									</h2>
									<CompressedView items={viewGroups.compressed} onMonthClick={handleMonthClick} />
								</section>
							)}
						</div>
					)}
				</>
			)}

			{/* FAB */}
			<button
				type="button"
				className="fixed right-4 bottom-20 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg shadow-orange-200 transition-all hover:scale-110 hover:shadow-xl hover:shadow-orange-300 active:scale-95"
				onClick={() => setAddMenuOpen(true)}
			>
				<Plus className="h-6 w-6 stroke-[2.5]" />
			</button>

			{/* 追加メニュー */}
			<Dialog open={addMenuOpen} onOpenChange={setAddMenuOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>追加する項目</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2">
						{[
							{
								type: 'event' as const,
								label: '予定',
								icon: '📅',
								color: 'hover:bg-blue-50 hover:border-blue-200',
							},
							{
								type: 'anniversary' as const,
								label: '記念日',
								icon: '🎂',
								color: 'hover:bg-pink-50 hover:border-pink-200',
							},
							{
								type: 'blocked' as const,
								label: 'ブロック期間',
								icon: '🚫',
								color: 'hover:bg-red-50 hover:border-red-200',
							},
							{
								type: 'idea_trip' as const,
								label: '旅行アイデア',
								icon: '✈️',
								color: 'hover:bg-amber-50 hover:border-amber-200',
							},
							{
								type: 'idea_monthly' as const,
								label: '月イベント',
								icon: '💡',
								color: 'hover:bg-yellow-50 hover:border-yellow-200',
							},
						].map(({ type, label, icon, color }) => (
							<Button
								key={type}
								variant="outline"
								className={`justify-start text-left transition-colors ${color}`}
								onClick={() => openAdd(type)}
							>
								<span className="mr-2 text-lg">{icon}</span>
								{label}
							</Button>
						))}
					</div>
				</DialogContent>
			</Dialog>

			{/* 追加Sheet */}
			<Sheet
				open={!!addingType}
				onOpenChange={(open) => {
					if (!open) {
						setAddingType(null)
						setIdeaDefaultYear(undefined)
						setIdeaDefaultMonth(undefined)
						setEventDefaultValues(undefined)
					}
				}}
			>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>
							{addingType === 'event' && '予定を追加'}
							{addingType === 'anniversary' && '記念日を追加'}
							{addingType === 'blocked' && 'ブロック期間を追加'}
							{addingType === 'idea_trip' && '旅行アイデアを追加'}
							{addingType === 'idea_monthly' && '月イベントを追加'}
						</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto px-4 pb-4">
						{addingType === 'event' && (
							<EventForm
								mode="create"
								defaultValues={eventDefaultValues}
								onSuccess={() => {
									setAddingType(null)
									setEventDefaultValues(undefined)
								}}
							/>
						)}
						{addingType === 'anniversary' && (
							<AnniversaryForm mode="create" onSuccess={() => setAddingType(null)} />
						)}
						{addingType === 'blocked' && (
							<BlockedPeriodForm mode="create" onSuccess={() => setAddingType(null)} />
						)}
						{addingType === 'idea_trip' && (
							<IdeaForm
								ideaType="trip"
								mode="create"
								defaultYear={ideaDefaultYear}
								defaultMonth={ideaDefaultMonth}
								onSuccess={() => {
									setAddingType(null)
									setIdeaDefaultYear(undefined)
									setIdeaDefaultMonth(undefined)
								}}
							/>
						)}
						{addingType === 'idea_monthly' && (
							<IdeaForm
								ideaType="monthly"
								mode="create"
								defaultYear={ideaDefaultYear}
								defaultMonth={ideaDefaultMonth}
								onSuccess={() => {
									setAddingType(null)
									setIdeaDefaultYear(undefined)
									setIdeaDefaultMonth(undefined)
								}}
							/>
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
							{editingItem?.type === 'anniversary' && '記念日を編集'}
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
							{editingItem.type === 'anniversary' && (
								<AnniversaryForm
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

			{/* 空き期間アクション */}
			{selectedVacant && (
				<VacantActionSheet
					open={!!selectedVacant}
					onOpenChange={(open) => !open && setSelectedVacant(null)}
					vacant={selectedVacant}
					onAddEvent={handleVacantAddEvent}
				/>
			)}

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
