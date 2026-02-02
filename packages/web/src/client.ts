import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
// oRPC type-safe client setup
import type { RouterClient } from '@orpc/server'
import type { Router } from '@sukima/api/src/router'

// 開発時は空文字（vite proxyで処理）、本番時はAPI Workers URLを指定
const API_URL = import.meta.env.VITE_API_URL || ''

type Client = RouterClient<Router>

// 公開クライアント（familyId不要）
const publicLink = new RPCLink({
	url: () => `${API_URL}/api/rpc`,
})
export const publicClient: Client = createORPCClient(publicLink)

// Family-scoped クライアント作成
export function createFamilyClient(familyId: string): Client {
	const link = new RPCLink({
		url: () => `${API_URL}/api/${familyId}/rpc`,
	})
	return createORPCClient(link)
}
