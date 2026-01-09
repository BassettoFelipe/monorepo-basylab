import { zodResolver } from '@hookform/resolvers/zod'
import {
	AlertTriangle,
	Briefcase,
	Camera,
	Check,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	FileText,
	Info,
	Loader2,
	MapPin,
	Phone,
	Trash2,
	User,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Button } from '@/components/Button/Button'
import { DocumentUpload } from '@/components/DocumentUpload/DocumentUpload'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useCepLookup } from '@/hooks/useCepLookup'
import { useMaskedInput } from '@/hooks/useMaskedInput'
import { useUpdateTenantMutation } from '@/queries/tenants/useUpdateTenantMutation'
import { type EditTenantFormData, editTenantSchema } from '@/schemas/tenant.schema'
import { uploadWithPresignedUrl } from '@/services/files/upload'
import { DOCUMENT_ENTITY_TYPES } from '@/types/document.types'
import { BRAZILIAN_STATES } from '@/types/property-owner.types'
import { MARITAL_STATUS_LABELS, type Tenant } from '@/types/tenant.types'
import { getUploadErrorMessage, handleApiError } from '@/utils/api-error-handler'
import { applyMask, formatCurrencyToInput, getCurrencyRawValue } from '@/utils/masks'
import * as styles from './EditTenantModal.styles.css'

const cepRegex = /^\d{5}-?\d{3}$/

const PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const PHOTO_MAX_SIZE = 5 * 1024 * 1024 // 5MB

interface EditTenantModalProps {
	isOpen: boolean
	onClose: () => void
	tenant: Tenant | null
}

interface Step {
	id: string
	title: string
	description: string
	icon: React.ReactNode
}

const STEPS: Step[] = [
	{
		id: 'identification',
		title: 'Identificacao',
		description: 'Foto e dados de identificacao',
		icon: <User size={16} />,
	},
	{
		id: 'personal',
		title: 'Pessoal',
		description: 'Informacoes pessoais adicionais',
		icon: <Briefcase size={16} />,
	},
	{
		id: 'contact',
		title: 'Contato',
		description: 'Telefones e email',
		icon: <Phone size={16} />,
	},
	{
		id: 'address',
		title: 'Endereco',
		description: 'Endereco completo',
		icon: <MapPin size={16} />,
	},
	{
		id: 'financial',
		title: 'Financeiro',
		description: 'Renda e empregador',
		icon: <DollarSign size={16} />,
	},
	{
		id: 'documents',
		title: 'Documentos',
		description: 'Gerenciar documentos',
		icon: <FileText size={16} />,
	},
]

