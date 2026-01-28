// oRPC client setup
// TODO: Configure proper type-safe client once API types are exported

// 開発時は空文字（vite proxyで処理）、本番時は環境変数から取得
const API_URL = import.meta.env.VITE_API_URL ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// biome-ignore lint: lint/suspicious/noExplicitAny
type ApiClient = any

async function fetchRPC(baseURL: string, path: string, input: unknown): Promise<unknown> {
	const response = await fetch(`${baseURL}/${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!response.ok) {
		throw new Error(`API error: ${response.status}`)
	}
	return response.json()
}

function createClient(baseURL: string): ApiClient {
	return new Proxy(
		{},
		{
			get: (_target, prop: string) => {
				return new Proxy(
					{},
					{
						get: (_t, method: string) => {
							return (input: unknown) => fetchRPC(baseURL, `${prop}.${method}`, input)
						},
					},
				)
			},
		},
	)
}

// Public client (no family context)
export const publicClient: ApiClient = createClient(`${API_URL}/rpc`)

// Family-scoped client factory
export function createFamilyClient(familyId: string): ApiClient {
	return createClient(`${API_URL}/c/${familyId}/rpc`)
}
