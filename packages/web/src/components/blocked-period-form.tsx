import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

type BlockedPeriodFormData = {
	id?: number
	title: string
	startDate: string
	endDate: string
	memo: string
}

type BlockedPeriodFormProps = {
	mode: 'create' | 'edit'
	initialData?: BlockedPeriodFormData
	onSuccess: () => void
}

export function BlockedPeriodForm({ mode, initialData, onSuccess }: BlockedPeriodFormProps) {
	const [title, setTitle] = useState(initialData?.title ?? '')
	const [startDate, setStartDate] = useState(initialData?.startDate ?? '')
	const [endDate, setEndDate] = useState(initialData?.endDate ?? '')
	const [memo, setMemo] = useState(initialData?.memo ?? '')

	const api = useFamilyApi()
	const { invalidate } = useInvalidateOnSuccess()

	const createMutation = useMutation({
		...api.blockedPeriods.create.mutationOptions(),
		onSuccess: () => {
			invalidate(api.blockedPeriods.list.key()).onSuccess()
			onSuccess()
		},
	})

	const updateMutation = useMutation({
		...api.blockedPeriods.update.mutationOptions(),
		onSuccess: () => {
			invalidate(api.blockedPeriods.list.key()).onSuccess()
			onSuccess()
		},
	})

	const mutation = mode === 'create' ? createMutation : updateMutation
	const isPending = mutation.isPending

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (mode === 'create') {
			createMutation.mutate({ title, startDate, endDate, memo: memo || undefined })
		} else if (initialData?.id) {
			updateMutation.mutate({ id: initialData.id, title, startDate, endDate, memo })
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="title">タイトル</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="ブロック期間の名前"
					required
					maxLength={100}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label htmlFor="startDate">開始日</Label>
					<Input
						id="startDate"
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="endDate">終了日</Label>
					<Input
						id="endDate"
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						required
						min={startDate}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="memo">メモ</Label>
				<Textarea
					id="memo"
					value={memo}
					onChange={(e) => setMemo(e.target.value)}
					placeholder="メモ（任意）"
					maxLength={1000}
					rows={3}
				/>
			</div>

			{mutation.error && <p className="text-sm text-red-500">{mutation.error.message}</p>}

			<Button type="submit" disabled={isPending} className="w-full">
				{isPending ? '保存中...' : mode === 'create' ? '追加' : '更新'}
			</Button>
		</form>
	)
}
