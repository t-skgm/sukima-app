import { createRootRoute, Link, Outlet, useRouter } from '@tanstack/react-router'

export const Route = createRootRoute({
	component: RootLayout,
	errorComponent: RootErrorBoundary,
	notFoundComponent: NotFoundPage,
})

function RootLayout() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Outlet />
		</div>
	)
}

function RootErrorBoundary({ error }: { error: Error }) {
	const router = useRouter()

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="text-center">
				<h1 className="mb-2 text-2xl font-bold text-red-600">エラーが発生しました</h1>
				<p className="mb-6 text-gray-600">{error.message}</p>
				<div className="flex justify-center gap-3">
					<button
						type="button"
						onClick={() => router.invalidate()}
						className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
					>
						再試行
					</button>
					<Link
						to="/"
						className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
					>
						トップに戻る
					</Link>
				</div>
			</div>
		</div>
	)
}

function NotFoundPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="text-center">
				<h1 className="mb-2 text-4xl font-bold text-gray-400">404</h1>
				<p className="mb-6 text-gray-600">ページが見つかりませんでした</p>
				<Link
					to="/"
					className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
				>
					トップに戻る
				</Link>
			</div>
		</div>
	)
}
