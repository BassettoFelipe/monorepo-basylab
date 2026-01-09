import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@components': path.resolve(__dirname, './src/components'),
			'@hooks': path.resolve(__dirname, './src/hooks'),
			'@lib': path.resolve(__dirname, './src/lib'),
			'@pages': path.resolve(__dirname, './src/pages'),
			'@styles': path.resolve(__dirname, './src/styles'),
			'@types': path.resolve(__dirname, './src/types'),
			'@utils': path.resolve(__dirname, './src/utils'),
		},
	},
	build: {
		target: 'esnext',
		minify: 'esbuild',
		cssMinify: true,
		sourcemap: false,
		rollupOptions: {
			output: {
				entryFileNames: 'assets/[name]-[hash].js',
				chunkFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]',
				manualChunks: {
					'vendor-react': ['react', 'react-dom', 'react-router-dom'],
				},
			},
		},
	},
})
