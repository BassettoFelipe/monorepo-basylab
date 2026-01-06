import { defineConfig } from 'tsup'

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/auth/index.ts',
		'src/crypto/index.ts',
		'src/errors/index.ts',
		'src/logger/index.ts',
		'src/validation/index.ts',
		'src/types/index.ts',
	],
	format: ['esm'],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	treeshake: true,
	minify: false,
	external: ['otpauth', 'pino', 'pino-pretty'],
})
