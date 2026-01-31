import type { DestinationOutput } from '@sukima/api/src/usecases/destinations'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

type DestinationFormProps = {
	mode: 'create' | 'edit'
	initialData?: DestinationOutput
	onSuccess: () => void
}

export function DestinationForm({ mode, initialData, onSuccess }: DestinationFormProps) {
	const [name, setName] = useState(initialData?.name ?? '')
	const [requiredDays, setRequiredDays] = useState(initialData?.requiredDays ?? 1)
	const [memo, setMemo] = useState(initialData?.memo ?? '')

	const api = useFamilyApi()
	const { invalidate } = useInvalidateOnSuccess()

	const createMutation = useMutation({
		...api.destinations.create.mutationOptions(),
		onSuccess: () => {
			invalidate(api.destinations.list.key()).onSuccess()
			onSuccess()
		},
	})

	const updateMutation = useMutation({
		...api.destinations.update.mutationOptions(),
		onSuccess: () => {
			invalidate(api.destinations.list.key()).onSuccess()
			onSuccess()
		},
	})

	const mutation = mode === 'create' ? createMutation : updateMutation
	const isPending = mutation.isPending

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (mode === 'create') {
			createMutation.mutate({ name, requiredDays, memo: memo || undefined })
		} else if (initialData) {
			updateMutation.mutate({ id: initialData.id, name, requiredDays, memo })
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">名前</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="行き先の名前"
					required
					maxLength={100}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="requiredDays">必要日数</Label>
				<Input
					id="requiredDays"
					type="number"
					min={1}
					max={14}
					value={requiredDays}
					onChange={(e) => setRequiredDays(Number(e.target.value))}
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
