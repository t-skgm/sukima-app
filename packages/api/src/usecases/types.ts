/** ユースケースで使用するDB抽象型 */
export interface Database {
	prepare(query: string): PreparedStatement
	batch<T extends PreparedStatement[]>(statements: T): Promise<BatchResult[]>
}

/** 外部アクセスを行う依存（DB、外部APIなど） */
export interface Gateways {
	db: Database
}

export interface BatchResult {
	results?: unknown[]
	meta: { changes: number }
}

export interface PreparedStatement {
	bind(...values: unknown[]): PreparedStatement
	first<T = unknown>(): Promise<T | null>
	all<T = unknown>(): Promise<{ results: T[] }>
	run(): Promise<{ meta: { changes: number } }>
}
