import { afterAll, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { errorHandlerPlugin } from '@/plugins/error-handler.plugin'
import type { UserRole } from '@/types/roles'
import { requireCompany, requireRole, requireSameCompany } from '../acl.middleware'

// Use spyOn to suppress logger output during tests
const loggerDebugSpy = spyOn(logger, 'debug').mockImplementation(() => {})
const loggerInfoSpy = spyOn(logger, 'info').mockImplementation(() => {})
const loggerWarnSpy = spyOn(logger, 'warn').mockImplementation(() => {})
const loggerErrorSpy = spyOn(logger, 'error').mockImplementation(() => {})

// Restore original logger after all tests
afterAll(() => {
	loggerDebugSpy.mockRestore()
	loggerInfoSpy.mockRestore()
	loggerWarnSpy.mockRestore()
	loggerErrorSpy.mockRestore()
})

// Helper to create a mock auth context
function createMockAuthMiddleware(context: {
	userId?: string
	userRole?: string | null
	userCompanyId?: string | null
}) {
	return new Elysia({ name: 'mock-auth' }).derive({ as: 'global' }, () => ({
		userId: context.userId ?? 'user-123',
		userRole: context.userRole ?? null,
		userCompanyId: context.userCompanyId ?? null,
		tokenPayload: { sub: context.userId ?? 'user-123', exp: 0, iat: 0 },
	}))
}

describe('acl.middleware', () => {
	beforeEach(() => {
		loggerDebugSpy.mockClear()
		loggerInfoSpy.mockClear()
		loggerWarnSpy.mockClear()
		loggerErrorSpy.mockClear()
	})

	describe('requireRole', () => {
		test('should return 401 when userRole is null', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userRole: null }))
				.use(requireRole(['owner', 'manager']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(401)
			const body = (await response.json()) as { type: string }
			expect(body.type).toBe('UNAUTHORIZED')
		})

		test('should return 401 when userRole is undefined', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userRole: undefined as unknown as null }))
				.use(requireRole(['owner']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(401)
		})

		test('should return 403 when user role is not in allowed roles', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userRole: 'broker' }))
				.use(requireRole(['owner', 'manager']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
			const body = (await response.json()) as { type: string }
			expect(body.type).toBe('INSUFFICIENT_PERMISSIONS')
		})

		test('should allow access when user role is in allowed roles', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userRole: 'owner' }))
				.use(requireRole(['owner', 'manager']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(200)
			const body = (await response.json()) as { success: boolean }
			expect(body.success).toBe(true)
		})

		test('should allow access for any role in the allowed list', async () => {
			const allowedRoles: UserRole[] = ['owner', 'manager', 'broker']

			for (const role of allowedRoles) {
				const app = new Elysia()
					.use(errorHandlerPlugin)
					.use(createMockAuthMiddleware({ userRole: role }))
					.use(requireRole(allowedRoles))
					.get('/test', () => ({ success: true }))

				const response = await app.handle(new Request('http://localhost/test'))
				expect(response.status).toBe(200)
			}
		})

		test('should work with single role in allowed list', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userRole: 'admin' }))
				.use(requireRole(['admin']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(200)
		})
	})

	describe('requireCompany', () => {
		test('should return 403 when userCompanyId is null', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: null }))
				.use(requireCompany)
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
			const body = (await response.json()) as { type: string; message: string }
			expect(body.type).toBe('INSUFFICIENT_PERMISSIONS')
			expect(body.message).toContain('associado a uma empresa')
		})

		test('should return 403 when userCompanyId is undefined', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(
					createMockAuthMiddleware({
						userCompanyId: undefined as unknown as null,
					}),
				)
				.use(requireCompany)
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
		})

		test('should allow access when userCompanyId is present', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireCompany)
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(200)
			const body = (await response.json()) as { success: boolean }
			expect(body.success).toBe(true)
		})
	})

	describe('requireSameCompany', () => {
		test('should return 403 when userCompanyId is null', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: null }))
				.use(requireSameCompany(() => 'company-123'))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
			const body = (await response.json()) as { message: string }
			expect(body.message).toContain('associado a uma empresa')
		})

		test('should skip validation when resource companyId is null', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireSameCompany(() => null))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(200)
		})

		test('should skip validation when resource companyId is undefined', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireSameCompany(() => undefined))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(200)
		})

		test('should return 403 when resource companyId does not match user companyId', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireSameCompany(() => 'company-456'))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
			const body = (await response.json()) as { type: string; message: string }
			expect(body.type).toBe('INSUFFICIENT_PERMISSIONS')
			expect(body.message).toContain('outra empresa')
		})

		test('should allow access when resource companyId matches user companyId', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireSameCompany(() => 'company-123'))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(200)
			const body = (await response.json()) as { success: boolean }
			expect(body.success).toBe(true)
		})

		test('should extract companyId from params', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireSameCompany((ctx) => ctx.params?.companyId))
				.get('/companies/:companyId/users', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/companies/company-123/users'))

			expect(response.status).toBe(200)
		})

		test('should reject when params companyId does not match', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireSameCompany((ctx) => ctx.params?.companyId))
				.get('/companies/:companyId/users', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/companies/company-456/users'))

			expect(response.status).toBe(403)
		})

		test('should extract companyId from body', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userCompanyId: 'company-123' }))
				.use(requireSameCompany((ctx) => (ctx.body as { companyId?: string })?.companyId))
				.post('/resources', () => ({ success: true }))

			const response = await app.handle(
				new Request('http://localhost/resources', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ companyId: 'company-123' }),
				}),
			)

			expect(response.status).toBe(200)
		})
	})

	describe('middleware chaining', () => {
		test('should work with requireRole after requireCompany', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(
					createMockAuthMiddleware({
						userRole: 'owner',
						userCompanyId: 'company-123',
					}),
				)
				.use(requireCompany)
				.use(requireRole(['owner']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(200)
		})

		test('should fail on first middleware when company is missing', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(createMockAuthMiddleware({ userRole: 'owner', userCompanyId: null }))
				.use(requireCompany)
				.use(requireRole(['owner']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
			const body = (await response.json()) as { message: string }
			expect(body.message).toContain('associado a uma empresa')
		})

		test('should fail on second middleware when role is wrong', async () => {
			const app = new Elysia()
				.use(errorHandlerPlugin)
				.use(
					createMockAuthMiddleware({
						userRole: 'broker',
						userCompanyId: 'company-123',
					}),
				)
				.use(requireCompany)
				.use(requireRole(['owner', 'manager']))
				.get('/test', () => ({ success: true }))

			const response = await app.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
			const body = (await response.json()) as { message: string }
			expect(body.message).toContain('permissão para acessar')
		})
	})
})
