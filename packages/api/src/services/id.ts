/**
 * Generate a random family ID (16+ alphanumeric characters)
 */
export function generateFamilyId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	const length = 20
	let result = ''
	const randomValues = new Uint8Array(length)
	crypto.getRandomValues(randomValues)
	for (let i = 0; i < length; i++) {
		result += chars[randomValues[i] % chars.length]
	}
	return result
}
