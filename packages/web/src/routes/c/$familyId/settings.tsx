import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/c/$familyId/settings')({
	component: SettingsPage,
})

function SettingsPage() {
	const { familyId } = Route.useParams()
	const shareUrl = `${window.location.origin}/c/${familyId}`

	const handleCopy = () => {
		void navigator.clipboard.writeText(shareUrl)
	}

	return (
		<div className="p-4">
			<h1 className="mb-4 text-xl font-bold">設定</h1>

			<section className="mb-6">
				<h2 className="mb-2 font-medium text-gray-700">共有リンク</h2>
				<div className="flex items-center gap-2">
					<input
						type="text"
						value={shareUrl}
						readOnly
						className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
					/>
					<button
						type="button"
						onClick={handleCopy}
						className="rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
					>
						コピー
					</button>
				</div>
			</section>
		</div>
	)
}
