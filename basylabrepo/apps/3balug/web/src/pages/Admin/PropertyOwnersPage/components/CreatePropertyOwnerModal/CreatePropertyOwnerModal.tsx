import { zodResolver } from '@hookform/resolvers/zod'
import {
	AlertTriangle,
	Briefcase,
	Camera,
	Check,
	ChevronLeft,
	ChevronRight,
	FileText,
	Info,
	Loader2,
	MapPin,
	Phone,
	Trash2,
	Upload,
	User,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'

import { Button } from '@/components/Button/Button'
import type { SelectedDocument } from '@/components/DocumentPicker/DocumentPicker'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { useUploadDocumentMutation } from '@/queries/documents/documents.queries'
import { useCreatePropertyOwnerMutation } from '@/queries/property-owners/useCreatePropertyOwnerMutation'
import { uploadWithPresignedUrl } from '@/services/files/upload'
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPES, type DocumentType } from '@/types/document.types'
import { BRAZILIAN_STATES, MARITAL_STATUS_LABELS } from '@/types/property-owner.types'
import { applyMask } from '@/utils/masks'
import * as styles from './CreatePropertyOwnerModal.styles.css'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

interface DocumentSlot {
	type: DocumentType
	label: string
	file: SelectedDocument | null
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
const cepRegex = /^\d{5}-?\d{3}$/

const PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const PHOTO_MAX_SIZE = 5 * 1024 * 1024 // 5MB

const createPropertyOwnerSchema = z
	.object({
		name: z
			.string()
			.min(2, 'Nome deve ter pelo menos 2 caracteres')
			.max(100, 'Nome deve ter no maximo 100 caracteres'),
		documentType: z.enum(['cpf', 'cnpj'], {
			message: 'Selecione o tipo de documento',
		}),
		document: z.string().min(1, 'Documento e obrigatorio'),
		rg: z.string().optional(),
		nationality: z.string().optional(),
		maritalStatus: z
			.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'])
			.optional(),
		profession: z.string().optional(),
		email: z.string().email('Email invalido').optional().or(z.literal('')),
		phone: z.string().min(1, 'Telefone e obrigatorio'),
		phoneSecondary: z.string().optional(),
		zipCode: z.string().optional(),
		address: z.string().optional(),
		addressNumber: z.string().optional(),
		addressComplement: z.string().optional(),
		neighborhood: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		birthDate: z.string().optional(),
		notes: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.documentType === 'cpf') {
				return cpfRegex.test(data.document)
			}
			return cnpjRegex.test(data.document)
		},
		{
			message: 'Documento invalido',
			path: ['document'],
		},
	)

type CreatePropertyOwnerFormData = z.infer<typeof createPropertyOwnerSchema>

interface ViaCepResponse {
	cep: string
	logradouro: string
	complemento: string
	bairro: string
	localidade: string
	uf: string
	erro?: boolean
}

interface CreatePropertyOwnerModalProps {
	isOpen: boolean
	onClose: () => void
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
		id: 'documents',
		title: 'Documentos',
		description: 'Anexar documentos (opcional)',
		icon: <FileText size={16} />,
	},
]

const INITIAL_DOCUMENT_SLOTS: DocumentSlot[] = [
	{ type: DOCUMENT_TYPES.RG, label: 'RG', file: null },
	{ type: DOCUMENT_TYPES.CPF, label: 'CPF', file: null },
	{ type: DOCUMENT_TYPES.COMPROVANTE_RESIDENCIA, label: 'Comprovante de Residencia', file: null },
	{ type: DOCUMENT_TYPES.OUTROS, label: 'Outros Documentos', file: null },
]

