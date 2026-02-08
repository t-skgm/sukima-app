import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

type AnniversaryFormData = {
	id?: number
	title: string
	date: string
	memo: string
}

type AnniversaryFormProps = {
	mode: 'create' | 'edit'
	initialData?: AnniversaryFormData
	onSuccess: () => void
}

export function AnniversaryForm({ mode, initialData, onSuccess }: AnniversaryFormProps) {
	const [title, setTitle] = useState(initialData?.title ?? '')
	const [date, setDate] = useState(initialData?.date ?? '')
	const [memo, setMemo] = useState(initialData?.memo ?? '')

	const api = useFamilyApi()
	const { invalidate } = useInvalidateOnSuccess()

	const createMutation = useMutation({
		...api.events.create.mutationOptions(),
		onSuccess: () => {
			invalidate(api.events.list.key()).onSuccess()
			onSuccess()
		},
	})

	const updateMutation = useMutation({
		...api.events.update.mutationOptions(),
		onSuccess: () => {
			invalidate(api.events.list.key()).onSuccess()
			onSuccess()
		},
	})

	const mutation = mode === 'create' ? createMutation : updateMutation
	const isPending = mutation.isPending

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (mode === 'create') {
			createMutation.mutate({
				eventType: 'anniversary',
				title,
				startDate: date,
				endDate: date,
				memo: memo || undefined,
			})
		} else if (initialData?.id) {
			updateMutation.mutate({
				id: initialData.id,
				eventType: 'anniversary',
				title,
				startDate: date,
				endDate: date,
				memo,
			})
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
					placeholder="誕生日、結婚記念日など"
					required
					maxLength={100}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="date">日付</Label>
				<Input
					id="date"
					type="date"
					value={date}
					onChange={(e) => setDate(e.target.value)}
					required
				/>
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
