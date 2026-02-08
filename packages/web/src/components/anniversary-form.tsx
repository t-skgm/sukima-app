import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

type AnniversaryFormData = {
	id?: number
	title: string
	month: number
	day: number
	memo: string
}

type AnniversaryFormProps = {
	mode: 'create' | 'edit'
	initialData?: AnniversaryFormData
	onSuccess: () => void
}

export function AnniversaryForm({ mode, initialData, onSuccess }: AnniversaryFormProps) {
	const [title, setTitle] = useState(initialData?.title ?? '')
	const [month, setMonth] = useState(initialData?.month ?? new Date().getMonth() + 1)
	const [day, setDay] = useState(initialData?.day ?? new Date().getDate())
	const [memo, setMemo] = useState(initialData?.memo ?? '')

	const api = useFamilyApi()
	const { invalidate } = useInvalidateOnSuccess()

	const createMutation = useMutation({
		...api.anniversaries.create.mutationOptions(),
		onSuccess: () => {
			invalidate(api.anniversaries.list.key()).onSuccess()
			onSuccess()
		},
	})

	const updateMutation = useMutation({
		...api.anniversaries.update.mutationOptions(),
		onSuccess: () => {
			invalidate(api.anniversaries.list.key()).onSuccess()
			onSuccess()
		},
	})

	const mutation = mode === 'create' ? createMutation : updateMutation
	const isPending = mutation.isPending

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (mode === 'create') {
			createMutation.mutate({
				title,
				month,
				day,
				memo: memo || undefined,
			})
		} else if (initialData?.id) {
			updateMutation.mutate({
				id: initialData.id,
				title,
				month,
				day,
				memo,
			})
		}
	}

	// 月に応じた日数（うるう年対応のため2024年を基準）
	const daysInMonth = new Date(2024, month, 0).getDate()
	const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1)

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

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label>月</Label>
					<Select
						value={String(month)}
						onValueChange={(v) => {
							const newMonth = Number(v)
							setMonth(newMonth)
							const maxDay = new Date(2024, newMonth, 0).getDate()
							if (day > maxDay) setDay(maxDay)
						}}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MONTHS.map((m) => (
								<SelectItem key={m} value={String(m)}>
									{m}月
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>日</Label>
					<Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{DAYS.map((d) => (
								<SelectItem key={d} value={String(d)}>
									{d}日
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
