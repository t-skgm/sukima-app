import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
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

					{/* 外部カレンダー連携 */}
					<ExternalCalendarsSection />

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

// === 外部カレンダー連携セクション ===

function ExternalCalendarsSection() {
	const api = useFamilyApi()
	const queryClient = useQueryClient()
	const [adding, setAdding] = useState(false)
	const [newName, setNewName] = useState('')
	const [newUrl, setNewUrl] = useState('')

	const { data, isLoading } = useQuery(api.externalCalendars.list.queryOptions({ input: {} }))

	const { invalidate } = useInvalidateOnSuccess()

	const createMutation = useMutation({
		...api.externalCalendars.create.mutationOptions(),
		onSuccess: () => {
			invalidate(api.externalCalendars.list.key()).onSuccess()
			setAdding(false)
			setNewName('')
			setNewUrl('')
		},
	})

	const deleteMutation = useMutation({
		...api.externalCalendars.delete.mutationOptions(),
		onSuccess: () => {
			invalidate(api.externalCalendars.list.key()).onSuccess()
		},
	})

	const syncMutation = useMutation({
		...api.externalCalendars.sync.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: api.externalCalendars.list.key() })
			queryClient.invalidateQueries({ queryKey: api.calendar.get.key() })
		},
	})

	const handleCreate = () => {
		if (!newName.trim() || !newUrl.trim()) return
		createMutation.mutate({ name: newName.trim(), icalUrl: newUrl.trim() })
	}

	return (
		<section className="mb-6">
			<h2 className="mb-2 font-medium text-gray-700">外部カレンダー連携</h2>
			<p className="mb-3 text-sm text-gray-500">
				Google Calendar等のiCal URLを登録して、予定を取り込めます。
				<br />
				Googleカレンダーの場合は「設定と共有」→「カレンダーの統合」→「iCal形式の非公開URL」を使用してください。
			</p>

			{/* 登録済みカレンダー一覧 */}
			{isLoading ? (
				<div className="animate-pulse">
					<div className="h-16 rounded bg-gray-200" />
				</div>
			) : (
				<div className="space-y-3">
					{data?.calendars.map((cal) => (
						<div key={cal.id} className="rounded-lg border border-gray-200 p-3">
							<div className="flex items-center justify-between">
								<div className="min-w-0 flex-1">
									<p className="font-medium">{cal.name}</p>
									<p className="truncate text-xs text-gray-400">{cal.icalUrl}</p>
									{cal.lastSyncedAt && (
										<p className="mt-1 text-xs text-gray-500">
											最終同期: {new Date(cal.lastSyncedAt).toLocaleString('ja-JP')}
										</p>
									)}
								</div>
								<div className="ml-2 flex shrink-0 items-center gap-1">
									<Button
										size="sm"
										variant="outline"
										onClick={() => syncMutation.mutate({ id: cal.id })}
										disabled={syncMutation.isPending}
									>
										<RefreshCw
											className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`}
										/>
										<span className="ml-1">同期</span>
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											if (window.confirm(`「${cal.name}」を削除しますか？`))
												deleteMutation.mutate({ id: cal.id })
										}}
										disabled={deleteMutation.isPending}
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</div>
							</div>
							{syncMutation.isSuccess && syncMutation.variables?.id === cal.id && (
								<p className="mt-2 text-xs text-green-600">
									{syncMutation.data.syncedCount}件の予定を同期しました
								</p>
							)}
							{syncMutation.isError && syncMutation.variables?.id === cal.id && (
								<p className="mt-2 text-xs text-red-500">
									同期に失敗しました: {syncMutation.error.message}
								</p>
							)}
						</div>
					))}

					{data?.calendars.length === 0 && !adding && (
						<p className="text-sm text-gray-400">登録されたカレンダーはありません</p>
					)}
				</div>
			)}

			{/* 追加フォーム */}
			{adding ? (
				<div className="mt-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="カレンダー名（例: 仕事）"
						maxLength={100}
					/>
					<Input
						value={newUrl}
						onChange={(e) => setNewUrl(e.target.value)}
						placeholder="iCal URL（https://...）"
						maxLength={2000}
					/>
					{createMutation.error && (
						<p className="text-xs text-red-500">{createMutation.error.message}</p>
					)}
					<div className="flex gap-2">
						<Button
							size="sm"
							onClick={handleCreate}
							disabled={createMutation.isPending || !newName.trim() || !newUrl.trim()}
						>
							{createMutation.isPending ? '追加中...' : '追加'}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								setAdding(false)
								setNewName('')
								setNewUrl('')
							}}
							disabled={createMutation.isPending}
						>
							取消
						</Button>
					</div>
				</div>
			) : (
				<Button size="sm" variant="outline" onClick={() => setAdding(true)} className="mt-3">
					<Plus className="mr-1 h-4 w-4" />
					カレンダーを追加
				</Button>
			)}
		</section>
	)
}