export function EditTenantModal({ isOpen, onClose, tenant }: EditTenantModalProps) {
	const updateMutation = useUpdateTenantMutation()
	const [currentStep, setCurrentStep] = useState(0)
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
	const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
	const photoInputRef = useRef<HTMLInputElement>(null)
	const [photoFile, setPhotoFile] = useState<File | null>(null)
	const [photoPreview, setPhotoPreview] = useState<string | null>(null)
	const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)

	// Custom hooks
	const {
		isLoading: cepLoading,
		error: cepError,
		fetchAddress,
		clearError: clearCepError,
	} = useCepLookup()

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		trigger,
	} = useForm<EditTenantFormData>({
		resolver: zodResolver(editTenantSchema),
		mode: 'onBlur',
	})

	const { createMaskedHandler } = useMaskedInput(setValue)

	const notesValue = watch('notes') || ''

	// Populate form when tenant changes
	useEffect(() => {
		if (tenant) {
			const formattedCpf = applyMask(tenant.cpf, 'cpf')
			const formattedRg = tenant.rg ? applyMask(tenant.rg, 'rg') : ''
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
				rg: formattedRg,
				birthDate: tenant.birthDate || '',
				nationality: tenant.nationality || '',
				maritalStatus: tenant.maritalStatus || undefined,
				profession: tenant.profession || '',
				email: tenant.email || '',
				phone: formattedPhone,
				emergencyContact: tenant.emergencyContact || '',
				emergencyPhone: formattedEmergencyPhone,
				zipCode: formattedZipCode,
				address: tenant.address || '',
				city: tenant.city || '',
				state: tenant.state || '',
				monthlyIncome: formattedIncome,
				employer: tenant.employer || '',
				notes: tenant.notes || '',
			})

			// Set existing photo
			if (tenant.photoUrl) {
				setExistingPhotoUrl(tenant.photoUrl)
				setPhotoPreview(tenant.photoUrl)
			} else {
				setExistingPhotoUrl(null)
				setPhotoPreview(null)
			}

			setPhotoFile(null)
			clearCepError()
			setCurrentStep(0)
		}
	}, [tenant, reset, clearCepError])

	const handleClose = useCallback(() => {
		if (!updateMutation.isPending && !isUploadingPhoto) {
			if (photoPreview && photoPreview !== existingPhotoUrl) {
				URL.revokeObjectURL(photoPreview)
			}
			reset()
			clearCepError()
			setCurrentStep(0)
			setPhotoFile(null)
			setPhotoPreview(null)
			setExistingPhotoUrl(null)
			onClose()
		}
	}, [
		updateMutation.isPending,
		isUploadingPhoto,
		photoPreview,
		existingPhotoUrl,
		reset,
		clearCepError,
		onClose,
	])

	const processPhotoFile = useCallback(
		(file: File) => {
			if (!PHOTO_ACCEPTED_TYPES.includes(file.type)) {
				toast.error('Tipo de arquivo nao permitido. Use JPEG, PNG ou WebP.')
				return
			}

			if (file.size > PHOTO_MAX_SIZE) {
				toast.error('Arquivo muito grande. O tamanho maximo e 5MB.')
				return
			}

			if (photoPreview && photoPreview !== existingPhotoUrl) {
				URL.revokeObjectURL(photoPreview)
			}

			setPhotoFile(file)
			setPhotoPreview(URL.createObjectURL(file))
		},
		[photoPreview, existingPhotoUrl],
	)

	const handlePhotoSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file) return

			processPhotoFile(file)

			if (photoInputRef.current) {
				photoInputRef.current.value = ''
			}
		},
		[processPhotoFile],
	)

	const handlePhotoDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>, disabled: boolean) => {
			e.preventDefault()
			setIsDraggingPhoto(false)

			if (disabled) return

			const file = e.dataTransfer.files?.[0]
			if (file) {
				processPhotoFile(file)
			}
		},
		[processPhotoFile],
	)

	const handlePhotoDragOver = useCallback(
		(e: React.DragEvent<HTMLDivElement>, disabled: boolean) => {
			e.preventDefault()
			if (!disabled) {
				setIsDraggingPhoto(true)
			}
		},
		[],
	)

	const handlePhotoDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		setIsDraggingPhoto(false)
	}, [])

	const handleRemovePhoto = useCallback(() => {
		if (photoPreview && photoPreview !== existingPhotoUrl) {
			URL.revokeObjectURL(photoPreview)
		}
		setPhotoFile(null)
		setPhotoPreview(null)
		setExistingPhotoUrl(null)
	}, [photoPreview, existingPhotoUrl])

	// Cleanup blob URLs on unmount
	// Using refs to avoid revoking URLs on every state change
	const photoPreviewRef = useRef<string | null>(null)
	const existingPhotoUrlRef = useRef<string | null>(null)

	useEffect(() => {
		photoPreviewRef.current = photoPreview
	}, [photoPreview])

	useEffect(() => {
		existingPhotoUrlRef.current = existingPhotoUrl
	}, [existingPhotoUrl])

	useEffect(() => {
		return () => {
			if (photoPreviewRef.current && photoPreviewRef.current !== existingPhotoUrlRef.current) {
				URL.revokeObjectURL(photoPreviewRef.current)
			}
		}
	}, [])

	// Handler para CPF com mascara
	const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'cpf')
		setValue('cpf', masked, { shouldValidate: false })
	}

	const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
		const cep = e.target.value
		if (cepRegex.test(cep)) {
			const result = await fetchAddress(cep)
			if (result) {
				setValue('address', result.address)
				setValue('city', result.city)
				setValue('state', result.state)
			}
		}
	}

	const handleMonthlyIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'currency')
		setValue('monthlyIncome', masked, { shouldValidate: false })
	}

	const validateCurrentStep = async (): Promise<boolean> => {
		switch (currentStep) {
			case 0: // Identificacao
				return await trigger(['name', 'cpf'])
			case 1: // Pessoal (campos opcionais)
				return true
			case 2: // Contato
				return await trigger(['phone', 'email'])
			case 3: // Endereco (campos opcionais)
				return true
			case 4: // Financeiro (campos opcionais)
				return true
			case 5: // Documentos (campos opcionais)
				return true
			default:
				return true
		}
	}

	const handleNext = async () => {
		const isValid = await validateCurrentStep()
		if (isValid && currentStep < STEPS.length - 1) {
			setCurrentStep(currentStep + 1)
		}
	}

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1)
		}
	}

	const handleStepClick = (stepIndex: number) => {
		// Allow clicking on completed steps or current step
		if (stepIndex <= currentStep) {
			setCurrentStep(stepIndex)
		}
	}

	const onSubmit = async (data: EditTenantFormData) => {
		if (!tenant) return

		// Previne multiplas submissoes
		if (updateMutation.isPending || isUploadingPhoto) {
			return
		}

		try {
			let photoUrl: string | null | undefined

			// Upload new photo if selected
			if (photoFile) {
				setIsUploadingPhoto(true)
				try {
					const uploadResult = await uploadWithPresignedUrl({
						file: photoFile,
						entityType: 'tenant',
						entityId: tenant.id,
						fieldId: 'photo',
					})
					photoUrl = uploadResult.url
				} catch (photoError) {
					const errorMsg = getUploadErrorMessage(photoError, photoFile?.name)
					toast.error(errorMsg)
					setIsUploadingPhoto(false)
					return
				} finally {
					setIsUploadingPhoto(false)
				}
			} else if (!photoPreview && existingPhotoUrl) {
				// Photo was removed
				photoUrl = null
			}

			const monthlyIncomeValue = data.monthlyIncome ? getCurrencyRawValue(data.monthlyIncome) : null

			const payload = {
				...data,
				cpf: data.cpf.replace(/\D/g, ''),
				phone: data.phone?.replace(/\D/g, '') || null,
				emergencyPhone: data.emergencyPhone?.replace(/\D/g, '') || null,
				zipCode: data.zipCode?.replace(/\D/g, '') || null,
				email: data.email || null,
				rg: data.rg?.replace(/\D/g, '') || null,
				nationality: data.nationality || null,
				maritalStatus: data.maritalStatus || null,
				profession: data.profession || null,
				address: data.address || null,
				city: data.city || null,
				state: data.state || null,
				birthDate: data.birthDate || null,
				monthlyIncome: monthlyIncomeValue,
				employer: data.employer || null,
				emergencyContact: data.emergencyContact || null,
				notes: data.notes || null,
				...(photoUrl !== undefined && { photoUrl }),
			}

			const response = await updateMutation.mutateAsync({
				id: tenant.id,
				input: payload,
			})

			toast.success(response.message || 'Inquilino atualizado com sucesso!')
			onClose()
		} catch (error: unknown) {
			const errorMessage = handleApiError(error, 'Erro ao atualizar inquilino')
			toast.error(errorMessage)
		}
	}

	const isSubmitting = updateMutation.isPending || isUploadingPhoto
	const isLastStep = currentStep === STEPS.length - 1
	const isFirstStep = currentStep === 0
	const progress = ((currentStep + 1) / STEPS.length) * 100
	const currentStepData = STEPS[currentStep]

	if (!tenant) return null

	const renderCustomHeader = () => (
		<div className={styles.customHeader}>
			{/* Left: Title and Description */}
			<div className={styles.headerLeft}>
				<div className={styles.headerInfo}>
					<h2 className={styles.headerTitle}>Editar Inquilino</h2>
					<p className={styles.headerDescription}>{currentStepData.description}</p>
				</div>
			</div>

			{/* Center: Steps */}
			<div className={styles.headerCenter}>
				<div className={styles.stepsContainer}>
					{STEPS.map((step, index) => {
						const isCompleted = index < currentStep
						const isActive = index === currentStep
						const isClickable = index <= currentStep

						return (
							<div key={step.id} className={styles.stepItem}>
								<button
									type="button"
									className={`${styles.stepContent} ${isClickable ? styles.stepContentClickable : ''}`}
									onClick={() => isClickable && handleStepClick(index)}
									disabled={!isClickable || isSubmitting}
								>
									<div
										className={`${styles.stepCircle} ${
											isCompleted
												? styles.stepCircleCompleted
												: isActive
													? styles.stepCircleActive
													: styles.stepCirclePending
										}`}
									>
										{isCompleted ? <Check size={18} /> : step.icon}
									</div>
									<span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
										{step.title}
									</span>
								</button>
								{index < STEPS.length - 1 && (
									<div
										className={`${styles.stepConnector} ${
											isCompleted ? styles.stepConnectorCompleted : ''
										}`}
									/>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Right: Close button */}
			<div className={styles.headerRight}>
				<button
					type="button"
					className={styles.closeButton}
					onClick={handleClose}
					aria-label="Fechar modal"
					disabled={isSubmitting}
				>
					<X size={20} />
				</button>
			</div>
		</div>
	)

	const renderFooter = () => (
		<div className={styles.footer}>
			<div className={styles.footerLeft}>
				<span className={styles.progressText}>
					Passo {currentStep + 1} de {STEPS.length}
				</span>
				<div className={styles.progressBar}>
					<div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
				</div>
			</div>

			<div className={styles.footerRight}>
				{isFirstStep ? (
					<Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
						Cancelar
					</Button>
				) : (
					<Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
						<ChevronLeft size={18} />
						Anterior
					</Button>
				)}

				{isLastStep ? (
					<Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
						Salvar Alteracoes
					</Button>
				) : (
					<Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
						Proximo
						<ChevronRight size={18} />
					</Button>
				)}
			</div>
		</div>
	)

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Editar Inquilino"
			size="full"
			footer={renderFooter()}
			customHeader={renderCustomHeader()}
		>
			<form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
				{/* Step 1: Identificacao */}
				{currentStep === 0 && (
					<div className={styles.formSection}>
						{/* Foto de Perfil */}
						{/* biome-ignore lint/a11y/useSemanticElements: Card interativo com drag and drop requer div */}
						<div
							className={`${styles.photoUploadCard} ${
								photoPreview ? styles.photoUploadCardFilled : ''
							} ${isDraggingPhoto ? styles.photoUploadCardDragging : ''} ${
								isSubmitting ? styles.photoUploadCardDisabled : ''
							}`}
							onClick={() => !isSubmitting && !photoPreview && photoInputRef.current?.click()}
							onDragOver={(e) => handlePhotoDragOver(e, isSubmitting)}
							onDragLeave={handlePhotoDragLeave}
							onDrop={(e) => handlePhotoDrop(e, isSubmitting)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									if (!isSubmitting && !photoPreview) {
										photoInputRef.current?.click()
									}
								}
							}}
						>
							<input
								ref={photoInputRef}
								type="file"
								accept={PHOTO_ACCEPTED_TYPES.join(',')}
								onChange={handlePhotoSelect}
								style={{ display: 'none' }}
								tabIndex={-1}
							/>

							{photoPreview ? (
								<div className={styles.photoPreviewContent}>
									<div className={styles.photoPreviewImage}>
										<img
											src={photoPreview}
											alt="Preview da foto"
											className={styles.photoPreviewImg}
										/>
									</div>
									<div className={styles.photoPreviewInfo}>
										<span className={styles.photoPreviewName}>
											{photoFile?.name || 'Foto atual'}
										</span>
										<span className={styles.photoPreviewSize}>
											{photoFile
												? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB`
												: 'Foto existente'}
										</span>
									</div>
									<div className={styles.photoPreviewActions}>
										<button
											type="button"
											className={styles.photoActionBtn}
											onClick={(e) => {
												e.stopPropagation()
												photoInputRef.current?.click()
											}}
											disabled={isSubmitting}
											title="Alterar foto"
										>
											<Camera size={18} />
										</button>
										<button
											type="button"
											className={`${styles.photoActionBtn} ${styles.photoActionBtnDelete}`}
											onClick={(e) => {
												e.stopPropagation()
												handleRemovePhoto()
											}}
											disabled={isSubmitting}
											title="Remover foto"
										>
											<Trash2 size={18} />
										</button>
									</div>
								</div>
							) : (
								<div className={styles.photoUploadContent}>
									<div className={styles.photoUploadIcon}>
										<Camera size={32} />
									</div>
									<div className={styles.photoUploadText}>
										<span className={styles.photoUploadTitle}>Foto do Inquilino</span>
										<span className={styles.photoUploadHint}>
											Arraste uma imagem ou clique para selecionar
										</span>
										<span className={styles.photoUploadFormats}>JPEG, PNG ou WebP (max 5MB)</span>
									</div>
								</div>
							)}
						</div>

						<Input
							{...register('name')}
							label="Nome Completo"
							placeholder="Digite o nome completo"
							error={errors.name?.message}
							fullWidth
							disabled={isSubmitting}
							required
						/>

						<div className={styles.row2Cols}>
							<Input
								{...register('cpf', { onChange: handleCpfChange })}
								label="CPF"
								placeholder="000.000.000-00"
								error={errors.cpf?.message}
								fullWidth
								disabled={isSubmitting}
								required
							/>
							<Input
								{...register('rg')}
								onChange={createMaskedHandler('rg', 'rg')}
								label="RG"
								placeholder="00.000.000-0"
								fullWidth
								disabled={isSubmitting}
							/>
						</div>
					</div>
				)}

				{/* Step 2: Dados Pessoais */}
				{currentStep === 1 && (
					<div className={styles.formSection}>
						<div className={styles.row2Cols}>
							<Input
								{...register('birthDate')}
								type="date"
								label="Data de Nascimento"
								fullWidth
								disabled={isSubmitting}
							/>
							<Input
								{...register('nationality')}
								label="Nacionalidade"
								placeholder="Brasileiro(a)"
								fullWidth
								disabled={isSubmitting}
							/>
						</div>

						<div className={styles.row2Cols}>
							<Select
								{...register('maritalStatus')}
								label="Estado Civil"
								fullWidth
								disabled={isSubmitting}
								placeholder="Selecione"
								options={Object.entries(MARITAL_STATUS_LABELS).map(([value, label]) => ({
									value,
									label,
								}))}
							/>
							<Input
								{...register('profession')}
								label="Profissao"
								placeholder="Engenheiro(a), Medico(a)..."
								fullWidth
								disabled={isSubmitting}
							/>
						</div>
					</div>
				)}

				{/* Step 3: Contato */}
				{currentStep === 2 && (
					<div className={styles.formSection}>
						<div className={styles.row2Cols}>
							<Input
								{...register('phone')}
								onChange={createMaskedHandler('phone', 'phone')}
								type="tel"
								label="Telefone"
								placeholder="(11) 99999-9999"
								error={errors.phone?.message}
								fullWidth
								disabled={isSubmitting}
								required
							/>
							<Input
								{...register('email')}
								type="email"
								label="Email"
								placeholder="email@exemplo.com"
								error={errors.email?.message}
								fullWidth
								disabled={isSubmitting}
							/>
						</div>

						<div className={styles.documentsInfo}>
							<Info size={18} className={styles.documentsInfoIcon} />
							<p className={styles.documentsInfoText}>
								Preencha os dados do contato de emergencia caso necessario.
							</p>
						</div>

						<div className={styles.row2Cols}>
							<Input
								{...register('emergencyContact')}
								label="Contato de Emergencia"
								placeholder="Nome completo"
								error={errors.emergencyContact?.message}
								fullWidth
								disabled={isSubmitting}
							/>
							<Input
								{...register('emergencyPhone')}
								onChange={createMaskedHandler('emergencyPhone', 'phone')}
								type="tel"
								label="Telefone de Emergencia"
								placeholder="(11) 99999-9999"
								error={errors.emergencyPhone?.message}
								fullWidth
								disabled={isSubmitting}
							/>
						</div>
					</div>
				)}

				{/* Step 4: Endereco */}
				{currentStep === 3 && (
					<div className={styles.formSection}>
						<div className={styles.row3Cols}>
							<div className={styles.cepWrapper}>
								<Input
									{...register('zipCode')}
									onChange={createMaskedHandler('zipCode', 'cep')}
									label="CEP"
									placeholder="00000-000"
									error={errors.zipCode?.message}
									fullWidth
									disabled={isSubmitting || cepLoading}
									onBlur={handleCepBlur}
									rightIcon={
										cepLoading ? <Loader2 size={18} className={styles.spinner} /> : undefined
									}
								/>
								<div aria-live="polite" aria-atomic="true">
									{cepLoading && <span className={styles.cepHint}>Buscando endereco...</span>}
								</div>
							</div>
							<Input
								{...register('city')}
								label="Cidade"
								placeholder="Cidade"
								error={errors.city?.message}
								fullWidth
								disabled={isSubmitting}
							/>
							<Select
								{...register('state')}
								label="Estado"
								placeholder="UF"
								error={errors.state?.message}
								fullWidth
								disabled={isSubmitting}
								options={BRAZILIAN_STATES}
							/>
						</div>

						<div aria-live="polite" aria-atomic="true">
							{cepError && !cepLoading && (
								<div className={styles.cepAlert}>
									<AlertTriangle size={18} className={styles.cepAlertIcon} />
									<div className={styles.cepAlertContent}>
										<p className={styles.cepAlertTitle}>CEP nao encontrado</p>
										<p className={styles.cepAlertText}>
											Preencha os campos de endereco manualmente.
										</p>
									</div>
								</div>
							)}
						</div>

						<Input
							{...register('address')}
							label="Endereco Completo"
							placeholder="Rua, numero, complemento, bairro"
							error={errors.address?.message}
							fullWidth
							disabled={isSubmitting}
						/>

						<Textarea
							{...register('notes')}
							label="Observacoes"
							placeholder="Informacoes adicionais sobre o inquilino..."
							error={errors.notes?.message}
							fullWidth
							disabled={isSubmitting}
							rows={3}
							showCharCount
							maxLength={500}
							value={notesValue}
						/>
					</div>
				)}

				{/* Step 5: Financeiro */}
				{currentStep === 4 && (
					<div className={styles.formSection}>
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
								disabled={isSubmitting}
							/>
							<Input
								{...register('employer')}
								label="Empregador"
								placeholder="Nome da empresa"
								error={errors.employer?.message}
								fullWidth
								disabled={isSubmitting}
							/>
						</div>

						<div className={styles.documentsInfo}>
							<Info size={18} className={styles.documentsInfoIcon} />
							<p className={styles.documentsInfoText}>
								Essas informacoes sao opcionais, mas podem ajudar na analise de credito do
								inquilino.
							</p>
						</div>
					</div>
				)}

				{/* Step 6: Documentos */}
				{currentStep === 5 && (
					<div className={styles.formSection}>
						<div className={styles.documentsInfo}>
							<Info size={18} className={styles.documentsInfoIcon} />
							<p className={styles.documentsInfoText}>
								Gerencie os documentos do inquilino. Voce pode adicionar novos documentos ou remover
								os existentes.
							</p>
						</div>

						<DocumentUpload
							entityType={DOCUMENT_ENTITY_TYPES.TENANT}
							entityId={tenant.id}
							disabled={isSubmitting}
						/>
					</div>
				)}
			</form>
		</Modal>
	)
}
