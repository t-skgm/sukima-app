import { createFamilyApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

export const Route = createFileRoute('/c/$familyId/settings')({
	component: SettingsPage,
})

function SettingsPage() {
	const { familyId } = Route.useParams()
	const api = useMemo(() => createFamilyApi(familyId), [familyId])
	const [copied, setCopied] = useState(false)

	const { data, isLoading, error } = useQuery(api.settings.get.queryOptions({ input: {} }))

	const handleCopy = async () => {
		if (data?.family.shareUrl) {
			await navigator.clipboard.writeText(data.family.shareUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
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
						<p className="text-lg">{data.family.name || '（未設定）'}</p>
					</section>

					{/* 共有リンク */}
					<section className="mb-6">
						<h2 className="mb-2 font-medium text-gray-700">共有リンク</h2>
						<p className="mb-2 text-sm text-gray-500">
							このリンクを共有すると、他の人もこのカレンダーを閲覧・編集できます
						</p>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={data.family.shareUrl}
								readOnly
								className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
							/>
							<button
								type="button"
								onClick={handleCopy}
								className={`rounded px-3 py-2 text-sm transition-colors ${
									copied ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
								}`}
							>
								{copied ? 'コピー済み' : 'コピー'}
							</button>
						</div>
					</section>

					{/* Family ID (デバッグ用) */}
					<section className="border-t border-gray-200 pt-6">
						<h2 className="mb-2 text-sm font-medium text-gray-500">カレンダーID</h2>
						<p className="break-all font-mono text-xs text-gray-400">{data.family.id}</p>
					</section>
				</>
			)}
		</div>
	)
}
