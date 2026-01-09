import { AppError } from '@basylab/core/errors'
import { Elysia } from 'elysia'
import { env } from '@/config/env'
import { HttpError } from '@/errors/http-error'

const translateValidationMessage = (message: string): string => {
	const patterns = [
		{
			regex: /Invalid input:\s*expected\s+(\w+),?\s*received\s+(\w+)/i,
			handler: (match: RegExpMatchArray): string => {
				const type = match[1]?.toLowerCase()
				const typeMap: Record<string, string> = {
					string: 'texto',
					number: 'número',
					boolean: 'verdadeiro ou falso',
					object: 'objeto',
					array: 'lista',
				}
				return `Valor inválido. ${typeMap[type] || 'Tipo de dado'} esperado`
			},
		},
		{
			regex: /Expected\s+(\w+)$/i,
			handler: (): string => 'Campo obrigatório',
		},
		{
			regex: /must\s+be\s+a\s+valid\s+email/i,
			handler: (): string => 'Email inválido',
		},
		{
			regex: /must\s+have\s+at\s+least\s+(\d+)\s+characters/i,
			handler: (match: RegExpMatchArray): string => `Deve ter pelo menos ${match[1]} caracteres`,
		},
		{
			regex: /must\s+be\s+at\s+most\s+(\d+)\s+characters/i,
			handler: (match: RegExpMatchArray): string => `Deve ter no máximo ${match[1]} caracteres`,
		},
	]

	for (const pattern of patterns) {
		const match = message.match(pattern.regex)
		if (match) {
			return pattern.handler(match)
		}
	}

	return message
}

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(({ error, set }) => {
	// Handle AppError from @basylab/core
	if (error instanceof AppError) {
		set.status = error.statusCode

		if (error.statusCode >= 500) {
			console.error('[AppError 5xx]', error.message, error.metadata)
		}

		return {
			success: false,
			error: {
				type: error.code,
				message: error.message,
				...(error.metadata && Object.keys(error.metadata).length > 0
					? { metadata: error.metadata }
					: {}),
			},
		}
	}

	// Handle HttpError local
	if (error instanceof HttpError) {
		set.status = error.statusCode

		if (error.statusCode >= 500) {
			console.error('[HttpError 5xx]', error.message, error.metadata)
		}

		return {
			success: false,
			error: error.toJSON(),
		}
	}

	// Validation errors from Elysia/TypeBox
	if ('code' in error && error.code === 'VALIDATION') {
		set.status = 422

		const validationError = error as { message?: string; all?: Array<{ message: string }> }
		let translatedMessage = 'Dados inválidos'

		if (validationError.all && validationError.all.length > 0) {
			translatedMessage = validationError.all
				.map((e) => translateValidationMessage(e.message))
				.join('. ')
		} else if (validationError.message) {
			translatedMessage = translateValidationMessage(validationError.message)
		}

		return {
			success: false,
			error: {
				type: 'VALIDATION_ERROR',
				message: translatedMessage,
			},
		}
	}

	// Unknown errors
	console.error('[Unhandled Error]', error)

	set.status = 500
	return {
		success: false,
		error: {
			type: 'INTERNAL_SERVER_ERROR',
			message:
				env.NODE_ENV === 'development'
					? `message` in error
						? (error as Error).message
						: 'Erro interno do servidor'
					: 'Erro interno do servidor',
		},
	}
})
