/**
 * Utilitario para tratamento padronizado de erros da API
 */

export interface ApiError {
	status?: number
	message?: string
	code?: string
}

/**
 * Extrai informacoes de erro de diferentes formatos de resposta
 */
export function parseApiError(error: unknown): ApiError {
	// Erro do Ky ou fetch com response
	if (
		error &&
		typeof error === 'object' &&
		'response' in error &&
		error.response &&
		typeof error.response === 'object'
	) {
		const response = error.response as {
			status?: number
			data?: { message?: string; code?: string }
		}
		return {
			status: response.status,
			message: response.data?.message,
			code: response.data?.code,
		}
	}

	// HTTPError do Ky
	if (error && typeof error === 'object' && 'name' in error && error.name === 'HTTPError') {
		const httpError = error as { response?: { status?: number }; message?: string }
		return {
			status: httpError.response?.status,
			message: httpError.message,
		}
	}

	// Erro generico com message
	if (error instanceof Error) {
		return { message: error.message }
	}

	return {}
}

/**
 * Retorna mensagem amigavel baseada no status code da API
 */
export function getErrorMessageByStatus(
	status: number | undefined,
	defaultMessage: string,
): string {
	switch (status) {
		case 400:
			return 'Dados invalidos. Verifique os campos e tente novamente.'
		case 401:
			return 'Sua sessao expirou. Faca login novamente.'
		case 403:
			return 'Voce nao tem permissao para realizar esta acao.'
		case 404:
			return 'O recurso solicitado nao foi encontrado.'
		case 409:
			return 'Este registro ja existe ou esta em conflito com outro.'
		case 413:
			return 'O arquivo enviado excede o tamanho maximo permitido.'
		case 415:
			return 'Tipo de arquivo nao suportado.'
		case 422:
			return 'Os dados enviados sao invalidos. Verifique e tente novamente.'
		case 429:
			return 'Muitas requisicoes. Aguarde alguns segundos e tente novamente.'
		case 500:
		case 502:
		case 503:
			return 'Erro no servidor. Tente novamente em alguns instantes.'
		default:
			return defaultMessage
	}
}

/**
 * Processa erro da API e retorna mensagem amigavel
 */
export function handleApiError(
	error: unknown,
	defaultMessage = 'Ocorreu um erro inesperado',
): string {
	const apiError = parseApiError(error)

	// Se tiver mensagem especifica da API, usa ela
	if (apiError.message && apiError.message !== 'HTTPError') {
		return apiError.message
	}

	// Caso contrario, retorna mensagem baseada no status
	return getErrorMessageByStatus(apiError.status, defaultMessage)
}

/**
 * Verifica se o erro e de rede/conexao
 */
function isNetworkError(error: unknown): boolean {
	if (error instanceof Error) {
		return (
			error.message.includes('Failed to fetch') ||
			error.message.includes('Network') ||
			error.message.includes('ECONNREFUSED') ||
			error.message.includes('ETIMEDOUT')
		)
	}
	return false
}

/**
 * Mensagens especificas para erros de upload
 */
export function getUploadErrorMessage(error: unknown, fileName?: string): string {
	const apiError = parseApiError(error)

	if (apiError.status === 413) {
		return fileName
			? `O arquivo "${fileName}" excede o tamanho maximo permitido (5MB)`
			: 'O arquivo excede o tamanho maximo permitido (5MB)'
	}

	if (apiError.status === 415) {
		return fileName
			? `O arquivo "${fileName}" possui um formato nao suportado`
			: 'Formato de arquivo nao suportado. Use JPG, PNG ou WebP.'
	}

	if (isNetworkError(error)) {
		return 'Erro de conexao. Verifique sua internet e tente novamente.'
	}

	return apiError.message || 'Erro ao enviar arquivo. Tente novamente.'
}
