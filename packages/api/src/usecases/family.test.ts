import { describe, expect, it, vi } from 'vitest'
import { createFamily, updateFamily } from './family'
import { createMockDatabase } from './mock-database'

// generateFamilyIdをモック化
vi.mock('../services/id', () => ({
	generateFamilyId: () => 'test-generated-id-12345',
}))

describe('family usecase', () => {
	const appUrl = 'https://example.com'

	describe('createFamily', () => {
		it('家族を作成してIDとshareUrlを返す', async () => {
			const db = createMockDatabase({ families: [] })
			const gateways = { db }

			const result = await createFamily(gateways, { appUrl })({
				name: 'テスト家族',
			})

			expect(result.id).toBe('test-generated-id-12345')
			expect(result.name).toBe('テスト家族')
			expect(result.shareUrl).toBe('https://example.com/c/test-generated-id-12345')
			expect(db._tables.families).toHaveLength(1)
		})

		it('作成された家族がDBに保存される', async () => {
			const db = createMockDatabase({ families: [] })
			const gateways = { db }

			await createFamily(gateways, { appUrl })({
				name: '山田家',
			})

			const savedFamily = db._tables.families[0]
			expect(savedFamily.name).toBe('山田家')
			expect(savedFamily.created_at).toBeDefined()
			expect(savedFamily.updated_at).toBeDefined()
		})
	})

	describe('updateFamily', () => {
		it('家族名を更新する', async () => {
			const db = createMockDatabase({
				families: [
					{
						id: 'existing-family-id',
						name: '旧名前',
						created_at: '2025-01-01T00:00:00.000Z',
						updated_at: '2025-01-01T00:00:00.000Z',
					},
				],
			})
			const gateways = { db }

			const result = await updateFamily(gateways)('existing-family-id', {
				name: '新名前',
			})

			expect(result.id).toBe('existing-family-id')
			expect(result.name).toBe('新名前')
		})
	})
})
