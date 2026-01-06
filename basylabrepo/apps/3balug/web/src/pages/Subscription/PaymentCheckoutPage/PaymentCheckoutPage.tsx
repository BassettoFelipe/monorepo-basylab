import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowLeft, Clock, CreditCard, Loader2, Lock, Mail, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Cards from 'react-credit-cards-2'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'
import 'react-credit-cards-2/dist/es/styles-compiled.css'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { getPendingPayment } from '@/services/payment/get-pending-payment'
import { processCardPayment } from '@/services/payment/process-card-payment'
import type { ApiError } from '@/types/api.types'
import { formatPrice } from '@/utils/currency'
import * as styles from './PaymentCheckoutPage.css'

const PAGARME_PUBLIC_KEY = import.meta.env.VITE_PAGARME_PUBLIC_KEY || 'pk_test_v4W15nnUghWzjZPe'

type PendingPaymentData = {
	id: string
	email: string
	name: string
	planId: string
	plan: {
		id: string
		name: string
		price: number
	}
	status: string
	expiresAt: string
}

const paymentSchema = z.object({
	cardNumber: z
		.string()
		.min(1, 'Número do cartão é obrigatório')
		.regex(/^\d{16}$/, 'Número de cartão inválido (16 dígitos)'),
	cardholderName: z
		.string()
		.min(1, 'Nome do titular é obrigatório')
		.min(3, 'Nome deve ter pelo menos 3 caracteres'),
	cardExpiration: z
		.string()
		.min(1, 'Validade é obrigatória')
		.regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Validade inválida (MM/AA)'),
	securityCode: z
		.string()
		.min(1, 'CVV é obrigatório')
		.regex(/^\d{3,4}$/, 'CVV inválido'),
	identificationNumber: z
		.string()
		.min(1, 'CPF é obrigatório')
		.regex(/^\d{11}$/, 'CPF inválido'),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export function PaymentCheckoutPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [errorMessage, setErrorMessage] = useState('')
	const [timeLeft, setTimeLeft] = useState<number | null>(null)
	const [pendingPayment, setPendingPayment] = useState<PendingPaymentData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [focus, setFocus] = useState<'number' | 'name' | 'expiry' | 'cvc' | undefined>(undefined)
	const pendingPaymentId = searchParams.get('id')

	const {
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<PaymentFormData>({
		resolver: zodResolver(paymentSchema),
		mode: 'onBlur',
	})

	const cardNumber = watch('cardNumber', '')
	const cardholderName = watch('cardholderName', '')
	const cardExpiration = watch('cardExpiration', '')
	const securityCode = watch('securityCode', '')

	useEffect(() => {
		if (!pendingPaymentId) {
			navigate('/register')
			return
		}

		const fetchPendingPayment = async () => {
			try {
				setIsLoading(true)
				const data = await getPendingPayment(pendingPaymentId)
				setPendingPayment(data)

				const expiresAt = new Date(data.expiresAt).getTime()
				const now = Date.now()
				const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000))
				setTimeLeft(secondsLeft)

				if (secondsLeft <= 0) {
					toast.error('Tempo expirado. Por favor, faça o cadastro novamente.')
					navigate('/register')
				}
			} catch (err) {
				const error = err as ApiError
				toast.error(error.message || 'Erro ao carregar dados do pagamento')
				navigate('/register')
			} finally {
				setIsLoading(false)
			}
		}

		fetchPendingPayment()
	}, [pendingPaymentId, navigate])

	useEffect(() => {
		if (timeLeft === null || timeLeft <= 0) return

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(timer)
					toast.error('Tempo expirado. Por favor, faça o cadastro novamente.')
					navigate('/register')
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => clearInterval(timer)
	}, [timeLeft, navigate])

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const handleCardNumberChange = useCallback(
		(_e: React.ChangeEvent<HTMLInputElement>, rawValue?: string) => {
			if (rawValue !== undefined) {
				setValue('cardNumber', rawValue, { shouldValidate: false })
			}
		},
		[setValue],
	)

	const handleCardholderNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value.toUpperCase()
			setValue('cardholderName', value, { shouldValidate: false })
		},
		[setValue],
	)

	const handleExpirationChange = useCallback(
		(_e: React.ChangeEvent<HTMLInputElement>, rawValue?: string) => {
			if (rawValue !== undefined) {
				const formatted =
					rawValue.length >= 2 ? `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}` : rawValue
				setValue('cardExpiration', formatted, { shouldValidate: false })
			}
		},
		[setValue],
	)

	const handleSecurityCodeChange = useCallback(
		(_e: React.ChangeEvent<HTMLInputElement>, rawValue?: string) => {
			if (rawValue !== undefined) {
				setValue('securityCode', rawValue, { shouldValidate: false })
			}
		},
		[setValue],
	)

	const handleCpfChange = useCallback(
		(_e: React.ChangeEvent<HTMLInputElement>, rawValue?: string) => {
			if (rawValue !== undefined) {
				setValue('identificationNumber', rawValue, { shouldValidate: false })
			}
		},
		[setValue],
	)

	const onSubmit = async (data: PaymentFormData) => {
		if (!pendingPaymentId) {
			toast.error('ID de pagamento não encontrado')
			return
		}

		try {
			setErrorMessage('')

			const [expMonth = '', expYear = ''] = data.cardExpiration.split('/')

			const cardData = {
				type: 'card',
				card: {
					number: data.cardNumber.replace(/\s/g, ''),
					holder_name: data.cardholderName,
					exp_month: Number.parseInt(expMonth, 10),
					exp_year: Number.parseInt(`20${expYear}`, 10),
					cvv: data.securityCode,
				},
			}

			const tokenResponse = await fetch(
				`https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(cardData),
				},
			)

			if (!tokenResponse.ok) {
				throw new Error(
					'Não foi possível processar os dados do cartão. Verifique as informações e tente novamente.',
				)
			}

			const tokenData = await tokenResponse.json()
			const cardToken = tokenData.id

			const result = await processCardPayment({
				pendingPaymentId,
				cardToken,
				installments: 1,
			})

			if (result.status === 'paid') {
				toast.success('Pagamento aprovado! Bem-vindo ao 3Balug!', {
					autoClose: 5000,
				})
				navigate('/login')
			} else if (result.status === 'pending' || result.status === 'processing') {
				toast.info('Pagamento em análise. Você receberá um email quando for aprovado.', {
					autoClose: 7000,
				})
				navigate('/login')
			} else {
				toast.error('Pagamento não foi aprovado. Tente novamente.', {
					autoClose: 5000,
				})
				setErrorMessage('Pagamento não foi aprovado. Verifique os dados do cartão.')
			}
		} catch (err) {
			const error = err as ApiError
			const errorMessage = error.message || 'Falha ao processar pagamento'
			setErrorMessage(errorMessage)
			toast.error(errorMessage, { autoClose: 5000 })
		}
	}

	if (isLoading) {
		return (
			<div className={styles.paymentPage}>
				<div className={styles.loadingContainer}>
					<Loader2 className={styles.loadingSpinner} />
					<p>Carregando dados do pagamento...</p>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.paymentPage}>
			<div className={styles.paymentContainer}>
				<div className={styles.paymentLeftColumn}>
					<div className={styles.paymentHeader}>
						<div className={styles.paymentIconWrapper}>
							<CreditCard className={styles.paymentIcon} />
						</div>
						<div className={styles.paymentHeaderContent}>
							<h1 className={styles.paymentHeaderTitle}>Informações de Pagamento</h1>
							<p className={styles.paymentHeaderText}>Complete os dados do cartão para finalizar</p>
						</div>
						{timeLeft !== null && (
							<div className={styles.timerBadge}>
								<Clock size={14} />
								{formatTime(timeLeft)}
							</div>
						)}
					</div>

					<div style={{ marginBottom: '2rem' }}>
						<Cards
							number={cardNumber.replace(/\s/g, '')}
							name={cardholderName}
							expiry={cardExpiration.replace('/', '')}
							cvc={securityCode}
							focused={focus}
							locale={{
								valid: 'Válido até',
							}}
							placeholders={{
								name: 'SEU NOME AQUI',
							}}
						/>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className={styles.paymentForm} noValidate>
						{errorMessage && (
							<div className={styles.paymentError} role="alert">
								<AlertCircle className={styles.errorIcon} />
								<span>{errorMessage}</span>
							</div>
						)}

						<Input
							type="text"
							label="Número do Cartão"
							placeholder="1234 5678 9012 3456"
							error={errors.cardNumber?.message}
							fullWidth
							inputMode="numeric"
							mask="cardNumber"
							onChange={handleCardNumberChange}
							onFocus={() => setFocus('number')}
							onBlur={() => setFocus(undefined)}
						/>

						<Input
							type="text"
							label="Nome do Titular"
							placeholder="Como está no cartão"
							error={errors.cardholderName?.message}
							fullWidth
							uppercase
							onChange={handleCardholderNameChange}
							onFocus={() => setFocus('name')}
							onBlur={() => setFocus(undefined)}
						/>

						<div className={styles.inputRow}>
							<Input
								type="text"
								label="Validade"
								placeholder="MM/AA"
								error={errors.cardExpiration?.message}
								fullWidth
								inputMode="numeric"
								mask="cardExpiration"
								onChange={handleExpirationChange}
								onFocus={() => setFocus('expiry')}
								onBlur={() => setFocus(undefined)}
							/>
							<Input
								type="text"
								label="CVV"
								placeholder="123"
								error={errors.securityCode?.message}
								fullWidth
								inputMode="numeric"
								mask="cvv"
								onChange={handleSecurityCodeChange}
								onFocus={() => setFocus('cvc')}
								onBlur={() => setFocus(undefined)}
							/>
						</div>

						<Input
							type="text"
							label="CPF do Titular"
							placeholder="000.000.000-00"
							error={errors.identificationNumber?.message}
							fullWidth
							inputMode="numeric"
							mask="cpf"
							onChange={handleCpfChange}
							onFocus={() => setFocus(undefined)}
						/>

						<Button type="submit" loading={isSubmitting} fullWidth className={styles.submitButton}>
							{isSubmitting ? 'Processando...' : 'Finalizar Pagamento'}
						</Button>

						<Link to="/register" className={styles.backLink}>
							<ArrowLeft size={16} />
							Voltar para cadastro
						</Link>
					</form>
				</div>

				<div className={styles.paymentRightColumn}>
					{pendingPayment && (
						<div className={styles.customerInfo}>
							<h2 className={styles.summaryTitle}>Dados do Cliente</h2>
							<div className={styles.customerInfoItem}>
								<User size={16} className={styles.customerInfoIcon} />
								<span>{pendingPayment.name}</span>
							</div>
							<div className={styles.customerInfoItem}>
								<Mail size={16} className={styles.customerInfoIcon} />
								<span>{pendingPayment.email}</span>
							</div>
						</div>
					)}

					<div className={styles.orderSummary}>
						<h2 className={styles.summaryTitle}>Resumo do Pedido</h2>

						<div className={styles.summaryItem}>
							<span className={styles.summaryLabel}>Plano Selecionado</span>
							<span className={styles.summaryValue}>
								{pendingPayment?.plan.name || 'Carregando...'}
							</span>
						</div>

						<div className={styles.summaryItem}>
							<span className={styles.summaryLabel}>Período</span>
							<span className={styles.summaryValue}>Mensal</span>
						</div>

						<div className={styles.summaryTotal}>
							<span className={styles.summaryTotalLabel}>Total</span>
							<span className={styles.summaryTotalValue}>
								{pendingPayment ? formatPrice(pendingPayment.plan.price) : 'Carregando...'}
							</span>
						</div>
					</div>

					<div className={styles.securityBadge}>
						<Lock className={styles.securityIcon} />
						<div>
							<div style={{ fontWeight: 600, marginBottom: '2px' }}>Pagamento 100% Seguro</div>
							<div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
								Seus dados estão protegidos com criptografia SSL
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
