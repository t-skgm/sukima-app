import type { BatchResult, Database, PreparedStatement } from './types'

type Row = Record<string, unknown>

/** batch実行用の内部インターフェース */
interface MockPreparedStatement extends PreparedStatement {
	_execute(): Promise<{ results: unknown[]; changes: number }>
}

/** テスト用インメモリDB実装 */
export function createMockDatabase(initialData: Record<string, Row[]> = {}): Database & {
	_tables: Record<string, Row[]>
	_lastInsertId: Record<string, number>
} {
	const tables: Record<string, Row[]> = { ...initialData }
	const lastInsertId: Record<string, number> = {}

	// 各テーブルの最大IDを初期化
	for (const [table, rows] of Object.entries(tables)) {
		const maxId = rows.reduce((max, row) => Math.max(max, (row.id as number) || 0), 0)
		lastInsertId[table] = maxId
	}

	return {
		_tables: tables,
		_lastInsertId: lastInsertId,

		prepare(query: string): PreparedStatement {
			let boundValues: unknown[] = []

			const stmt: MockPreparedStatement = {
				bind(...values: unknown[]): PreparedStatement {
					boundValues = values
					return stmt
				},

				async first<T = unknown>(): Promise<T | null> {
					const result = await executeQuery<T>(query, boundValues, tables, lastInsertId)
					return result.results[0] ?? null
				},

				async all<T = unknown>(): Promise<{ results: T[] }> {
					return executeQuery<T>(query, boundValues, tables, lastInsertId)
				},

				async run(): Promise<{ meta: { changes: number } }> {
					const result = await executeQuery(query, boundValues, tables, lastInsertId)
					return { meta: { changes: result.changes } }
				},

				async _execute(): Promise<{ results: unknown[]; changes: number }> {
					return executeQuery(query, boundValues, tables, lastInsertId)
				},
			}

			return stmt
		},

		async batch<T extends PreparedStatement[]>(statements: T): Promise<BatchResult[]> {
			const results: BatchResult[] = []

			for (const stmt of statements) {
				const mockStmt = stmt as MockPreparedStatement
				const result = await mockStmt._execute()
				results.push({
					results: result.results,
					meta: { changes: result.changes },
				})
			}

			return results
		},
	}
}

function executeQuery<T>(
	query: string,
	values: unknown[],
	tables: Record<string, Row[]>,
	lastInsertId: Record<string, number>,
): Promise<{ results: T[]; changes: number }> {
	const normalizedQuery = query.trim().toUpperCase()

	if (normalizedQuery.startsWith('SELECT')) {
		return Promise.resolve({ results: executeSelect<T>(query, values, tables), changes: 0 })
	}

	if (normalizedQuery.startsWith('INSERT')) {
		return Promise.resolve(executeInsert<T>(query, values, tables, lastInsertId))
	}

	if (normalizedQuery.startsWith('UPDATE')) {
		return Promise.resolve({ results: [], changes: executeUpdate(query, values, tables) })
	}

	if (normalizedQuery.startsWith('DELETE')) {
		return Promise.resolve({ results: [], changes: executeDelete(query, values, tables) })
	}

	return Promise.resolve({ results: [], changes: 0 })
}

function executeSelect<T>(query: string, values: unknown[], tables: Record<string, Row[]>): T[] {
	const tableMatch = query.match(/FROM\s+(\w+)/i)
	if (!tableMatch) return []

	const tableName = tableMatch[1]
	const rows = tables[tableName] || []

	// WHERE句の解析（条件の出現順序を保持）
	const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|$)/i)
	if (!whereMatch) return rows as T[]

	const conditions = whereMatch[1]
	let filteredRows = [...rows]

	// 条件の出現順序を取得してマッピング
	const conditionOrder: { column: string; position: number }[] = []
	const idMatch = conditions.match(/\bid\s*=\s*\?/)
	const familyIdMatch = conditions.match(/family_id\s*=\s*\?/)

	if (idMatch) conditionOrder.push({ column: 'id', position: conditions.indexOf(idMatch[0]) })
	if (familyIdMatch) conditionOrder.push({ column: 'family_id', position: conditions.indexOf(familyIdMatch[0]) })

	// 出現順でソート
	conditionOrder.sort((a, b) => a.position - b.position)

	// 出現順にフィルタリング
	conditionOrder.forEach((cond, valueIndex) => {
		const value = values[valueIndex]
		filteredRows = filteredRows.filter((row) => row[cond.column] === value)
	})

	// SELECT句のカラム抽出
	const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i)
	if (selectMatch && selectMatch[1] !== '*') {
		const columns = selectMatch[1].split(',').map((c) => c.trim())
		filteredRows = filteredRows.map((row) => {
			const newRow: Row = {}
			for (const col of columns) {
				if (col in row) {
					newRow[col] = row[col]
				}
			}
			return newRow
		})
	}

	return filteredRows as T[]
}

function executeInsert<T>(
	query: string,
	values: unknown[],
	tables: Record<string, Row[]>,
	lastInsertId: Record<string, number>,
): { results: T[]; changes: number } {
	const tableMatch = query.match(/INTO\s+(\w+)/i)
	if (!tableMatch) return { results: [], changes: 0 }

	const tableName = tableMatch[1]
	if (!tables[tableName]) tables[tableName] = []
	if (!lastInsertId[tableName]) lastInsertId[tableName] = 0

	// カラム名を抽出
	const columnsMatch = query.match(/\(([^)]+)\)\s*VALUES/i)
	if (!columnsMatch) return { results: [], changes: 0 }

	const columns = columnsMatch[1].split(',').map((c) => c.trim())

	// 新しいIDを生成
	lastInsertId[tableName]++
	const newId = lastInsertId[tableName]

	// 行を作成
	const newRow: Row = { id: newId }
	columns.forEach((col, i) => {
		if (col !== 'id') {
			newRow[col] = values[i]
		}
	})

	tables[tableName].push(newRow)

	// RETURNING id の場合
	if (query.toUpperCase().includes('RETURNING ID')) {
		return { results: [{ id: newId } as T], changes: 1 }
	}

	return { results: [], changes: 1 }
}

function executeUpdate(query: string, values: unknown[], tables: Record<string, Row[]>): number {
	const tableMatch = query.match(/UPDATE\s+(\w+)/i)
	if (!tableMatch) return 0

	const tableName = tableMatch[1]
	const rows = tables[tableName] || []

	// SET句のカラム抽出
	const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i)
	if (!setMatch) return 0

	const setParts = setMatch[1].split(',').map((s) => s.trim().split('=')[0].trim())

	// WHERE句からidとfamily_idを取得（末尾の2つの値）
	const id = values[values.length - 2]
	const familyId = values[values.length - 1]

	let changes = 0
	for (const row of rows) {
		if (row.id === id && row.family_id === familyId) {
			setParts.forEach((col, i) => {
				row[col] = values[i]
			})
			changes++
		}
	}

	return changes
}

function executeDelete(query: string, values: unknown[], tables: Record<string, Row[]>): number {
	const tableMatch = query.match(/FROM\s+(\w+)/i)
	if (!tableMatch) return 0

	const tableName = tableMatch[1]
	const rows = tables[tableName] || []

	const id = values[0]
	const familyId = values[1]

	const initialLength = rows.length
	tables[tableName] = rows.filter((row) => !(row.id === id && row.family_id === familyId))

	return initialLength - tables[tableName].length
}
