/** Cloudflare Workers環境変数 */
export interface Env {
	DB: D1Database
	APP_URL: string
	ASSETS?: Fetcher
}
