import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Check, ClipboardList, LogIn, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { usePlansQuery } from '@/queries/plans/usePlansQuery'
import { register as registerService } from '@/services/auth/registration/register'
import type { ApiError } from '@/types/api.types'
import { formatPrice } from '@/utils/currency'
import { ErrorBox } from './components/ErrorBox/ErrorBox'
import { PasswordRequirementsList } from './components/PasswordRequirementsList/PasswordRequirementsList'
import { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator/PasswordStrengthIndicator'
import { PlanSummary } from './components/PlanSummary/PlanSummary'
import * as styles from './RegisterPage.css'

const registerSchema = z
	.object({
		name: z
			.string()
			.min(1, 'Nome é obrigatório')
			.min(2, 'Nome deve ter pelo menos 2 caracteres')
			.max(100, 'Nome deve ter no máximo 100 caracteres')
			.regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos'),
		phone: z
			.string()
			.min(1, 'Telefone é obrigatório')
			.transform((val) => val.replace(/\D/g, ''))
			.pipe(
				z
					.string()
					.min(10, 'Telefone deve ter pelo menos 10 dígitos')
					.max(11, 'Telefone deve ter no máximo 11 dígitos'),
			),
		companyName: z
			.string()
			.min(1, 'Nome da empresa é obrigatório')
			.min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
			.max(100, 'Nome da empresa deve ter no máximo 100 caracteres'),
		email: z
			.string()
			.min(1, 'Email é obrigatório')
			.toLowerCase()
			.trim()
			.pipe(z.email('Digite um email válido')),
		password: z
			.string()
			.min(8, 'Senha deve ter pelo menos 8 caracteres')
			.regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
			.regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
			.regex(/[0-9]/, 'Senha deve conter pelo menos um número')
			.regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
		confirmPassword: z.string(),
		planId: z.string().min(1, 'Selecione um plano'),
		acceptTerms: z.boolean().refine((val) => val === true, {
			message: 'Você deve aceitar os termos',
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'As senhas não coincidem',
		path: ['confirmPassword'],
	})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { data: plans = [], isLoading: isLoadingPlans } = usePlansQuery()

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isDirty },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		mode: 'onBlur',
		defaultValues: {
			planId: searchParams.get('planId') || '',
			acceptTerms: false,
		},
	})

	useUnsavedChangesWarning(isDirty)

	const registerMutation = useMutation({
		mutationFn: registerService,
	})

	const passwordValue = watch('password')
	const planId = watch('planId')
	const selectedPlan = plans.find((p) => p.id === planId)

	const onSubmit = async (data: RegisterFormData) => {
		try {
			const response = await registerMutation.mutateAsync({
				name: data.name,
				phone: data.phone,
				companyName: data.companyName,
				email: data.email,
				password: data.password,
				planId: data.planId,
			})

			toast.success(response.message || 'Código de verificação enviado!')
			navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`)
		} catch (err) {
			const error = err as ApiError

			if (error.type === 'EMAIL_ALREADY_EXISTS') {
				toast.error(
					'Este email já está cadastrado. Você pode fazer login ou recuperar sua senha.',
					{ autoClose: 7000 },
				)
				return
			}

			if (error.type === 'EMAIL_NOT_VERIFIED') {
				toast.warning(error.message || 'Sua conta ainda não foi verificada. Verifique seu email.', {
					autoClose: 7000,
				})
				navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`)
				return
			}

			toast.error(error.message || 'Falha ao processar cadastro')
		}
	}

	const planOptions = plans.map((plan) => ({
		value: plan.id,
		label: `${plan.name} - ${formatPrice(plan.price)}/mês`,
	}))

	return (
		<main className={styles.registerPage}>
			<div className={styles.registerContainer}>
				<section className={styles.registerLeftColumn} aria-labelledby="register-heading">
					<header className={styles.registerHeader}>
						<div className={styles.registerIconWrapper} aria-hidden="true">
							<UserPlus size={20} className={styles.registerIcon} aria-hidden="true" />
						</div>
						<div className={styles.registerHeaderContent}>
							<h1 id="register-heading" className={styles.registerHeaderTitle}>
								Criar Conta
							</h1>
							<p className={styles.registerHeaderText}>
								Comece a gerenciar seu negócio imobiliário
							</p>
						</div>
					</header>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className={styles.registerForm}
						noValidate
						aria-describedby={registerMutation.error ? 'register-error' : undefined}
					>
						{registerMutation.error && (
							<ErrorBox message={registerMutation.error.message} id="register-error" />
						)}

						<Input
							{...register('name')}
							type="text"
							label="Nome completo"
							placeholder="João Silva"
							error={errors.name?.message}
							fullWidth
							autoComplete="name"
						/>

						<Input
							{...register('phone')}
							type="tel"
							label="Telefone"
							placeholder="(11) 99999-9999"
							error={errors.phone?.message}
							fullWidth
							autoComplete="tel"
						/>

						<Input
							{...register('companyName')}
							type="text"
							label="Nome da empresa"
							placeholder="Imobiliária Silva Ltda"
							error={errors.companyName?.message}
							fullWidth
							autoComplete="organization"
						/>

						<Input
							{...register('email')}
							type="email"
							label="Email"
							placeholder="joao@exemplo.com"
							error={errors.email?.message}
							fullWidth
							autoComplete="email"
						/>

						<div style={{ marginBottom: '12px' }}>
							<Input
								{...register('password')}
								type="password"
								label="Senha"
								placeholder="Crie uma senha forte"
								error={errors.password?.message}
								fullWidth
								autoComplete="new-password"
								aria-describedby="password-strength password-requirements"
							/>
							<div style={{ marginTop: '4px' }}>
								<PasswordStrengthIndicator password={passwordValue} />
								<PasswordRequirementsList password={passwordValue} />
							</div>
						</div>

						<Input
							{...register('confirmPassword')}
							type="password"
							label="Confirmar senha"
							placeholder="Digite a senha novamente"
							error={errors.confirmPassword?.message}
							fullWidth
							autoComplete="new-password"
						/>

						<Select
							{...register('planId')}
							label="Plano"
							placeholder="Selecione um plano"
							options={planOptions}
							error={errors.planId?.message}
							fullWidth
							required
							loading={isLoadingPlans}
						/>

						<fieldset className={styles.termsCheckboxWrapper}>
							<legend className="sr-only">Termos e condições</legend>
							<label className={styles.termsCheckboxLabel}>
								<input
									{...register('acceptTerms')}
									type="checkbox"
									className={styles.termsCheckboxInput}
									aria-invalid={!!errors.acceptTerms}
									aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}
								/>
								<span
									className={`${styles.termsCheckbox} ${errors.acceptTerms ? styles.termsCheckboxError : ''}`}
									aria-hidden="true"
								>
									<Check size={12} className={styles.termsCheckboxIcon} aria-hidden="true" />
								</span>
								<span className={styles.termsCheckboxText}>
									Aceito os{' '}
									<a
										href="/terms"
										target="_blank"
										rel="noopener noreferrer"
										className={styles.termsCheckboxLink}
									>
										Termos
									</a>{' '}
									e{' '}
									<a
										href="/privacy"
										target="_blank"
										rel="noopener noreferrer"
										className={styles.termsCheckboxLink}
									>
										Política de Privacidade
									</a>
								</span>
							</label>
							{errors.acceptTerms && (
								<p id="terms-error" className={styles.termsCheckboxErrorMessage} role="alert">
									{errors.acceptTerms.message}
								</p>
							)}
						</fieldset>

						<Button
							type="submit"
							loading={registerMutation.isPending}
							fullWidth
							className={styles.submitButton}
							aria-busy={registerMutation.isPending}
						>
							{registerMutation.isPending ? 'Criando conta...' : 'Criar Conta'}
						</Button>

						<nav className={styles.registerFooter} aria-label="Ações alternativas">
							<Link to="/login" className={styles.registerFooterLinkSecondary}>
								<LogIn size={14} className={styles.footerLinkIcon} aria-hidden="true" />
								<span>Já tem conta? Entrar</span>
							</Link>
							<Link to="/" className={styles.registerFooterLinkPrimary}>
								<ClipboardList size={14} className={styles.footerLinkIcon} aria-hidden="true" />
								<span>Ver todos os planos</span>
							</Link>
						</nav>
					</form>
				</section>

				<PlanSummary selectedPlan={selectedPlan} />
			</div>
		</main>
	)
}
