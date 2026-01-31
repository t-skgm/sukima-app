import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear + i)

type IdeaType = 'trip' | 'monthly'

type IdeaFormData = {
	id?: number
	title: string
	year: number
	month: number
	memo: string
}

type IdeaFormProps = {
	ideaType: IdeaType
	mode: 'create' | 'edit'
	initialData?: IdeaFormData
	onSuccess: () => void
}

export function IdeaForm({ ideaType, mode, initialData, onSuccess }: IdeaFormProps) {
	const [title, setTitle] = useState(initialData?.title ?? '')
	const [year, setYear] = useState(initialData?.year ?? currentYear)
	const [month, setMonth] = useState(initialData?.month ?? new Date().getMonth() + 1)
	const [memo, setMemo] = useState(initialData?.memo ?? '')

	const api = useFamilyApi()
	const { invalidate } = useInvalidateOnSuccess()

	const ideaApi = ideaType === 'trip' ? api.ideas.trips : api.ideas.monthly

	const createMutation = useMutation({
		...ideaApi.create.mutationOptions(),
		onSuccess: () => {
			invalidate(ideaApi.list.key()).onSuccess()
			onSuccess()
		},
	})

	const updateMutation = useMutation({
		...ideaApi.update.mutationOptions(),
		onSuccess: () => {
			invalidate(ideaApi.list.key()).onSuccess()
			onSuccess()
		},
	})

	const mutation = mode === 'create' ? createMutation : updateMutation
	const isPending = mutation.isPending

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (mode === 'create') {
			createMutation.mutate({ title, year, month, memo: memo || undefined })
		} else if (initialData?.id) {
			updateMutation.mutate({ id: initialData.id, title, year, month, memo })
		}
	}

	const label = ideaType === 'trip' ? '旅行アイデア' : '月イベント'

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="title">タイトル</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder={`${label}のタイトル`}
					required
					maxLength={100}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label htmlFor="year">年</Label>
					<select
						id="year"
						value={year}
						onChange={(e) => setYear(Number(e.target.value))}
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
					>
						{YEARS.map((y) => (
							<option key={y} value={y}>
								{y}年
							</option>
						))}
					</select>
				</div>
				<div className="space-y-2">
					<Label htmlFor="month">月</Label>
					<select
						id="month"
						value={month}
						onChange={(e) => setMonth(Number(e.target.value))}
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
					>
						{MONTHS.map((m) => (
							<option key={m} value={m}>
								{m}月
							</option>
						))}
					</select>
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
