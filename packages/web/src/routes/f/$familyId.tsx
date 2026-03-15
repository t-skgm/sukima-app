import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { Calendar, MapPin, Settings } from 'lucide-react'
import type { ComponentType } from 'react'
import { FamilyApiProvider } from '@/lib/family-api-context'

export const Route = createFileRoute('/f/$familyId')({
	component: FamilyLayout,
})

const NAV_ITEMS = [
	{ to: '/f/$familyId' as const, label: 'カレンダー', icon: Calendar },
	{ to: '/f/$familyId/destinations' as const, label: '行き先', icon: MapPin },
	{ to: '/f/$familyId/settings' as const, label: '設定', icon: Settings },
]

function FamilyLayout() {
	const { familyId } = Route.useParams()

	return (
		<FamilyApiProvider familyId={familyId}>
			<div className="min-h-screen">
				{/* Content */}
				<main className="pb-20">
					<Outlet />
				</main>

				{/* Navigation */}
				<nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/90 backdrop-blur-lg">
					<div className="mx-auto flex max-w-md">
						{NAV_ITEMS.map((item) => (
							<NavItem
								key={item.to}
								to={item.to}
								params={{ familyId }}
								label={item.label}
								icon={item.icon}
							/>
						))}
					</div>
				</nav>
			</div>
		</FamilyApiProvider>
	)
}

function NavItem({
	to,
	params,
	label,
	icon: Icon,
}: {
	to: string
	params: { familyId: string }
	label: string
	icon: ComponentType<{ className?: string }>
}) {
	const matchRoute = useMatchRoute()
	const isActive = !!matchRoute({ to, params, fuzzy: to !== '/f/$familyId' })

	return (
		<Link
			to={to}
			params={params}
			className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-all ${
				isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600 active:text-violet-500'
			}`}
		>
			<div
				className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
					isActive
						? 'bg-gradient-to-r from-sky-400 to-violet-400 text-white shadow-md shadow-violet-200'
						: ''
				}`}
			>
				<Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
			</div>
			<span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
				{label}
			</span>
		</Link>
	)
}
