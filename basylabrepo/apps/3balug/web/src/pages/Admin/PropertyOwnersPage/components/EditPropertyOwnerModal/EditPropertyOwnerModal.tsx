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
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { Textarea } from '@/components/Textarea/Textarea'
import {
	useDeleteDocumentMutation,
	useDocumentsQuery,
	useUploadDocumentMutation,
} from '@/queries/documents/documents.queries'
import { useUpdatePropertyOwnerMutation } from '@/queries/property-owners/useUpdatePropertyOwnerMutation'
import { uploadWithPresignedUrl } from '@/services/files/upload'
import {
	DOCUMENT_ENTITY_TYPES,
	DOCUMENT_FILE_LIMITS,
	DOCUMENT_SIZE_LIMITS,
	DOCUMENT_TYPES,
	type DocumentType,
	getDocumentFileLimit,
	getDocumentSizeLimitLabel,
} from '@/types/document.types'
import {
	BRAZILIAN_STATES,
	MARITAL_STATUS_LABELS,
	type PropertyOwner,
} from '@/types/property-owner.types'
import { applyMask } from '@/utils/masks'
import * as styles from '../CreatePropertyOwnerModal/CreatePropertyOwnerModal.styles.css'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

interface DocumentSlot {
	type: DocumentType
	label: string
	files: SelectedDocument[]
}

interface ExistingDocument {
	id: string
	documentType: DocumentType
	originalName: string
	url: string
	size: number
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

const editPropertyOwnerSchema = z
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

type EditPropertyOwnerFormData = z.infer<typeof editPropertyOwnerSchema>

interface ViaCepResponse {
	cep: string
	logradouro: string
	complemento: string
	bairro: string
	localidade: string
	uf: string
	erro?: boolean
}

interface EditPropertyOwnerModalProps {
	isOpen: boolean
	onClose: () => void
	propertyOwner: PropertyOwner | null
	isLoading?: boolean
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
		description: 'Gerenciar documentos',
		icon: <FileText size={16} />,
	},
]

const INITIAL_DOCUMENT_SLOTS: DocumentSlot[] = [
	{ type: DOCUMENT_TYPES.RG, label: 'RG', files: [] },
	{ type: DOCUMENT_TYPES.CPF, label: 'CPF', files: [] },
	{ type: DOCUMENT_TYPES.COMPROVANTE_RESIDENCIA, label: 'Comprovante de Residencia', files: [] },
	{ type: DOCUMENT_TYPES.OUTROS, label: 'Outros Documentos', files: [] },
]

