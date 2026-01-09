import { treaty } from '@elysiajs/eden'
import { app } from '@/server'

export type TestClient = ReturnType<typeof treaty<typeof app>>

export function createTestApp() {
	const client = treaty<typeof app>(app)

	return { app, client }
}

let testCounter = 0

export function generateTestEmail(prefix = 'test'): string {
	testCounter++
	return `${prefix}-${testCounter}-${Date.now()}@test.gradely.com`
}
