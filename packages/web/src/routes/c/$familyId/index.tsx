import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/c/$familyId/')({
	component: CalendarPage,
})

function CalendarPage() {
	const { familyId } = Route.useParams()

	return (
		<div className="p-4">
			<h1 className="mb-4 text-xl font-bold">カレンダー</h1>
			<p className="text-gray-500">Family ID: {familyId}</p>
			<p className="mt-4 text-gray-400">カレンダー機能は実装予定です</p>
		</div>
	)
}