export function EditPropertyOwnerModal({
	isOpen,
	onClose,
	propertyOwner,
	isLoading = false,
}: EditPropertyOwnerModalProps) {
	const updateMutation = useUpdatePropertyOwnerMutation()
	const uploadDocumentMutation = useUploadDocumentMutation()
	const deleteDocumentMutation = useDeleteDocumentMutation()
	const [currentStep, setCurrentStep] = useState(0)
	const [cepLoading, setCepLoading] = useState(false)
	const [cepError, setCepError] = useState<string | null>(null)
	const [documentSlots, setDocumentSlots] = useState<DocumentSlot[]>(INITIAL_DOCUMENT_SLOTS)
	const [existingDocuments, setExistingDocuments] = useState<ExistingDocument[]>([])
	const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const [draggingSlot, setDraggingSlot] = useState<DocumentType | null>(null)
	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
	const photoInputRef = useRef<HTMLInputElement>(null)
	const [photoFile, setPhotoFile] = useState<File | null>(null)
	const [photoPreview, setPhotoPreview] = useState<string | null>(null)
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
	const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)

	// Query para buscar documentos existentes
	const { data: documentsData } = useDocumentsQuery(
		DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
		propertyOwner?.id || '',
		{
			enabled: isOpen && !!propertyOwner?.id,
		},
	)

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		trigger,
	} = useForm<EditPropertyOwnerFormData>({
		resolver: zodResolver(editPropertyOwnerSchema),
		mode: 'onBlur',
		defaultValues: {
			documentType: 'cpf',
		},
	})

	const documentType = watch('documentType')
	const notesValue = watch('notes') || ''

	// Carregar dados do proprietario quando o modal abrir
	useEffect(() => {
		if (propertyOwner && isOpen) {
			const formattedDocument = applyMask(propertyOwner.document, propertyOwner.documentType)
			const formattedPhone = propertyOwner.phone ? applyMask(propertyOwner.phone, 'phone') : ''
			const formattedPhoneSecondary = propertyOwner.phoneSecondary
				? applyMask(propertyOwner.phoneSecondary, 'phone')
				: ''
			const formattedZipCode = propertyOwner.zipCode ? applyMask(propertyOwner.zipCode, 'cep') : ''

			reset({
				name: propertyOwner.name,
				documentType: propertyOwner.documentType,
				document: formattedDocument,
				rg: propertyOwner.rg || '',
				nationality: propertyOwner.nationality || '',
				maritalStatus: propertyOwner.maritalStatus || undefined,
				profession: propertyOwner.profession || '',
				email: propertyOwner.email || '',
				phone: formattedPhone,
				phoneSecondary: formattedPhoneSecondary,
				zipCode: formattedZipCode,
				address: propertyOwner.address || '',
				addressNumber: propertyOwner.addressNumber || '',
				addressComplement: propertyOwner.addressComplement || '',
				neighborhood: propertyOwner.neighborhood || '',
				city: propertyOwner.city || '',
				state: propertyOwner.state || '',
				birthDate: propertyOwner.birthDate || '',
				notes: propertyOwner.notes || '',
			})

			// Carregar foto existente
			if (propertyOwner.photoUrl) {
				setPhotoPreview(propertyOwner.photoUrl)
			} else {
				setPhotoPreview(null)
			}
			setPhotoFile(null)

			// Reset estado
			setCurrentStep(0)
			setCepError(null)
			setDocumentSlots(INITIAL_DOCUMENT_SLOTS)
			setDocumentsToDelete([])
		}
	}, [propertyOwner, isOpen, reset])

	// Carregar documentos existentes
	useEffect(() => {
		if (documentsData?.data) {
			setExistingDocuments(
				documentsData.data.map((doc) => ({
					id: doc.id,
					documentType: doc.documentType as DocumentType,
					originalName: doc.originalName,
					url: doc.url,
					size: doc.size,
				})),
			)
		}
	}, [documentsData])

	const handleClose = useCallback(() => {
		if (!updateMutation.isPending && !isUploading && !isUploadingPhoto) {
			for (const slot of documentSlots) {
				for (const file of slot.files) {
					if (file.preview) {
						URL.revokeObjectURL(file.preview)
					}
				}
			}
			// Nao revogar photoPreview se for URL existente (nao blob)
			if (photoPreview?.startsWith('blob:')) {
				URL.revokeObjectURL(photoPreview)
			}
			reset()
			setCepError(null)
			setDocumentSlots(INITIAL_DOCUMENT_SLOTS)
			setExistingDocuments([])
			setDocumentsToDelete([])
			setCurrentStep(0)
			setPhotoFile(null)
			setPhotoPreview(null)
			onClose()
		}
	}, [
		updateMutation.isPending,
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

			// Revogar preview anterior apenas se for blob
			if (photoPreview?.startsWith('blob:')) {
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
		if (photoPreview?.startsWith('blob:')) {
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

		const maxSizeForType = DOCUMENT_SIZE_LIMITS[slotType]
		if (file.size > maxSizeForType) {
			toast.error(
				`Arquivo muito grande para este tipo de documento (max ${getDocumentSizeLimitLabel(slotType)})`,
			)
			return
		}

		const maxFilesForType = DOCUMENT_FILE_LIMITS[slotType]

		setDocumentSlots((prev) => {
			const currentSlot = prev.find((s) => s.type === slotType)
			if (currentSlot && currentSlot.files.length >= maxFilesForType) {
				toast.error(
					`Limite de ${maxFilesForType} arquivo${maxFilesForType > 1 ? 's' : ''} atingido para ${currentSlot.label}`,
				)
				return prev
			}

			const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
			const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined

			const newDocument: SelectedDocument = {
				id,
				file,
				documentType: slotType,
				preview,
			}

			return prev.map((slot) =>
				slot.type === slotType ? { ...slot, files: [...slot.files, newDocument] } : slot,
			)
		})
	}, [])

	const handleRemoveFile = useCallback((slotType: DocumentType, fileId: string) => {
		setDocumentSlots((prev) =>
			prev.map((slot) => {
				if (slot.type === slotType) {
					const fileToRemove = slot.files.find((f) => f.id === fileId)
					if (fileToRemove?.preview) {
						URL.revokeObjectURL(fileToRemove.preview)
					}
					return { ...slot, files: slot.files.filter((f) => f.id !== fileId) }
				}
				return slot
			}),
		)
	}, [])

	const handleRemoveExistingDocument = useCallback((docId: string) => {
		setDocumentsToDelete((prev) => [...prev, docId])
		setExistingDocuments((prev) => prev.filter((doc) => doc.id !== docId))
	}, [])

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
				setValue('neighborhood', data.bairro || '')
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

	const handleStepClick = async (stepIndex: number) => {
		if (isSubmitting || isLoading) return

		// Se clicar no step atual, nao faz nada
		if (stepIndex === currentStep) return

		// Se clicar em um step anterior (ja completado), navega diretamente
		if (stepIndex < currentStep) {
			setCurrentStep(stepIndex)
			return
		}

		// Se clicar em um step futuro, valida o step atual antes de avancar
		const isValid = await validateCurrentStep()
		if (isValid) {
			setCurrentStep(stepIndex)
		}
	}

	const onSubmit = async (data: EditPropertyOwnerFormData) => {
		if (!propertyOwner) return

		// Verificar se ha operacoes pendentes
		const hasPhotoToUpload = !!photoFile
		const hasPhotoToRemove = photoPreview === null && !!propertyOwner.photoUrl
		const hasDocumentsToDelete = documentsToDelete.length > 0
		const slotsWithFiles = documentSlots.filter((slot) => slot.files.length > 0)
		const hasDocumentsToUpload = slotsWithFiles.length > 0

		// Ativar loading geral se houver qualquer operacao de arquivo
		if (hasPhotoToUpload || hasDocumentsToDelete || hasDocumentsToUpload) {
			setIsUploading(true)
		}

		try {
			let photoUrl: string | null | undefined

			// Upload da foto se houver nova foto
			if (hasPhotoToUpload) {
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
					setIsUploading(false)
					return
				} finally {
					setIsUploadingPhoto(false)
				}
			} else if (hasPhotoToRemove) {
				// Foto foi removida
				photoUrl = null
			}

			const payload = {
				name: data.name,
				documentType: data.documentType,
				document: data.document.replace(/\D/g, ''),
				phone: data.phone?.replace(/\D/g, '') || null,
				phoneSecondary: data.phoneSecondary?.replace(/\D/g, '') || null,
				zipCode: data.zipCode?.replace(/\D/g, '') || null,
				email: data.email || null,
				rg: data.rg || null,
				nationality: data.nationality || null,
				maritalStatus: data.maritalStatus || null,
				profession: data.profession || null,
				address: data.address || null,
				addressNumber: data.addressNumber || null,
				addressComplement: data.addressComplement || null,
				neighborhood: data.neighborhood || null,
				city: data.city || null,
				state: data.state || null,
				birthDate: data.birthDate || null,
				notes: data.notes || null,
				...(photoUrl !== undefined && { photoUrl }),
			}

			await updateMutation.mutateAsync({
				id: propertyOwner.id,
				input: payload,
			})

			// Deletar documentos marcados para exclusao
			if (hasDocumentsToDelete) {
				try {
					for (const docId of documentsToDelete) {
						await deleteDocumentMutation.mutateAsync({
							documentId: docId,
							entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
							entityId: propertyOwner.id,
						})
					}
				} catch {
					toast.error('Erro ao remover alguns documentos')
				}
			}

			// Upload de novos documentos
			if (hasDocumentsToUpload) {
				try {
					for (const slot of slotsWithFiles) {
						for (const doc of slot.files) {
							await uploadDocumentMutation.mutateAsync({
								entityType: DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
								entityId: propertyOwner.id,
								documentType: doc.documentType,
								file: doc.file,
							})
						}
					}
				} catch {
					toast.error('Proprietario atualizado, mas houve erro ao enviar alguns documentos')
				}
			}

			toast.success('Proprietario atualizado com sucesso!')
			handleClose()
		} catch (error: unknown) {
			const errorMessage =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Erro ao atualizar proprietario'
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
		}
	}

	const isSubmitting = updateMutation.isPending || isUploading || isUploadingPhoto
	const isLastStep = currentStep === STEPS.length - 1
	const isFirstStep = currentStep === 0
	const progress = ((currentStep + 1) / STEPS.length) * 100
	const currentStepData = STEPS[currentStep]

	// Contar documentos existentes por tipo
	const getExistingDocsForType = (type: DocumentType) =>
		existingDocuments.filter((doc) => doc.documentType === type)

	const renderCustomHeader = () => (
		<div className={styles.customHeader}>
			{/* Left: Title and Description */}
			<div className={styles.headerLeft}>
				<div className={styles.headerInfo}>
					<h2 className={styles.headerTitle}>Editar Proprietario</h2>
					<p className={styles.headerDescription}>{currentStepData.description}</p>
				</div>
			</div>

			{/* Center: Steps */}
			<div className={styles.headerCenter}>
				<div className={styles.stepsContainer}>
					{STEPS.map((step, index) => {
						const isCompleted = index < currentStep
						const isActive = index === currentStep
						const isClickable = !isSubmitting && !isLoading

						return (
							<div key={step.id} className={styles.stepItem}>
								<button
									type="button"
									className={`${styles.stepContent} ${isClickable ? styles.stepContentClickable : ''}`}
									onClick={() => handleStepClick(index)}
									disabled={!isClickable}
									title={`Ir para ${step.title}`}
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
					<Button variant="outline" onClick={handleClose} disabled={isSubmitting || isLoading}>
						Cancelar
					</Button>
				) : (
					<Button variant="outline" onClick={handlePrevious} disabled={isSubmitting || isLoading}>
						<ChevronLeft size={18} />
						Anterior
					</Button>
				)}

				{isLastStep ? (
					<Button
						variant="primary"
						onClick={handleSubmit(onSubmit)}
						loading={isSubmitting}
						disabled={isLoading}
					>
						{isUploading ? 'Enviando documentos...' : 'Salvar Alteracoes'}
					</Button>
				) : (
					<Button variant="primary" onClick={handleNext} disabled={isSubmitting || isLoading}>
						Proximo
						<ChevronRight size={18} />
					</Button>
				)}
			</div>
		</div>
	)

	// Skeleton para Step 1 - Identificacao
	const renderStep1Skeleton = () => (
		<div className={styles.formSection}>
			{/* Foto de Perfil Skeleton */}
			<Skeleton width="100%" height="120px" borderRadius="12px" />

			{/* Nome Skeleton */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="120px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>

			{/* Tipo de Documento e Documento */}
			<div className={styles.row2Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="140px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="60px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
			</div>
		</div>
	)

	// Skeleton para Step 2 - Pessoal
	const renderStep2Skeleton = () => (
		<div className={styles.formSection}>
			<div className={styles.row2Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="40px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="140px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="100px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>

			<div className={styles.row2Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="100px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="80px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
			</div>
		</div>
	)

	// Skeleton para Step 3 - Contato
	const renderStep3Skeleton = () => (
		<div className={styles.formSection}>
			<div className={styles.row2Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="140px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="140px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="60px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>
		</div>
	)

	// Skeleton para Step 4 - Endereco
	const renderStep4Skeleton = () => (
		<div className={styles.formSection}>
			<div className={styles.row3Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="40px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="60px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="60px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="100px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>

			<div className={styles.row2Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="60px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div className={styles.row2ColsInner}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<Skeleton width="60px" height="16px" />
						<Skeleton width="100%" height="44px" borderRadius="8px" />
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<Skeleton width="100px" height="16px" />
						<Skeleton width="100%" height="44px" borderRadius="8px" />
					</div>
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="100px" height="16px" />
				<Skeleton width="100%" height="80px" borderRadius="8px" />
			</div>
		</div>
	)

	// Skeleton para Step 5 - Documentos
	const renderStep5Skeleton = () => (
		<div className={styles.formSection}>
			<Skeleton width="100%" height="56px" borderRadius="8px" />

			<div className={styles.documentsGrid}>
				{[1, 2, 3, 4].map((i) => (
					<div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Skeleton width="80px" height="16px" />
							<Skeleton width="100px" height="14px" />
						</div>
						<Skeleton width="100%" height="80px" borderRadius="8px" />
					</div>
				))}
			</div>
		</div>
	)

	const renderSkeletonForCurrentStep = () => {
		switch (currentStep) {
			case 0:
				return renderStep1Skeleton()
			case 1:
				return renderStep2Skeleton()
			case 2:
				return renderStep3Skeleton()
			case 3:
				return renderStep4Skeleton()
			case 4:
				return renderStep5Skeleton()
			default:
				return renderStep1Skeleton()
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Editar Proprietario"
			size="full"
			footer={renderFooter()}
			customHeader={renderCustomHeader()}
		>
			{isLoading ? (
				<div className={styles.form}>{renderSkeletonForCurrentStep()}</div>
			) : (
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
												{photoFile?.name || 'Foto do proprietario'}
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
									label={documentType === 'cpf' ? 'CPF' : 'CNPJ'}
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
										<p className={styles.cepAlertText}>
											Preencha os campos de endereco manualmente.
										</p>
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
									Gerencie os documentos do proprietario. Voce pode adicionar novos documentos ou
									remover os existentes. Formatos aceitos: PDF, JPG, PNG ou WebP.
								</p>
							</div>

							<div className={styles.documentsGrid}>
								{documentSlots.map((slot) => {
									const existingDocsForType = getExistingDocsForType(slot.type)
									const totalFiles = slot.files.length + existingDocsForType.length
									const maxFiles = getDocumentFileLimit(slot.type)
									const canAddMore = totalFiles < maxFiles

									return (
										<div
											key={slot.type}
											className={`${styles.documentUploadCard} ${
												totalFiles > 0 ? styles.documentUploadCardFilled : ''
											}`}
										>
											<div className={styles.documentCardHeader}>
												<h4 className={styles.documentCardTitle}>{slot.label}</h4>
												<span className={styles.documentCardOptional}>
													{totalFiles}/{maxFiles} - Max {getDocumentSizeLimitLabel(slot.type)}
												</span>
											</div>

											{/* Lista de documentos existentes */}
											{existingDocsForType.length > 0 && (
												<div className={styles.documentFilesList}>
													{existingDocsForType.map((doc) => (
														<div key={doc.id} className={styles.documentFilePreview}>
															<div className={styles.documentFileIcon}>
																<FileText size={18} />
															</div>
															<div className={styles.documentFileInfo}>
																<p className={styles.documentFileName}>{doc.originalName}</p>
																<p className={styles.documentFileSize}>
																	{formatFileSize(doc.size)}
																</p>
															</div>
															<button
																type="button"
																className={styles.documentRemoveButton}
																onClick={() => handleRemoveExistingDocument(doc.id)}
																disabled={isSubmitting}
																title="Remover arquivo"
															>
																<Trash2 size={16} />
															</button>
														</div>
													))}
												</div>
											)}

											{/* Lista de novos arquivos */}
											{slot.files.length > 0 && (
												<div className={styles.documentFilesList}>
													{slot.files.map((doc) => (
														<div key={doc.id} className={styles.documentFilePreview}>
															{doc.preview ? (
																<div
																	className={`${styles.documentFileIcon} ${styles.documentFileIconImage}`}
																>
																	<img
																		src={doc.preview}
																		alt={doc.file.name}
																		className={styles.documentFileThumbnail}
																	/>
																</div>
															) : (
																<div className={styles.documentFileIcon}>
																	<FileText size={18} />
																</div>
															)}
															<div className={styles.documentFileInfo}>
																<p className={styles.documentFileName}>{doc.file.name}</p>
																<p className={styles.documentFileSize}>
																	{formatFileSize(doc.file.size)}
																</p>
															</div>
															<button
																type="button"
																className={styles.documentRemoveButton}
																onClick={() => handleRemoveFile(slot.type, doc.id)}
																disabled={isSubmitting}
																title="Remover arquivo"
															>
																<Trash2 size={16} />
															</button>
														</div>
													))}
												</div>
											)}

											{/* Botao para adicionar mais arquivos (se ainda nao atingiu o limite) */}
											{canAddMore && (
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
														} ${isSubmitting ? styles.documentDropZoneDisabled : ''} ${
															totalFiles > 0 ? styles.documentDropZoneCompact : ''
														}`}
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
															{totalFiles > 0 ? 'Adicionar mais' : 'Arraste ou clique para enviar'}
														</span>
													</button>
												</>
											)}
										</div>
									)
								})}
							</div>
						</div>
					)}
				</form>
			)}
		</Modal>
	)
}
