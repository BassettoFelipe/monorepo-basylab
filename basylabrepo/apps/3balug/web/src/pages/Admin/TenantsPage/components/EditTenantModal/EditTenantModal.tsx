import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { Button } from '@/components/Button/Button'
import { DocumentUpload } from '@/components/DocumentUpload/DocumentUpload'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Textarea } from '@/components/Textarea/Textarea'
import { useUpdateTenantMutation } from '@/queries/tenants/useUpdateTenantMutation'
import { DOCUMENT_ENTITY_TYPES } from '@/types/document.types'
import type { Tenant } from '@/types/tenant.types'
import { applyMask, formatCurrencyToInput, getCurrencyRawValue } from '@/utils/masks'
import * as styles from '../TenantForm.styles.css'

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const cepRegex = /^\d{5}-?\d{3}$/

const editTenantSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no maximo 100 caracteres'),
	cpf: z.string().min(1, 'CPF e obrigatorio').regex(cpfRegex, 'CPF invalido'),
	email: z.string().email('Email invalido').optional().or(z.literal('')),
	phone: z.string().min(1, 'Telefone e obrigatorio'),
	zipCode: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	birthDate: z.string().optional(),
	monthlyIncome: z.string().optional(),
	employer: z.string().optional(),
	emergencyContact: z.string().optional(),
	emergencyPhone: z.string().optional(),
	notes: z.string().optional(),
})

type EditTenantFormData = z.infer<typeof editTenantSchema>

interface ViaCepResponse {
	cep: string
	logradouro: string
	complemento: string
	bairro: string
	localidade: string
	uf: string
	erro?: boolean
}

interface EditTenantModalProps {
	isOpen: boolean
	onClose: () => void
	tenant: Tenant | null
}

