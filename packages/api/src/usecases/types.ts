/** ユースケースで使用するDB抽象型 */
export interface Database {
	prepare(query: string): PreparedStatement
}

export interface PreparedStatement {
	bind(...values: unknown[]): PreparedStatement
	first<T = unknown>(): Promise<T | null>
	all<T = unknown>(): Promise<{ results: T[] }>
	run(): Promise<{ meta: { changes: number } }>
}