export function CreatePropertyOwnerModal({ isOpen, onClose }: CreatePropertyOwnerModalProps) {
	const createMutation = useCreatePropertyOwnerMutation()
	const uploadDocumentMutation = useUploadDocumentMutation()
	const [currentStep, setCurrentStep] = useState(0)
	const [cepLoading, setCepLoading] = useState(false)
	const [cepError, setCepError] = useState<string | null>(null)
	const [documentSlots, setDocumentSlots] = useState<DocumentSlot[]>(INITIAL_DOCUMENT_SLOTS)
	const [isUploading, setIsUploading] = useState(false)
	const [draggingSlot, setDraggingSlot] = useState<DocumentType | null>(null)
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
	const photoInputRef = useRef<HTMLInputElement>(null)
	const [photoFile, setPhotoFile] = useState<File | null>(null)
	const [photoPreview, setPhotoPreview] = useState<string | null>(null)
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
	const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		trigger,
	} = useForm<CreatePropertyOwnerFormData>({
		resolver: zodResolver(createPropertyOwnerSchema),
		mode: 'onBlur',
		defaultValues: {
			documentType: 'cpf',
		},
	})

	const documentType = watch('documentType')
	const notesValue = watch('notes') || ''

	const handleClose = useCallback(() => {
		if (!createMutation.isPending && !isUploading && !isUploadingPhoto) {
			for (const slot of documentSlots) {
				if (slot.file?.preview) {
					URL.revokeObjectURL(slot.file.preview)
				}
			}
			if (photoPreview) {
				URL.revokeObjectURL(photoPreview)
			}
			reset()
			setCepError(null)
			setDocumentSlots(INITIAL_DOCUMENT_SLOTS)
			setCurrentStep(0)
			setPhotoFile(null)
			setPhotoPreview(null)
			onClose()
		}
	}, [
		createMutation.isPending,
		isUploading,
		isUploadingPhoto,
		documentSlots,
		photoPreview,
		reset,
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

			if (photoPreview) {
				URL.revokeObjectURL(photoPreview)
			}

			setPhotoFile(file)
			setPhotoPreview(URL.createObjectURL(file))
		},
		[photoPreview],
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
		if (photoPreview) {
			URL.revokeObjectURL(photoPreview)
		}
		setPhotoFile(null)
		setPhotoPreview(null)
	}, [photoPreview])

	const handleFileSelect = useCallback((slotType: DocumentType, file: File) => {
		if (!ALLOWED_TYPES.includes(file.type)) {
			toast.error(`Tipo de arquivo nao permitido. Use PDF, JPG, PNG ou WebP.`)
			return
		}

		if (file.size > MAX_FILE_SIZE) {
			toast.error(`Arquivo muito grande (max 10MB)`)
			return
		}

		const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined

		const newDocument: SelectedDocument = {
			id,
			file,
			documentType: slotType,
			preview,
		}

		setDocumentSlots((prev) =>
			prev.map((slot) => (slot.type === slotType ? { ...slot, file: newDocument } : slot)),
		)
	}, [])

	const handleRemoveFile = useCallback((slotType: DocumentType) => {
		setDocumentSlots((prev) =>
			prev.map((slot) => {
				if (slot.type === slotType && slot.file?.preview) {
					URL.revokeObjectURL(slot.file.preview)
				}
				return slot.type === slotType ? { ...slot, file: null } : slot
			}),
		)
	}, [])

	useEffect(() => {
		if (isOpen) {
			setCurrentStep(0)
		}
	}, [isOpen])

	const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, documentType)
		setValue('document', masked, { shouldValidate: false })
	}

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'phone')
		setValue('phone', masked, { shouldValidate: false })
	}

	const handlePhoneSecondaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'phone')
		setValue('phoneSecondary', masked, { shouldValidate: false })
	}

	const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'cep')
		setValue('zipCode', masked, { shouldValidate: false })
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

	const validateCurrentStep = async (): Promise<boolean> => {
		switch (currentStep) {
			case 0: // Identificacao
				return await trigger(['name', 'documentType', 'document'])
			case 1: // Pessoal (campos opcionais)
				return true
			case 2: // Contato
				return await trigger(['phone', 'email'])
			case 3: // Endereco (campos opcionais)
				return true
			case 4: // Documentos (campos opcionais)
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

	const onSubmit = async (data: CreatePropertyOwnerFormData) => {
		try {
			let photoUrl: string | undefined

			// Upload da foto primeiro, se houver
			if (photoFile) {
				setIsUploadingPhoto(true)
				try {
					const uploadResult = await uploadWithPresignedUrl({
						file: photoFile,
						fieldId: 'property-owner-photo',
					})
					photoUrl = uploadResult.url
				} catch {
					toast.error('Erro ao enviar foto. Tente novamente.')
					setIsUploadingPhoto(false)
					return
				} finally {
					setIsUploadingPhoto(false)
				}
			}

			const payload = {
				...data,
				document: data.document.replace(/\D/g, ''),
				phone: data.phone?.replace(/\D/g, '') || undefined,
				phoneSecondary: data.phoneSecondary?.replace(/\D/g, '') || undefined,
				zipCode: data.zipCode?.replace(/\D/g, '') || undefined,
				email: data.email || undefined,
				rg: data.rg || undefined,
				nationality: data.nationality || undefined,
				maritalStatus: data.maritalStatus || undefined,
				profession: data.profession || undefined,
				address: data.address || undefined,
				addressNumber: data.addressNumber || undefined,
				addressComplement: data.addressComplement || undefined,
				neighborhood: data.neighborhood || undefined,
				city: data.city || undefined,
				state: data.state || undefined,
				birthDate: data.birthDate || undefined,
				photoUrl,
				notes: data.notes || undefined,
			}
			const response = await createMutation.mutateAsync(payload)
			const ownerId = response.data.id

			const filesToUpload = documentSlots.filter((slot) => slot.file !== null)
			if (filesToUpload.length > 0) {
				setIsUploading(true)
				try {
					for (const slot of filesToUpload) {
						if (slot.file) {
							await uploadDocumentMutation.mutateAsync({
								entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
								entityId: ownerId,
								documentType: slot.file.documentType,
								file: slot.file.file,
							})
						}
					}
				} catch {
					toast.error('Proprietario criado, mas houve erro ao enviar alguns documentos')
				} finally {
					setIsUploading(false)
				}
			}

			toast.success(response.message || 'Proprietario criado com sucesso!')
			reset()
			setDocumentSlots(INITIAL_DOCUMENT_SLOTS)
			setCurrentStep(0)
			setPhotoFile(null)
			setPhotoPreview(null)
			onClose()
		} catch (error: unknown) {
			const errorMessage =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Erro ao criar proprietario'
			toast.error(errorMessage)
		}
	}

	const isSubmitting = createMutation.isPending || isUploading || isUploadingPhoto
	const isLastStep = currentStep === STEPS.length - 1
	const isFirstStep = currentStep === 0
	const progress = ((currentStep + 1) / STEPS.length) * 100
	const currentStepData = STEPS[currentStep]

	const renderCustomHeader = () => (
		<div className={styles.customHeader}>
			{/* Left: Title and Description */}
			<div className={styles.headerLeft}>
				<div className={styles.headerInfo}>
					<h2 className={styles.headerTitle}>Adicionar Proprietario</h2>
					<p className={styles.headerDescription}>{currentStepData.description}</p>
				</div>
			</div>

			{/* Center: Steps */}
			<div className={styles.headerCenter}>
				<div className={styles.stepsContainer}>
					{STEPS.map((step, index) => {
						const isCompleted = index < currentStep
						const isActive = index === currentStep

						return (
							<div key={step.id} className={styles.stepItem}>
								<div className={styles.stepContent}>
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
								</div>
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
						{isUploading ? 'Enviando documentos...' : 'Adicionar'}
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
			title="Adicionar Proprietario"
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
											{photoFile?.name || 'Foto selecionada'}
										</span>
										<span className={styles.photoPreviewSize}>
											{photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
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
										<span className={styles.photoUploadTitle}>Foto de Perfil</span>
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
							<Select
								{...register('documentType')}
								label="Tipo de Documento"
								error={errors.documentType?.message}
								fullWidth
								disabled={isSubmitting}
								required
								options={[
									{ value: 'cpf', label: 'CPF (Pessoa Fisica)' },
									{ value: 'cnpj', label: 'CNPJ (Pessoa Juridica)' },
								]}
							/>
							<Input
								{...register('document', { onChange: handleDocumentChange })}
								label="Documento"
								placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
								error={errors.document?.message}
								fullWidth
								disabled={isSubmitting}
								required
							/>
						</div>
					</div>
				)}

				{/* Step 2: Dados Pessoais (apenas para CPF) */}
				{currentStep === 1 && (
					<div className={styles.formSection}>
						{documentType === 'cpf' ? (
							<>
								<div className={styles.row2Cols}>
									<Input
										{...register('rg')}
										label="RG"
										placeholder="00.000.000-0"
										fullWidth
										disabled={isSubmitting}
									/>
									<Input
										{...register('birthDate')}
										type="date"
										label="Data de Nascimento"
										fullWidth
										disabled={isSubmitting}
									/>
								</div>

								<Input
									{...register('nationality')}
									label="Nacionalidade"
									placeholder="Brasileiro(a)"
									fullWidth
									disabled={isSubmitting}
								/>

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
							</>
						) : (
							<div className={styles.documentsInfo}>
								<Info size={18} className={styles.documentsInfoIcon} />
								<p className={styles.documentsInfoText}>
									Para pessoa juridica (CNPJ), os dados pessoais nao se aplicam. Clique em
									&quot;Proximo&quot; para continuar.
								</p>
							</div>
						)}
					</div>
				)}

				{/* Step 3: Contato */}
				{currentStep === 2 && (
					<div className={styles.formSection}>
						<div className={styles.row2Cols}>
							<Input
								{...register('phone', { onChange: handlePhoneChange })}
								type="tel"
								label="Telefone Principal"
								placeholder="(11) 99999-9999"
								error={errors.phone?.message}
								fullWidth
								disabled={isSubmitting}
								required
							/>
							<Input
								{...register('phoneSecondary', { onChange: handlePhoneSecondaryChange })}
								type="tel"
								label="Telefone Secundario"
								placeholder="(11) 99999-9999"
								fullWidth
								disabled={isSubmitting}
							/>
						</div>

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
				)}

				{/* Step 4: Endereco */}
				{currentStep === 3 && (
					<div className={styles.formSection}>
						<div className={styles.row3Cols}>
							<div className={styles.cepWrapper}>
								<Input
									{...register('zipCode', { onChange: handleCepChange })}
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
								{cepLoading && <span className={styles.cepHint}>Buscando endereco...</span>}
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
								placeholder="Selecione"
								error={errors.state?.message}
								fullWidth
								disabled={isSubmitting}
								options={BRAZILIAN_STATES}
							/>
						</div>

						{cepError && !cepLoading && (
							<div className={styles.cepAlert}>
								<AlertTriangle size={18} className={styles.cepAlertIcon} />
								<div className={styles.cepAlertContent}>
									<p className={styles.cepAlertTitle}>CEP nao encontrado</p>
									<p className={styles.cepAlertText}>Preencha os campos de endereco manualmente.</p>
								</div>
							</div>
						)}

						<Input
							{...register('address')}
							label="Logradouro"
							placeholder="Rua, Avenida, etc."
							error={errors.address?.message}
							fullWidth
							disabled={isSubmitting}
						/>

						<div className={styles.row2Cols}>
							<Input
								{...register('neighborhood')}
								label="Bairro"
								placeholder="Centro"
								fullWidth
								disabled={isSubmitting}
							/>
							<div className={styles.row2ColsInner}>
								<Input
									{...register('addressNumber')}
									label="Numero"
									placeholder="123"
									fullWidth
									disabled={isSubmitting}
								/>
								<Input
									{...register('addressComplement')}
									label="Complemento"
									placeholder="Apto, Bloco, etc."
									fullWidth
									disabled={isSubmitting}
								/>
							</div>
						</div>

						<Textarea
							{...register('notes')}
							label="Observacoes"
							placeholder="Informacoes adicionais sobre o proprietario..."
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

				{/* Step 5: Documentos */}
				{currentStep === 4 && (
					<div className={styles.formSection}>
						<div className={styles.documentsInfo}>
							<Info size={18} className={styles.documentsInfoIcon} />
							<p className={styles.documentsInfoText}>
								Anexe os documentos do proprietario. Todos os campos sao opcionais. Formatos
								aceitos: PDF, JPG, PNG ou WebP (max 10MB).
							</p>
						</div>

						<div className={styles.documentsGrid}>
							{documentSlots.map((slot) => (
								<div
									key={slot.type}
									className={`${styles.documentUploadCard} ${
										slot.file ? styles.documentUploadCardFilled : ''
									}`}
								>
									<div className={styles.documentCardHeader}>
										<h4 className={styles.documentCardTitle}>{slot.label}</h4>
										<span className={styles.documentCardOptional}>Opcional</span>
									</div>

									{slot.file ? (
										<div className={styles.documentFilePreview}>
											{slot.file.preview ? (
												<div
													className={`${styles.documentFileIcon} ${styles.documentFileIconImage}`}
												>
													<img
														src={slot.file.preview}
														alt={slot.file.file.name}
														className={styles.documentFileThumbnail}
													/>
												</div>
											) : (
												<div className={styles.documentFileIcon}>
													<FileText size={18} />
												</div>
											)}
											<div className={styles.documentFileInfo}>
												<p className={styles.documentFileName}>{slot.file.file.name}</p>
												<p className={styles.documentFileSize}>
													{formatFileSize(slot.file.file.size)}
												</p>
											</div>
											<button
												type="button"
												className={styles.documentRemoveButton}
												onClick={() => handleRemoveFile(slot.type)}
												disabled={isSubmitting}
												title="Remover arquivo"
											>
												<Trash2 size={16} />
											</button>
										</div>
									) : (
										<>
											<input
												ref={(el) => {
													fileInputRefs.current[slot.type] = el
												}}
												type="file"
												accept={ALLOWED_TYPES.join(',')}
												style={{ display: 'none' }}
												onChange={(e) => {
													const file = e.target.files?.[0]
													if (file) {
														handleFileSelect(slot.type, file)
													}
													e.target.value = ''
												}}
												disabled={isSubmitting}
											/>
											<button
												type="button"
												className={`${styles.documentDropZone} ${
													draggingSlot === slot.type ? styles.documentDropZoneDragging : ''
												} ${isSubmitting ? styles.documentDropZoneDisabled : ''}`}
												onClick={() => fileInputRefs.current[slot.type]?.click()}
												onDragOver={(e) => {
													e.preventDefault()
													if (!isSubmitting) setDraggingSlot(slot.type)
												}}
												onDragLeave={(e) => {
													e.preventDefault()
													setDraggingSlot(null)
												}}
												onDrop={(e) => {
													e.preventDefault()
													setDraggingSlot(null)
													const file = e.dataTransfer.files?.[0]
													if (file && !isSubmitting) {
														handleFileSelect(slot.type, file)
													}
												}}
												disabled={isSubmitting}
											>
												<Upload size={20} className={styles.documentDropZoneIcon} />
												<span className={styles.documentDropZoneText}>
													Arraste ou clique para enviar
												</span>
											</button>
										</>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</form>
		</Modal>
	)
}
