// TanStack Query integration for oRPC
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createFamilyClient, publicClient } from '../client'

// 公開API用のTanStack Query utils
export const publicApi = createTanstackQueryUtils(publicClient)

// Family-scoped API用のTanStack Query utils作成
export function createFamilyApi(familyId: string) {
	const client = createFamilyClient(familyId)
	return createTanstackQueryUtils(client)
}
