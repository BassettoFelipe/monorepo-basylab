import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		// Setup project - faz login uma vez e salva o estado
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/,
		},
		// Testes que requerem autenticação
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Usa o estado de autenticação salvo pelo setup
				storageState: 'e2e/.auth/user.json',
			},
			dependencies: ['setup'],
			// Ignora o arquivo de setup nos testes normais
			testIgnore: /auth\.setup\.ts/,
		},
	],
	webServer: {
		command: 'bun run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
	},
})
