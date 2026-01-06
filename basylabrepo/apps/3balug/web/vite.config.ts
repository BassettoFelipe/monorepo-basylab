import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import path from "path";
import { cspPlugin } from "./vite-plugin-csp";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), vanillaExtractPlugin(), cspPlugin()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@contexts": path.resolve(__dirname, "./src/contexts"),
			"@hooks": path.resolve(__dirname, "./src/hooks"),
			"@lib": path.resolve(__dirname, "./src/lib"),
			"@pages": path.resolve(__dirname, "./src/pages"),
			"@services": path.resolve(__dirname, "./src/services"),
			"@stores": path.resolve(__dirname, "./src/stores"),
			"@styles": path.resolve(__dirname, "./src/styles"),
			"@design-system": path.resolve(__dirname, "./src/design-system"),
			"@types": path.resolve(__dirname, "./src/types"),
			"@utils": path.resolve(__dirname, "./src/utils"),
		},
	},
	build: {
		// Otimizações de performance
		target: "esnext",
		minify: "esbuild",
		cssMinify: true,
		sourcemap: false,
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				// Adiciona hash nos nomes dos arquivos para cache-busting
				entryFileNames: "assets/[name]-[hash].js",
				chunkFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name]-[hash].[ext]",
				// Code splitting otimizado
				manualChunks: {
					"vendor-react": ["react", "react-dom", "react-router-dom"],
					"vendor-query": ["@tanstack/react-query"],
					"vendor-ui": ["lucide-react", "react-toastify"],
					"vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
				},
			},
		},
	},
	// Otimizações de dev
	server: {
		warmup: {
			clientFiles: [
				"./src/pages/Public/LandingPage/**/*.tsx",
				"./src/components/**/*.tsx",
			],
		},
	},
});
