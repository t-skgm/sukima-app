import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

type IdeaType = 'trip' | 'monthly'

type ConfirmIdeaDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	ideaType: IdeaType
	ideaId: number
	ideaTitle: string
	onSuccess: () => void
}

export function ConfirmIdeaDialog({
	open,
	onOpenChange,
	ideaType,
	ideaId,
	ideaTitle,
	onSuccess,
}: ConfirmIdeaDialogProps) {
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')

	const api = useFamilyApi()
	const { invalidate } = useInvalidateOnSuccess()

	const onMutationSuccess = () => {
		const listKey = ideaType === 'trip' ? api.ideas.trips.list.key() : api.ideas.monthly.list.key()
		invalidate(listKey, api.events.list.key()).onSuccess()
		setStartDate('')
		setEndDate('')
		onSuccess()
	}

	const tripConfirm = useMutation({
		...api.ideas.trips.confirm.mutationOptions(),
		onSuccess: onMutationSuccess,
	})

	const monthlyConfirm = useMutation({
		...api.ideas.monthly.confirm.mutationOptions(),
		onSuccess: onMutationSuccess,
	})

	const confirmMutation = ideaType === 'trip' ? tripConfirm : monthlyConfirm

	const handleConfirm = (e: React.FormEvent) => {
		e.preventDefault()
		confirmMutation.mutate({ id: ideaId, startDate, endDate })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>日程を確定</DialogTitle>
					<DialogDescription>
						「{ideaTitle}」の日程を確定してイベントに変換します。
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleConfirm} className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor="confirmStartDate">開始日</Label>
							<Input
								id="confirmStartDate"
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmEndDate">終了日</Label>
							<Input
								id="confirmEndDate"
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								required
								min={startDate}
							/>
						</div>
					</div>

					{confirmMutation.error && (
						<p className="text-sm text-red-500">{confirmMutation.error.message}</p>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={confirmMutation.isPending}
						>
							キャンセル
						</Button>
						<Button type="submit" disabled={confirmMutation.isPending}>
							{confirmMutation.isPending ? '変換中...' : '確定'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
