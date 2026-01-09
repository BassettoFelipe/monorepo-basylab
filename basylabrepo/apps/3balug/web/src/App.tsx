import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AppRouter } from '@/router/AppRouter'
import { NavigationSetup } from '@/routing/NavigationSetup'
import '@/styles/global.css'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 10,
			refetchOnWindowFocus: false,
			retry: 1,
		},
		mutations: {
			retry: (failureCount, error) => {
				if (failureCount >= 2) return false

				// Verifica o status do erro
				const status = (error as { status?: number })?.status

				// Retry apenas para erros de servidor (5xx) ou sem status (erro de rede)
				if (!status) return true
				if (status >= 500) return true

				return false
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		},
	},
})

export function App() {
	return (
		<HelmetProvider>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<NavigationSetup />
					<ToastContainer
						position="top-right"
						autoClose={5000}
						hideProgressBar={false}
						newestOnTop
						closeOnClick
						rtl={false}
						pauseOnFocusLoss
						draggable
						pauseOnHover
						theme="light"
					/>
					<AppRouter />
				</BrowserRouter>
			</QueryClientProvider>
		</HelmetProvider>
	)
}
