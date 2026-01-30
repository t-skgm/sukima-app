import { describe, expect, it } from 'vitest'
import { createMockDatabase } from './mock-database'
import { getSettings } from './settings'

describe('settings usecase', () => {
	const familyId = 'test-family-id-12345'
	const appUrl = 'https://sukima.example.com'

	describe('getSettings', () => {
		it('家族の設定情報を返す', async () => {
			const db = createMockDatabase({
				families: [{ id: familyId, name: 'テスト家族' }],
			})
			const gateways = { db }

			const result = await getSettings(gateways, { appUrl })({ where: { familyId } })

			expect(result.family.id).toBe(familyId)
			expect(result.family.name).toBe('テスト家族')
			expect(result.family.shareUrl).toBe(`${appUrl}/f/${familyId}`)
		})

		it('存在しない家族はエラー', async () => {
			const db = createMockDatabase({ families: [] })
			const gateways = { db }

			await expect(
				getSettings(gateways, { appUrl })({ where: { familyId: 'nonexistent-family' } }),
			).rejects.toThrow('Family not found')
		})
	})
})
