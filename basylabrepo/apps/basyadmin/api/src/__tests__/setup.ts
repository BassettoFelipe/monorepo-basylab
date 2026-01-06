/**
 * Test setup file for basyadmin API tests
 */

import { afterAll, beforeAll } from 'bun:test'

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/basyadmin_test'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

beforeAll(() => {
	// Setup before all tests
})

afterAll(() => {
	// Cleanup after all tests
})
