export interface Env {
	DB: D1Database
	APP_URL: string
}

export interface Context {
	env: Env
	familyId?: string
}