export function EditTenantModal({ isOpen, onClose, tenant }: EditTenantModalProps) {
	const updateMutation = useUpdateTenantMutation()
	const [cepLoading, setCepLoading] = useState(false)
	const [cepError, setCepError] = useState<string | null>(null)

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
	} = useForm<EditTenantFormData>({
		resolver: zodResolver(editTenantSchema),
		mode: 'onBlur',
	})

	const notesValue = watch('notes') || ''

	useEffect(() => {
		if (tenant) {
			const formattedCpf = applyMask(tenant.cpf, 'cpf')
			const formattedPhone = tenant.phone ? applyMask(tenant.phone, 'phone') : ''
			const formattedEmergencyPhone = tenant.emergencyPhone
				? applyMask(tenant.emergencyPhone, 'phone')
				: ''
			const formattedZipCode = tenant.zipCode ? applyMask(tenant.zipCode, 'cep') : ''
			const formattedIncome = tenant.monthlyIncome
				? formatCurrencyToInput(tenant.monthlyIncome)
				: ''

			reset({
				name: tenant.name,
				cpf: formattedCpf,
				email: tenant.email || '',
				phone: formattedPhone,
				zipCode: formattedZipCode,
				address: tenant.address || '',
				city: tenant.city || '',
				state: tenant.state || '',
				birthDate: tenant.birthDate || '',
				monthlyIncome: formattedIncome,
				employer: tenant.employer || '',
				emergencyContact: tenant.emergencyContact || '',
				emergencyPhone: formattedEmergencyPhone,
				notes: tenant.notes || '',
			})
			setCepError(null)
		}
	}, [tenant, reset])

	const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'cpf')
		setValue('cpf', masked, { shouldValidate: false })
	}

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'phone')
		setValue('phone', masked, { shouldValidate: false })
	}

	const handleEmergencyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'phone')
		setValue('emergencyPhone', masked, { shouldValidate: false })
	}

	const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'cep')
		setValue('zipCode', masked, { shouldValidate: false })
	}

	const handleMonthlyIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'currency')
		setValue('monthlyIncome', masked, { shouldValidate: false })
	}

	const fetchAddressByCep = useCallback(
		async (cep: string) => {
			const cleanCep = cep.replace(/\D/g, '')

			if (cleanCep.length !== 8) {
				return
			}

			setCepLoading(true)
			setCepError(null)

			try {
				const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)

				if (!response.ok) {
					throw new Error('Erro ao buscar CEP')
				}

				const data: ViaCepResponse = await response.json()

				if (data.erro) {
					setCepError('CEP nao encontrado')
					return
				}

				setValue('address', data.logradouro || '')
				setValue('city', data.localidade || '')
				setValue('state', data.uf || '')
				setCepError(null)
			} catch {
				setCepError('Erro ao buscar CEP. Preencha manualmente.')
			} finally {
				setCepLoading(false)
			}
		},
		[setValue],
	)

	const handleCepBlur = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			const cep = e.target.value
			if (cepRegex.test(cep)) {
				fetchAddressByCep(cep)
			}
		},
		[fetchAddressByCep],
	)

	const onSubmit = async (data: EditTenantFormData) => {
		if (!tenant) return

		try {
			const monthlyIncomeValue = data.monthlyIncome ? getCurrencyRawValue(data.monthlyIncome) : null

			const payload = {
				...data,
				cpf: data.cpf.replace(/\D/g, ''),
				phone: data.phone?.replace(/\D/g, '') || null,
				emergencyPhone: data.emergencyPhone?.replace(/\D/g, '') || null,
				zipCode: data.zipCode?.replace(/\D/g, '') || null,
				email: data.email || null,
				address: data.address || null,
				city: data.city || null,
				state: data.state || null,
				birthDate: data.birthDate || null,
				monthlyIncome: monthlyIncomeValue,
				employer: data.employer || null,
				emergencyContact: data.emergencyContact || null,
				notes: data.notes || null,
			}
			const response = await updateMutation.mutateAsync({
				id: tenant.id,
				input: payload,
			})
			toast.success(response.message || 'Inquilino atualizado com sucesso!')
			onClose()
		} catch (error: unknown) {
			const errorMessage =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Erro ao atualizar inquilino'
			toast.error(errorMessage)
		}
	}

	const handleClose = () => {
		if (!updateMutation.isPending) {
			setCepError(null)
			onClose()
		}
	}

	if (!tenant) return null

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Editar Inquilino"
			size="xl"
			footer={
				<>
					<Button variant="outline" onClick={handleClose} disabled={updateMutation.isPending}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						onClick={handleSubmit(onSubmit)}
						loading={updateMutation.isPending}
					>
						Salvar Alteracoes
					</Button>
				</>
			}
		>
			<form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Dados Pessoais</h3>

					<Input
						{...register('name')}
						label="Nome Completo"
						placeholder="Digite o nome completo"
						error={errors.name?.message}
						fullWidth
						disabled={updateMutation.isPending}
						required
					/>

					<div className={styles.row2Cols}>
						<Input
							{...register('cpf', { onChange: handleCpfChange })}
							label="CPF"
							placeholder="000.000.000-00"
							error={errors.cpf?.message}
							fullWidth
							disabled={updateMutation.isPending}
							required
						/>
						<Input
							{...register('birthDate')}
							type="date"
							label="Data de Nascimento"
							error={errors.birthDate?.message}
							fullWidth
							disabled={updateMutation.isPending}
						/>
					</div>

					<div className={styles.row2Cols}>
						<Input
							{...register('email')}
							type="email"
							label="Email"
							placeholder="email@exemplo.com"
							error={errors.email?.message}
							fullWidth
							disabled={updateMutation.isPending}
						/>
						<Input
							{...register('phone', { onChange: handlePhoneChange })}
							type="tel"
							label="Telefone"
							placeholder="(11) 99999-9999"
							error={errors.phone?.message}
							fullWidth
							disabled={updateMutation.isPending}
							required
						/>
					</div>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Endereco</h3>

					<div className={styles.row3Cols}>
						<div className={styles.cepWrapper}>
							<Input
								{...register('zipCode', { onChange: handleCepChange })}
								label="CEP"
								placeholder="00000-000"
								error={errors.zipCode?.message}
								fullWidth
								disabled={updateMutation.isPending || cepLoading}
								onBlur={handleCepBlur}
								rightIcon={
									cepLoading ? <Loader2 size={18} className={styles.spinner} /> : undefined
								}
							/>
							{cepLoading && <span className={styles.cepHint}>Buscando endereco...</span>}
						</div>
						<Input
							{...register('city')}
							label="Cidade"
							placeholder="Cidade"
							error={errors.city?.message}
							fullWidth
							disabled={updateMutation.isPending}
						/>
						<Input
							{...register('state')}
							label="Estado"
							placeholder="UF"
							maxLength={2}
							error={errors.state?.message}
							fullWidth
							disabled={updateMutation.isPending}
							style={{ textTransform: 'uppercase' }}
						/>
						{cepError && !cepLoading && (
							<div className={styles.cepAlert}>
								<AlertTriangle size={18} className={styles.cepAlertIcon} />
								<div className={styles.cepAlertContent}>
									<p className={styles.cepAlertTitle}>CEP nao encontrado</p>
									<p className={styles.cepAlertText}>Preencha os campos de endereco manualmente.</p>
								</div>
							</div>
						)}
					</div>

					<Input
						{...register('address')}
						label="Endereco"
						placeholder="Rua, numero, complemento, bairro"
						error={errors.address?.message}
						fullWidth
						disabled={updateMutation.isPending}
					/>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Informacoes Financeiras</h3>

					<div className={styles.row2Cols}>
						<Input
							{...register('monthlyIncome', {
								onChange: handleMonthlyIncomeChange,
							})}
							label="Renda Mensal"
							placeholder="0,00"
							leftIcon={<span style={{ color: '#6B7280' }}>R$</span>}
							error={errors.monthlyIncome?.message}
							fullWidth
							disabled={updateMutation.isPending}
						/>
						<Input
							{...register('employer')}
							label="Empregador"
							placeholder="Nome da empresa"
							error={errors.employer?.message}
							fullWidth
							disabled={updateMutation.isPending}
						/>
					</div>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Contato de Emergencia</h3>

					<div className={styles.row2Cols}>
						<Input
							{...register('emergencyContact')}
							label="Nome do Contato"
							placeholder="Nome completo"
							error={errors.emergencyContact?.message}
							fullWidth
							disabled={updateMutation.isPending}
						/>
						<Input
							{...register('emergencyPhone', {
								onChange: handleEmergencyPhoneChange,
							})}
							type="tel"
							label="Telefone de Emergencia"
							placeholder="(11) 99999-9999"
							error={errors.emergencyPhone?.message}
							fullWidth
							disabled={updateMutation.isPending}
						/>
					</div>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Documentos</h3>

					<DocumentUpload
						entityType={DOCUMENT_ENTITY_TYPES.TENANT}
						entityId={tenant.id}
						disabled={updateMutation.isPending}
					/>
				</div>

				<div className={styles.section}>
					<h3 className={styles.sectionTitle}>Observacoes</h3>

					<Textarea
						{...register('notes')}
						label="Observacoes"
						placeholder="Informacoes adicionais sobre o inquilino..."
						error={errors.notes?.message}
						fullWidth
						disabled={updateMutation.isPending}
						rows={4}
						showCharCount
						maxLength={500}
						value={notesValue}
					/>
				</div>
			</form>
		</Modal>
	)
}
