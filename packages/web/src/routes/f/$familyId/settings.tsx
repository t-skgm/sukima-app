import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useInvalidateOnSuccess } from '@/hooks/use-mutation-with-invalidation'
import { useFamilyApi } from '@/lib/family-api-context'

export const Route = createFileRoute('/f/$familyId/settings')({
	component: SettingsPage,
})

function SettingsPage() {
	const api = useFamilyApi()
	const [copied, setCopied] = useState(false)
	const [editing, setEditing] = useState(false)
	const [editName, setEditName] = useState('')

	const { data, isLoading, error } = useQuery(api.settings.get.queryOptions({ input: {} }))

	const { invalidate } = useInvalidateOnSuccess()
	const updateMutation = useMutation({
		...api.family.update.mutationOptions(),
		onSuccess: () => {
			invalidate(api.settings.get.key()).onSuccess()
			setEditing(false)
		},
	})

	const handleCopy = async () => {
		if (data?.family.shareUrl) {
			await navigator.clipboard.writeText(data.family.shareUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	const startEditing = () => {
		setEditName(data?.family.name ?? '')
		setEditing(true)
	}

	const handleSave = () => {
		updateMutation.mutate({ name: editName })
	}

	if (isLoading) {
		return (
			<div className="p-4">
				<div className="animate-pulse">
					<div className="mb-4 h-8 w-24 rounded bg-gray-200" />
					<div className="h-20 rounded bg-gray-200" />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-4">
				<h1 className="mb-4 text-xl font-bold text-red-600">エラー</h1>
				<p className="text-gray-600">設定の読み込みに失敗しました: {error.message}</p>
			</div>
		)
	}

	return (
		<div className="p-4">
			<h1 className="mb-6 text-xl font-bold">設定</h1>

			{data && (
				<>
					{/* 家族名 */}
					<section className="mb-6">
						<h2 className="mb-2 font-medium text-gray-700">カレンダー名</h2>
						{editing ? (
							<div className="flex items-center gap-2">
								<Input
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									maxLength={50}
									placeholder="カレンダー名"
									className="flex-1"
								/>
								<Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
									{updateMutation.isPending ? '保存中...' : '保存'}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setEditing(false)}
									disabled={updateMutation.isPending}
								>
									取消
								</Button>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<p className="text-lg">{data.family.name || '（未設定）'}</p>
								<Button size="sm" variant="ghost" onClick={startEditing}>
									<Pencil className="h-4 w-4" />
								</Button>
							</div>
						)}
						{updateMutation.error && (
							<p className="mt-1 text-sm text-red-500">{updateMutation.error.message}</p>
						)}
					</section>

					{/* 共有リンク */}
					<section className="mb-6">
						<h2 className="mb-2 font-medium text-gray-700">共有リンク</h2>
						<p className="mb-2 text-sm text-gray-500">
							このリンクを共有すると、他の人もこのカレンダーを閲覧・編集できます
						</p>
						<div className="flex items-center gap-2">
							<Input value={data.family.shareUrl} readOnly className="flex-1 bg-gray-50" />
							<Button
								variant={copied ? 'default' : 'outline'}
								size="sm"
								onClick={handleCopy}
								className={copied ? 'bg-green-500 hover:bg-green-600' : ''}
							>
								{copied ? 'コピー済み' : 'コピー'}
							</Button>
						</div>
					</section>

					{/* Family ID */}
					<section className="border-t border-gray-200 pt-6">
						<h2 className="mb-2 text-sm font-medium text-gray-500">カレンダーID</h2>
						<p className="break-all font-mono text-xs text-gray-400">{data.family.id}</p>
					</section>
				</>
			)}
		</div>
	)
}
