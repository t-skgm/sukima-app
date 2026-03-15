import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { publicClient } from '../client'

export const Route = createFileRoute('/')({
	component: LandingPage,
})

function LandingPage() {
	const navigate = useNavigate()
	const [isCreating, setIsCreating] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const handleCreateCalendar = async () => {
		setIsCreating(true)
		setErrorMessage('')
		try {
			const result = await publicClient.family.create({ name: '' })
			void navigate({ to: '/f/$familyId', params: { familyId: result.id } })
		} catch {
			setErrorMessage('カレンダーの作成に失敗しました。もう一度お試しください。')
			setIsCreating(false)
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="text-center">
				<h1 className="mb-2 bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
					sukima
				</h1>
				<p className="mb-8 text-lg font-medium text-gray-500">家族で年間の予定を計画しよう</p>

				<button
					type="button"
					onClick={() => void handleCreateCalendar()}
					disabled={isCreating}
					className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-sky-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-sky-300 disabled:opacity-50 disabled:hover:scale-100"
				>
					{isCreating ? '作成中...' : '新しいカレンダーを作る'}
				</button>

				{errorMessage && <p className="mt-4 text-sm text-red-500">{errorMessage}</p>}

				<p className="mt-8 text-sm text-gray-400">
					共有リンクをお持ちの方は
					<br />
					そのリンクからアクセスしてください
				</p>
			</div>
		</div>
	)
}
