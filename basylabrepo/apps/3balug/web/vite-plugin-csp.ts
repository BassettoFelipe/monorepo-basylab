import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'

interface CSPConfig {
	development: string
	production: string
}

const cspPolicies: CSPConfig = {
	development:
		"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* https:;",
	production:
		"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:; base-uri 'self'; form-action 'self';",
}

export function cspPlugin(): Plugin {
	return {
		name: 'vite-plugin-csp',
		apply: 'build',
		closeBundle() {
			const indexPath = resolve(__dirname, 'dist', 'index.html')
			let html = readFileSync(indexPath, 'utf-8')

			// Remove o CSP do index.html original e injeta o de produção
			html = html.replace(
				/<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*\/>/,
				`<meta http-equiv="Content-Security-Policy" content="${cspPolicies.production}" />`,
			)

			writeFileSync(indexPath, html)
			console.log('✅ CSP de produção injetado com sucesso!')
		},
	}
}
