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
				<h1 className="mb-4 text-4xl font-bold text-gray-900">sukima</h1>
				<p className="mb-8 text-lg text-gray-600">家族で年間の予定を計画しよう</p>

				<button
					type="button"
					onClick={() => void handleCreateCalendar()}
					disabled={isCreating}
					className="rounded-lg bg-primary-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
				>
					{isCreating ? '作成中...' : '新しいカレンダーを作る'}
				</button>

				{errorMessage && <p className="mt-4 text-sm text-red-500">{errorMessage}</p>}

				<p className="mt-6 text-sm text-gray-500">
					共有リンクをお持ちの方は
					<br />
					そのリンクからアクセスしてください
				</p>
			</div>
		</div>
	)
}
