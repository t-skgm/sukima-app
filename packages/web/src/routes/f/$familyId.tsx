import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { FamilyApiProvider } from '@/lib/family-api-context'

export const Route = createFileRoute('/f/$familyId')({
	component: FamilyLayout,
})

function FamilyLayout() {
	const { familyId } = Route.useParams()

	return (
		<FamilyApiProvider familyId={familyId}>
			<div className="min-h-screen">
				{/* Navigation */}
				<nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
					<div className="mx-auto flex max-w-md justify-around">
						<NavItem to="/f/$familyId" params={{ familyId }} label="カレンダー" />
						<NavItem to="/f/$familyId/destinations" params={{ familyId }} label="行き先" />
						<NavItem to="/f/$familyId/settings" params={{ familyId }} label="設定" />
					</div>
				</nav>

				{/* Content */}
				<main className="pb-16">
					<Outlet />
				</main>
			</div>
		</FamilyApiProvider>
	)
}

function NavItem({
	to,
	params,
	label,
}: {
	to: string
	params: { familyId: string }
	label: string
}) {
	return (
		<Link
			to={to}
			params={params}
			className="flex flex-1 flex-col items-center py-3 text-sm text-gray-600"
		>
			{label}
		</Link>
	)
}
