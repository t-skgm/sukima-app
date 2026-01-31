import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

type DeleteConfirmDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	isPending: boolean
	itemName: string
}

export function DeleteConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	isPending,
	itemName,
}: DeleteConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>削除の確認</DialogTitle>
					<DialogDescription>
						「{itemName}」を削除しますか？この操作は取り消せません。
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
						キャンセル
					</Button>
					<Button variant="destructive" onClick={onConfirm} disabled={isPending}>
						{isPending ? '削除中...' : '削除'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
