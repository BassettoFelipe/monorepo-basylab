import { afterAll, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { AppError } from '@basylab/core/errors'
import { Elysia } from 'elysia'
import { logger } from '@/config/logger'
import { HttpError } from '@/errors/http-error'
import { errorHandlerPlugin } from '../error-handler.plugin'

// Mock logger to suppress output during tests
const loggerDebugSpy = spyOn(logger, 'debug').mockImplementation(() => {})
const loggerInfoSpy = spyOn(logger, 'info').mockImplementation(() => {})
const loggerWarnSpy = spyOn(logger, 'warn').mockImplementation(() => {})
const loggerErrorSpy = spyOn(logger, 'error').mockImplementation(() => {})

afterAll(() => {
	loggerDebugSpy.mockRestore()
	loggerInfoSpy.mockRestore()
	loggerWarnSpy.mockRestore()
	loggerErrorSpy.mockRestore()
})

describe('errorHandlerPlugin', () => {
	let app: any

	beforeEach(() => {
		loggerWarnSpy.mockClear()
		loggerErrorSpy.mockClear()

		app = new Elysia().use(errorHandlerPlugin)
	})

	describe('NOT_FOUND errors', () => {
		test('should return 404 for non-existent routes', async () => {
			const response = await app.handle(new Request('http://localhost/non-existent-route'))

			expect(response.status).toBe(404)
			const body = (await response.json()) as any
			expect(body.code).toBe(404)
			expect(body.type).toBe('NOT_FOUND')
			expect(body.message).toBe('Rota não encontrada')
		})

		test('should log warning for NOT_FOUND errors', async () => {
			await app.handle(new Request('http://localhost/non-existent-route'))

			expect(loggerWarnSpy).toHaveBeenCalled()
		})
	})

	describe('VALIDATION errors', () => {
		beforeEach(() => {
			app = new Elysia().use(errorHandlerPlugin).post('/validate', ({ body }) => body, {
				body: ((value: unknown) => {
					if (!value || typeof value !== 'object' || !('email' in value)) {
						throw Object.assign(new Error('Expected string'), { code: 'VALIDATION' })
					}
					return value
				}) as any,
			})
		})

		test('should return 422 for validation errors', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Invalid input: expected string, received undefined')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(422)
			const body = (await response.json()) as any
			expect(body.code).toBe(422)
			expect(body.type).toBe('VALIDATION_ERROR')
		})
	})

	describe('AppError handling', () => {
		test('should handle AppError with correct status code', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw new AppError('Recurso não encontrado', 404, 'RESOURCE_NOT_FOUND')
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(404)
			const body = (await response.json()) as any
			expect(body.code).toBe(404)
			expect(body.type).toBe('RESOURCE_NOT_FOUND')
			expect(body.message).toBe('Recurso não encontrado')
		})

		test('should handle AppError with 500 status code and log error', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw new AppError('Erro interno', 500, 'INTERNAL_ERROR')
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(500)
			expect(loggerErrorSpy).toHaveBeenCalled()
		})

		test('should handle AppError with 4xx status code and log warning', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(401)
			expect(loggerWarnSpy).toHaveBeenCalled()
		})

		test('should include metadata in response when present', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new AppError('Erro com metadata', 400, 'BAD_REQUEST', {
					field: 'email',
					reason: 'invalid',
				})
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(400)
			const body = (await response.json()) as any
			expect(body.field).toBe('email')
			expect(body.reason).toBe('invalid')
		})
	})

	describe('HttpError handling', () => {
		test('should handle HttpError with correct status code', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				// HttpError constructor: (message, statusCode, type, metadata?)
				throw new HttpError('Acesso negado', 403, 'FORBIDDEN')
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(403)
			const body = (await response.json()) as any
			expect(body.code).toBe(403)
			expect(body.type).toBe('FORBIDDEN')
			expect(body.message).toBe('Acesso negado')
		})

		test('should handle HttpError with 500 status and log error', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw new HttpError('Bad Gateway', 502, 'BAD_GATEWAY')
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(502)
			expect(loggerErrorSpy).toHaveBeenCalled()
		})

		test('should include metadata in HttpError response', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw new HttpError('Requisição inválida', 400, 'BAD_REQUEST', {
					details: 'Campo obrigatório',
				})
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(400)
			const body = (await response.json()) as any
			expect(body.metadata).toEqual({ details: 'Campo obrigatório' })
		})
	})

	describe('Generic error with statusCode property', () => {
		test('should handle objects with statusCode property', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = {
					message: 'Erro genérico',
					statusCode: 418,
					code: 'IM_A_TEAPOT',
				}
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(418)
			const body = (await response.json()) as any
			expect(body.code).toBe(418)
			expect(body.type).toBe('IM_A_TEAPOT')
		})

		test('should log error for 5xx status codes in generic errors', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw { message: 'Server error', statusCode: 503, code: 'SERVICE_UNAVAILABLE' }
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(503)
			expect(loggerErrorSpy).toHaveBeenCalled()
		})
	})

	describe('Unknown errors', () => {
		test('should return 500 for unknown errors', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw new Error('Something went wrong')
			})

			const response = await testApp.handle(new Request('http://localhost/test'))

			expect(response.status).toBe(500)
			const body = (await response.json()) as any
			expect(body.code).toBe(500)
			expect(body.type).toBe('INTERNAL_SERVER_ERROR')
			expect(body.message).toBe('Erro interno do servidor')
		})

		test('should log error for unknown errors', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				throw new Error('Unknown error')
			})

			await testApp.handle(new Request('http://localhost/test'))

			expect(loggerErrorSpy).toHaveBeenCalled()
		})
	})

	describe('translateValidationMessage', () => {
		// We test the translation indirectly through the error handler

		test('should translate "expected string, received undefined" pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Invalid input: expected string, received undefined')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Campo obrigatório')
		})

		test('should translate "expected number, received string" pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Invalid input: expected number, received string')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Valor inválido. número esperado')
		})

		test('should translate "Expected string" pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Expected string')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Campo obrigatório')
		})

		test('should translate string length minimum pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('String length must be greater than or equal to 8')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Deve ter pelo menos 8 caracteres')
		})

		test('should translate string length maximum pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('String length must be less than or equal to 100')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Deve ter no máximo 100 caracteres')
		})

		test('should translate pattern matching error', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Expected string to match pattern')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Formato inválido')
		})

		test('should translate number greater than pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Expected number to be greater than 0')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Deve ser maior que 0')
		})

		test('should translate number less than pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Expected number to be less than 100')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Deve ser menor que 100')
		})

		test('should translate invalid email pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Invalid email address')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Email inválido')
		})

		test('should translate email format pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error("Expected string to match 'email' format")
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Email inválido')
		})

		test('should translate generic format pattern', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error("Expected value to match 'uuid' format")
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toBe('Formato inválido')
		})

		test('should apply simple translations for unmatched patterns', async () => {
			const testApp = new Elysia().use(errorHandlerPlugin).get('/test', () => {
				const error = new Error('Value must be greater than zero')
				;(error as any).code = 'VALIDATION'
				throw error
			})

			const response = await testApp.handle(new Request('http://localhost/test'))
			const body = (await response.json()) as any

			expect(body.details).toContain('deve ser')
			expect(body.details).toContain('maior que')
		})
	})
})
