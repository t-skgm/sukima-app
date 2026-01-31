import { useQueryClient } from '@tanstack/react-query'
import { useFamilyApi } from '@/lib/family-api-context'

/** ミューテーション成功後にエンティティ + カレンダーのキャッシュを無効化する */
export function useInvalidateOnSuccess() {
	const queryClient = useQueryClient()
	const api = useFamilyApi()

	return {
		invalidate: (...entityKeys: unknown[][]) => ({
			onSuccess: () => {
				for (const key of entityKeys) {
					queryClient.invalidateQueries({ queryKey: key })
				}
				queryClient.invalidateQueries({ queryKey: api.calendar.get.key() })
			},
		}),
	}
}
