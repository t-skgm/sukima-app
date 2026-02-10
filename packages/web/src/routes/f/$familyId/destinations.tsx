import type { DestinationOutput } from '@sukima/api/src/usecases/destinations'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { DestinationForm } from '@/components/destination-form'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

export const Route = createFileRoute('/f/$familyId/destinations')({
	component: DestinationsPage,
})

function DestinationsPage() {
	const api = useFamilyApi()
	const rangeStart = dayjs().format('YYYY-MM-DD')
	const { data, isLoading, error } = useQuery(
		api.destinations.list.queryOptions({ input: { rangeStart } }),
	)

	const [addOpen, setAddOpen] = useState(false)
	const [editingDest, setEditingDest] = useState<DestinationOutput | null>(null)
	const [deletingDest, setDeletingDest] = useState<DestinationOutput | null>(null)

	const { invalidate } = useInvalidateOnSuccess()

	const deleteMutation = useMutation({
		...api.destinations.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.destinations.list.key()).onSuccess()
			setDeletingDest(null)
			setEditingDest(null)
		},
	})

	const toggleDoneMutation = useMutation({
		...api.destinations.update.mutationOptions(),
		onSuccess: () => {
			invalidate(api.destinations.list.key()).onSuccess()
		},
	})

	if (isLoading) {
		return (
			<div className="p-4">
				<div className="animate-pulse">
					<div className="mb-4 h-8 w-48 rounded bg-gray-200" />
					<div className="space-y-3">
						<div className="h-24 rounded bg-gray-200" />
						<div className="h-24 rounded bg-gray-200" />
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-4">
				<h1 className="mb-4 text-xl font-bold text-red-600">エラー</h1>
				<p className="text-gray-600">行き先の読み込みに失敗しました: {error.message}</p>
			</div>
		)
	}

	return (
		<div className="p-4">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-xl font-bold">行き先ストック</h1>
				<Button size="sm" onClick={() => setAddOpen(true)}>
					<Plus className="mr-1 h-4 w-4" />
					追加
				</Button>
			</div>

			{data && (
				<>
					<section className="mb-8">
						<h2 className="mb-3 text-lg font-semibold text-gray-700">
							行きたい場所 ({data.active.length})
						</h2>
						{data.active.length === 0 ? (
							<p className="text-gray-400">行きたい場所がありません。追加してみましょう！</p>
						) : (
							<div className="space-y-3">
								{data.active.map((dest) => (
									<DestinationCard
										key={dest.id}
										destination={dest}
										onClick={() => setEditingDest(dest)}
										onToggleDone={() => toggleDoneMutation.mutate({ id: dest.id, isDone: true })}
									/>
								))}
							</div>
						)}
					</section>

					{data.done.length > 0 && (
						<section>
							<h2 className="mb-3 text-lg font-semibold text-gray-500">
								達成済み ({data.done.length})
							</h2>
							<div className="space-y-3 opacity-60">
								{data.done.map((dest) => (
									<DestinationCard
										key={dest.id}
										destination={dest}
										isDone
										onClick={() => setEditingDest(dest)}
										onToggleDone={() => toggleDoneMutation.mutate({ id: dest.id, isDone: false })}
									/>
								))}
							</div>
						</section>
					)}
				</>
			)}

			{/* 追加Sheet */}
			<Sheet open={addOpen} onOpenChange={setAddOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>行き先を追加</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto px-4 pb-4">
						<DestinationForm mode="create" onSuccess={() => setAddOpen(false)} />
					</div>
				</SheetContent>
			</Sheet>

			{/* 編集Sheet */}
			<Sheet open={!!editingDest} onOpenChange={(open) => !open && setEditingDest(null)}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>行き先を編集</SheetTitle>
					</SheetHeader>
					{editingDest && (
						<div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
							<DestinationForm
								mode="edit"
								initialData={editingDest}
								onSuccess={() => setEditingDest(null)}
							/>
							<Button
								variant="destructive"
								className="w-full"
								onClick={() => setDeletingDest(editingDest)}
							>
								削除
							</Button>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* 削除確認 */}
			<DeleteConfirmDialog
				open={!!deletingDest}
				onOpenChange={(open) => !open && setDeletingDest(null)}
				onConfirm={() => deletingDest && deleteMutation.mutate({ id: deletingDest.id })}
				isPending={deleteMutation.isPending}
				itemName={deletingDest?.name ?? ''}
			/>
		</div>
	)
}

function DestinationCard({
	destination,
	isDone = false,
	onClick,
	onToggleDone,
}: {
	destination: DestinationOutput
	isDone?: boolean
	onClick: () => void
	onToggleDone: () => void
}) {
	return (
		<button
			type="button"
			className={`w-full cursor-pointer rounded-lg border p-4 text-left transition-shadow hover:shadow-md ${
				isDone ? 'border-gray-200 bg-gray-50' : 'border-teal-200 bg-teal-50'
			}`}
			onClick={onClick}
		>
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-medium">{destination.name}</h3>
					<p className="mt-1 text-sm text-gray-600">必要日数: {destination.requiredDays}日</p>
					{destination.memo && <p className="mt-2 text-sm text-gray-500">{destination.memo}</p>}
				</div>
				<Button
					size="sm"
					variant={isDone ? 'outline' : 'default'}
					className="shrink-0"
					onClick={(e) => {
						e.stopPropagation()
						onToggleDone()
					}}
				>
					{isDone ? '未達成に戻す' : '達成'}
				</Button>
			</div>

			{destination.suggestions.length > 0 && (
				<div className="mt-3 border-t border-teal-100 pt-3">
					<p className="mb-2 text-xs font-medium text-gray-500">おすすめ日程</p>
					<div className="flex flex-wrap gap-2">
						{destination.suggestions.map((suggestion) => (
							<span
								key={`${suggestion.startDate}-${suggestion.endDate}`}
								className="rounded-full bg-white px-2 py-1 text-xs text-gray-700 shadow-sm"
							>
								{suggestion.label}: {suggestion.startDate} 〜 {suggestion.endDate}
							</span>
						))}
					</div>
				</div>
			)}
		</button>
	)
}
