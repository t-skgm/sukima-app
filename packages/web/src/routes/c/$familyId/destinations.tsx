import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/c/$familyId/destinations')({
	component: DestinationsPage,
})

function DestinationsPage() {
	return (
		<div className="p-4">
			<h1 className="mb-4 text-xl font-bold">行き先</h1>
			<p className="text-gray-400">行き先ストック機能は実装予定です</p>
		</div>
	)
}
