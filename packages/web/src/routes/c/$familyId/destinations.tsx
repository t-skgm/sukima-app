import { createFamilyApi } from '@/lib/api'
import type { DestinationOutput } from '@sukima/api/src/usecases/destinations'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

export const Route = createFileRoute('/c/$familyId/destinations')({
	component: DestinationsPage,
})

function DestinationsPage() {
	const { familyId } = Route.useParams()
	const api = useMemo(() => createFamilyApi(familyId), [familyId])

	const { data, isLoading, error } = useQuery(api.destinations.list.queryOptions({ input: {} }))

	if (isLoading) {
		return (
			<div className="p-4">
				<div className="animate-pulse">
					<div className="mb-4 h-8 w-48 rounded bg-gray-200" />
					<div className="space-y-3">
						<div className="h-24 rounded bg-gray-200" />
						<div className="h-24 rounded bg-gray-200" />
					</div>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-4">
				<h1 className="mb-4 text-xl font-bold text-red-600">エラー</h1>
				<p className="text-gray-600">行き先の読み込みに失敗しました: {error.message}</p>
			</div>
		)
	}

	return (
		<div className="p-4">
			<h1 className="mb-6 text-xl font-bold">行き先ストック</h1>

			{data && (
				<>
					{/* アクティブな行き先 */}
					<section className="mb-8">
						<h2 className="mb-3 text-lg font-semibold text-gray-700">
							行きたい場所 ({data.active.length})
						</h2>
						{data.active.length === 0 ? (
							<p className="text-gray-400">行きたい場所がありません。追加してみましょう！</p>
						) : (
							<div className="space-y-3">
								{data.active.map((dest) => (
									<DestinationCard key={dest.id} destination={dest} />
								))}
							</div>
						)}
					</section>

					{/* 達成済み */}
					{data.done.length > 0 && (
						<section>
							<h2 className="mb-3 text-lg font-semibold text-gray-500">
								達成済み ({data.done.length})
							</h2>
							<div className="space-y-3 opacity-60">
								{data.done.map((dest) => (
									<DestinationCard key={dest.id} destination={dest} isDone />
								))}
							</div>
						</section>
					)}
				</>
			)}
		</div>
	)
}

function DestinationCard({
	destination,
	isDone = false,
}: {
	destination: DestinationOutput
	isDone?: boolean
}) {
	return (
		<div
			className={`rounded-lg border p-4 ${
				isDone ? 'border-gray-200 bg-gray-50' : 'border-teal-200 bg-teal-50'
			}`}
		>
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-medium">{destination.name}</h3>
					<p className="mt-1 text-sm text-gray-600">必要日数: {destination.requiredDays}日</p>
					{destination.memo && <p className="mt-2 text-sm text-gray-500">{destination.memo}</p>}
				</div>
				{isDone && (
					<span className="rounded bg-green-500 px-2 py-0.5 text-xs text-white">達成</span>
				)}
			</div>

			{/* 日程提案 */}
			{destination.suggestions.length > 0 && (
				<div className="mt-3 border-t border-teal-100 pt-3">
					<p className="mb-2 text-xs font-medium text-gray-500">おすすめ日程</p>
					<div className="flex flex-wrap gap-2">
						{destination.suggestions.map((suggestion) => (
							<span
								key={`${suggestion.startDate}-${suggestion.endDate}`}
								className="rounded-full bg-white px-2 py-1 text-xs text-gray-700 shadow-sm"
							>
								{suggestion.label}: {suggestion.startDate} 〜 {suggestion.endDate}
							</span>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
