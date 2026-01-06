import Elysia from 'elysia'

/**
 * Security Headers Plugin
 *
 * Adiciona headers de segurança HTTP para proteger a aplicação contra:
 * - Clickjacking (X-Frame-Options, frame-ancestors)
 * - MIME sniffing (X-Content-Type-Options)
 * - XSS (X-XSS-Protection)
 *
 * Nota: frame-ancestors e X-Frame-Options devem ser enviados via headers HTTP,
 * não via meta tags, pois meta tags são ignoradas pelo navegador para essas diretivas.
 */
export const securityHeadersPlugin = () =>
	new Elysia({ name: 'security-headers' }).onAfterHandle(({ set }) => {
		// Previne que a página seja carregada em iframes (proteção contra clickjacking)
		set.headers['X-Frame-Options'] = 'DENY'

		// Previne MIME sniffing - força o navegador a respeitar o Content-Type
		set.headers['X-Content-Type-Options'] = 'nosniff'

		// XSS Protection (legacy, mas mantido para compatibilidade com navegadores antigos)
		set.headers['X-XSS-Protection'] = '1; mode=block'

		// Política de referrer - não vaza informações sensíveis em requisições cross-origin
		set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

		// Content Security Policy - frame-ancestors via header HTTP (funciona corretamente)
		// Nota: Este header sobrescreve qualquer CSP definido via meta tag no HTML
		const csp = ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"].join('; ')

		// Adiciona ao CSP existente ou cria um novo
		const existingCSP = set.headers['Content-Security-Policy']
		if (existingCSP) {
			set.headers['Content-Security-Policy'] = `${existingCSP}; ${csp}`
		} else {
			set.headers['Content-Security-Policy'] = csp
		}
	})
