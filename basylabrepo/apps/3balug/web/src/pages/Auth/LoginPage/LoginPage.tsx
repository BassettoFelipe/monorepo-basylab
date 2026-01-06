import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { queryKeys } from '@/queries/queryKeys'
import { login as loginService } from '@/services/auth/session/login'
import type { ApiError } from '@/types/api.types'
import { storage } from '@/utils/storage'
import { BrandSection } from './components/BrandSection/BrandSection'
import { ErrorBox } from './components/ErrorBox/ErrorBox'
import { LoginLogo } from './components/LoginLogo/LoginLogo'
import * as styles from './LoginPage.css'

const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'Email é obrigatório')
		.toLowerCase()
		.pipe(z.email('Digite um email válido')),
	password: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: 'onBlur',
	})

	const loginMutation = useMutation({
		mutationFn: async (credentials: LoginFormData) => {
			const response = await loginService(credentials.email, credentials.password)
			return response.data
		},
	})

	const handleLoginSuccess = async (result: Awaited<ReturnType<typeof loginService>>['data']) => {
		const userData = {
			id: result.user.id,
			name: result.user.name,
			email: result.user.email,
			role: result.user.role,
			createdBy: result.user.createdBy,
			hasPendingCustomFields: result.user.hasPendingCustomFields,
			subscription: result.subscription || result.user.subscription || null,
		}
		queryClient.setQueryData(queryKeys.auth.me, userData)

		const subscriptionStatus = result.subscription?.status || result.user.subscription?.status
		if (subscriptionStatus) {
			storage.setSubscriptionStatus(subscriptionStatus)
		}

		await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })

		const navigationRoutes: Record<string, string> = {
			pending: '/pending-payment',
			active: result.user.hasPendingCustomFields ? '/setup-profile' : '/dashboard',
		}

		const route = navigationRoutes[subscriptionStatus || ''] || '/subscription-required'
		navigate(route, { replace: true })
	}

	const handleLoginError = (error: unknown, email: string) => {
		const err = error as ApiError

		const errorHandlers: Record<string, () => void> = {
			EMAIL_NOT_VERIFIED: () => {
				toast.warning(err.message || 'Sua conta ainda não foi verificada. Verifique seu email.', {
					autoClose: 5000,
				})
				const userEmail = err.email || email
				navigate(`/confirm-email?email=${encodeURIComponent(userEmail)}`, {
					replace: true,
				})
			},
			TOO_MANY_ATTEMPTS: () => {
				toast.error(err.message || 'Muitas tentativas de login. Aguarde alguns minutos.', {
					autoClose: 7000,
				})
			},
		}

		const handler = err?.type ? errorHandlers[err.type] : null

		if (handler) {
			handler()
			return
		}

		if (err?.handledByInterceptor) {
			return
		}

		const message = err?.message || 'Falha ao fazer login. Tente novamente.'
		toast.error(message, { autoClose: 5000 })
	}

	const onSubmit = async (data: LoginFormData) => {
		try {
			const result = await loginMutation.mutateAsync(data)
			await handleLoginSuccess(result)
		} catch (error) {
			handleLoginError(error, data.email)
		}
	}

	const errorMessage = loginMutation.error?.message
	const isLoading = loginMutation.isPending

	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<main className={styles.formSection} aria-labelledby="login-title">
					<header className={styles.header}>
						<LoginLogo />
						<h1 id="login-title" className={styles.title}>
							Entrar na sua conta
						</h1>
						<p className={styles.subtitle}>Bem-vindo de volta! Por favor, entre com seus dados.</p>
					</header>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className={styles.form}
						noValidate
						aria-label="Formulário de login"
					>
						{errorMessage && (
							<div role="alert" aria-live="polite" aria-atomic="true">
								<ErrorBox message={errorMessage} />
							</div>
						)}

						<Input
							{...register('email')}
							type="email"
							label="Email"
							placeholder="nome@empresa.com"
							error={errors.email?.message}
							fullWidth
							autoComplete="email"
							required
						/>

						<Input
							{...register('password')}
							type="password"
							label="Senha"
							placeholder="Digite sua senha"
							error={errors.password?.message}
							fullWidth
							autoComplete="current-password"
							required
						/>

						<div style={{ textAlign: 'right', marginTop: '-8px' }}>
							<Link to="/forgot-password" className={styles.link} style={{ fontSize: '14px' }}>
								Esqueceu sua senha?
							</Link>
						</div>

						<Button
							type="submit"
							loading={isLoading}
							fullWidth
							aria-label={isLoading ? 'Entrando...' : 'Entrar'}
						>
							Entrar
						</Button>
					</form>

					<footer className={styles.footer}>
						<p>
							Não tem uma conta?{' '}
							<Link to="/register" className={styles.link}>
								Criar conta
							</Link>
						</p>

						<nav aria-label="Links auxiliares">
							<Link to="/" className={styles.plansLink}>
								Ver planos disponíveis
							</Link>
						</nav>
					</footer>
				</main>

				<BrandSection />
			</div>
		</div>
	)
}
