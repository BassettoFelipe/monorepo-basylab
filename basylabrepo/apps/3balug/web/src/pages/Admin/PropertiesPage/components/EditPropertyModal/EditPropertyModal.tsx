import { zodResolver } from '@hookform/resolvers/zod'
import {
	AirVent,
	AlertTriangle,
	Armchair,
	Baby,
	Building2,
	Camera,
	Car,
	Check,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	Dumbbell,
	FileText,
	Flame,
	Flower2,
	Globe,
	Home,
	Image,
	ImagePlus,
	Info,
	Loader2,
	PawPrint,
	Percent,
	Rocket,
	RotateCcw,
	Ruler,
	Shield,
	Sparkles,
	Star,
	Trash2,
	Waves,
	X,
} from 'lucide-react'
import type { ChangeEvent, DragEvent, FocusEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { OwnerSelect } from '@/components/OwnerSelect'
import { ListingTypeSelector, PropertyTypeSelector } from '@/components/PropertyTypeSelector'
import { Select } from '@/components/Select/Select'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { Textarea } from '@/components/Textarea/Textarea'
import { STATUS_OPTIONS_NO_EMPTY } from '@/constants/property.constants'
import { getPropertyStepsForType } from '@/constants/wizard-steps'
import { useCepLookup } from '@/hooks/useCepLookup'
import { useMaskedInput } from '@/hooks/useMaskedInput'
import { useUpdatePropertyMutation } from '@/queries/properties/useUpdatePropertyMutation'
import { usePropertyOwnersQuery } from '@/queries/property-owners/usePropertyOwnersQuery'
import { useBatchRegisterPhotosMutation } from '@/queries/property-photos/useBatchRegisterPhotosMutation'
import { useDeletePropertyPhotoMutation } from '@/queries/property-photos/useDeletePropertyPhotoMutation'
import { useSetPrimaryPhotoMutation } from '@/queries/property-photos/useSetPrimaryPhotoMutation'
import { type EditPropertyFormData, editPropertySchema } from '@/schemas/property.schema'
import { getPresignedUrl, uploadToPresignedUrl } from '@/services/files/presigned-url'
import type { BatchRegisterPhotoItem } from '@/services/property-photos/batch-register'
import type { ListingType, Property, PropertyStatus, PropertyType } from '@/types/property.types'
import { BRAZILIAN_STATES } from '@/types/property-owner.types'
import { applyMask, formatCurrencyToInput, getCurrencyRawValue } from '@/utils/masks'
import * as styles from '../CreatePropertyModal/CreatePropertyModal.styles.css'

// Photo management types
interface ExistingPhoto {
	id: string
	url: string
	isPrimary: boolean
	order: number
	markedForDeletion: boolean
}

interface NewPhoto {
	id: string
	file: File
	preview: string
	isPrimary: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface EditPropertyModalProps {
	isOpen: boolean
	onClose: () => void
	property: Property | null
	isLoading?: boolean
}

export function EditPropertyModal({
	isOpen,
	onClose,
	property,
	isLoading = false,
}: EditPropertyModalProps) {
	const updateMutation = useUpdatePropertyMutation()
	const deletePhotoMutation = useDeletePropertyPhotoMutation()
	const setPrimaryPhotoMutation = useSetPrimaryPhotoMutation()
	const batchRegisterPhotosMutation = useBatchRegisterPhotosMutation()

	const [currentStep, setCurrentStep] = useState(0)
	const [isUploading, setIsUploading] = useState(false)

	// Custom hooks
	const {
		isLoading: cepLoading,
		error: cepError,
		fetchAddress,
		clearError: clearCepError,
	} = useCepLookup()

	// Photo management state
	const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([])
	const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])
	const [primaryPhotoId, setPrimaryPhotoId] = useState<string | null>(null)
	const [isDragging, setIsDragging] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const { data: ownersData, isLoading: isLoadingOwners } = usePropertyOwnersQuery({ limit: 100 })

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		trigger,
	} = useForm<EditPropertyFormData>({
		resolver: zodResolver(editPropertySchema),
		mode: 'onBlur',
	})

	const { createMaskedHandler } = useMaskedInput(setValue)

	const listingType = watch('listingType')
	const propertyType = watch('type')
	const notesValue = watch('notes') || ''
	const selectedOwnerId = watch('ownerId')

	const steps = getPropertyStepsForType(propertyType || 'house')
	const currentStepId = steps[currentStep]?.id
	const currentStepData = steps[currentStep]
	const isLastStep = currentStep === steps.length - 1
	const isFirstStep = currentStep === 0
	const progress = ((currentStep + 1) / steps.length) * 100

	// Calculate total photos count
	const activeExistingPhotos = existingPhotos.filter((p) => !p.markedForDeletion)
	const totalPhotosCount = activeExistingPhotos.length + newPhotos.length
	const maxPhotos = 20
	const canAddMorePhotos = totalPhotosCount < maxPhotos

	// Carregar dados da propriedade quando o modal abrir
	useEffect(() => {
		if (property && isOpen) {
			const commissionPercentageFormatted = property.commissionPercentage
				? `${(property.commissionPercentage / 100).toFixed(2)}%`
				: ''

			reset({
				ownerId: property.ownerId,
				title: property.title,
				description: property.description || '',
				type: property.type,
				listingType: property.listingType,
				status: property.status,
				zipCode: property.zipCode ? applyMask(property.zipCode, 'cep') : '',
				address: property.address || '',
				addressNumber: property.addressNumber || '',
				addressComplement: property.addressComplement || '',
				neighborhood: property.neighborhood || '',
				city: property.city || '',
				state: property.state || '',
				bedrooms: property.bedrooms?.toString() || '',
				bathrooms: property.bathrooms?.toString() || '',
				suites: property.suites?.toString() || '',
				parkingSpaces: property.parkingSpaces?.toString() || '',
				area: property.area?.toString() || '',
				floor: property.floor?.toString() || '',
				totalFloors: property.totalFloors?.toString() || '',
				rentalPrice: property.rentalPrice ? formatCurrencyToInput(property.rentalPrice) : '',
				salePrice: property.salePrice ? formatCurrencyToInput(property.salePrice) : '',
				iptuPrice: property.iptuPrice ? formatCurrencyToInput(property.iptuPrice) : '',
				condoFee: property.condoFee ? formatCurrencyToInput(property.condoFee) : '',
				commissionPercentage: commissionPercentageFormatted,
				isMarketplace: property.isMarketplace || false,
				notes: property.notes || '',
				hasPool: property.features?.hasPool || false,
				hasGarden: property.features?.hasGarden || false,
				hasGarage: property.features?.hasGarage || false,
				hasElevator: property.features?.hasElevator || false,
				hasGym: property.features?.hasGym || false,
				hasPlayground: property.features?.hasPlayground || false,
				hasSecurity: property.features?.hasSecurity || false,
				hasAirConditioning: property.features?.hasAirConditioning || false,
				hasFurnished: property.features?.hasFurnished || false,
				hasPetFriendly: property.features?.hasPetFriendly || false,
				hasBalcony: property.features?.hasBalcony || false,
				hasBarbecue: property.features?.hasBarbecue || false,
			})

			// Initialize photo state
			const existingPhotosList: ExistingPhoto[] = (property.photos || []).map((photo) => ({
				id: photo.id,
				url: photo.url,
				isPrimary: photo.isPrimary,
				order: photo.order,
				markedForDeletion: false,
			}))
			setExistingPhotos(existingPhotosList)
			setNewPhotos([])

			// Find primary photo
			const primary = existingPhotosList.find((p) => p.isPrimary)
			setPrimaryPhotoId(primary?.id || null)

			setCurrentStep(0)
			clearCepError()
		}
	}, [property, isOpen, reset, clearCepError])

	// Photo management handlers
	const handleFiles = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) return

			const availableSlots = maxPhotos - totalPhotosCount
			const filesToAdd = Array.from(files).slice(0, availableSlots)

			const validNewPhotos: NewPhoto[] = []

			for (const file of filesToAdd) {
				if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
					toast.error(`Tipo de arquivo nao permitido: ${file.name}`)
					continue
				}

				if (file.size > MAX_FILE_SIZE) {
					toast.error(`Arquivo muito grande (max 10MB): ${file.name}`)
					continue
				}

				const id = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
				const preview = URL.createObjectURL(file)

				validNewPhotos.push({
					id,
					file,
					preview,
					isPrimary: false,
				})
			}

			if (validNewPhotos.length > 0) {
				setNewPhotos((prev) => {
					const updated = [...prev, ...validNewPhotos]
					// If no primary exists, set first new photo as primary
					if (!primaryPhotoId && activeExistingPhotos.length === 0 && updated.length > 0) {
						updated[0].isPrimary = true
						setPrimaryPhotoId(updated[0].id)
					}
					return updated
				})
			}
		},
		[totalPhotosCount, primaryPhotoId, activeExistingPhotos.length],
	)

	const handleMarkForDeletion = useCallback(
		(photoId: string) => {
			setExistingPhotos((prev) =>
				prev.map((photo) => (photo.id === photoId ? { ...photo, markedForDeletion: true } : photo)),
			)

			// If deleting primary, reassign
			if (photoId === primaryPhotoId) {
				const remaining = existingPhotos.filter((p) => p.id !== photoId && !p.markedForDeletion)
				if (remaining.length > 0) {
					setPrimaryPhotoId(remaining[0].id)
				} else if (newPhotos.length > 0) {
					setPrimaryPhotoId(newPhotos[0].id)
					setNewPhotos((prev) =>
						prev.map((p, i) => (i === 0 ? { ...p, isPrimary: true } : { ...p, isPrimary: false })),
					)
				} else {
					setPrimaryPhotoId(null)
				}
			}
		},
		[primaryPhotoId, existingPhotos, newPhotos],
	)

	const handleRestorePhoto = useCallback((photoId: string) => {
		setExistingPhotos((prev) =>
			prev.map((photo) => (photo.id === photoId ? { ...photo, markedForDeletion: false } : photo)),
		)
	}, [])

	const handleRemoveNewPhoto = useCallback(
		(photoId: string) => {
			const photoToRemove = newPhotos.find((p) => p.id === photoId)
			if (photoToRemove) {
				URL.revokeObjectURL(photoToRemove.preview)
			}

			setNewPhotos((prev) => prev.filter((p) => p.id !== photoId))

			// If removing primary, reassign
			if (photoId === primaryPhotoId) {
				const remainingNew = newPhotos.filter((p) => p.id !== photoId)
				if (remainingNew.length > 0) {
					setPrimaryPhotoId(remainingNew[0].id)
					setNewPhotos((prev) =>
						prev.map((p) =>
							p.id === remainingNew[0].id ? { ...p, isPrimary: true } : { ...p, isPrimary: false },
						),
					)
				} else if (activeExistingPhotos.length > 0) {
					setPrimaryPhotoId(activeExistingPhotos[0].id)
				} else {
					setPrimaryPhotoId(null)
				}
			}
		},
		[newPhotos, primaryPhotoId, activeExistingPhotos],
	)

	const handleSetPrimary = useCallback((photoId: string, isNew: boolean) => {
		setPrimaryPhotoId(photoId)

		if (isNew) {
			setNewPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === photoId })))
		}
	}, [])

	const handleDragOver = useCallback(
		(e: DragEvent) => {
			e.preventDefault()
			if (canAddMorePhotos) {
				setIsDragging(true)
			}
		},
		[canAddMorePhotos],
	)

	const handleDragLeave = useCallback((e: DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
	}, [])

	const handleDrop = useCallback(
		(e: DragEvent) => {
			e.preventDefault()
			setIsDragging(false)
			if (canAddMorePhotos) {
				handleFiles(e.dataTransfer.files)
			}
		},
		[canAddMorePhotos, handleFiles],
	)

	const handleInputChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			handleFiles(e.target.files)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		},
		[handleFiles],
	)

	const handleOwnerChange = useCallback(
		(ownerId: string) => {
			setValue('ownerId', ownerId, { shouldValidate: true })
		},
		[setValue],
	)

	const handlePropertyTypeChange = useCallback(
		(type: PropertyType) => {
			setValue('type', type, { shouldValidate: true })
		},
		[setValue],
	)

	const handleListingTypeChange = useCallback(
		(listingTypeValue: ListingType) => {
			setValue('listingType', listingTypeValue, { shouldValidate: true })
		},
		[setValue],
	)

	const handleCepBlur = async (e: FocusEvent<HTMLInputElement>) => {
		const result = await fetchAddress(e.target.value)
		if (result) {
			setValue('address', result.address)
			setValue('neighborhood', result.neighborhood)
			setValue('city', result.city)
			setValue('state', result.state)
		}
	}

	const validateCurrentStep = async (): Promise<boolean> => {
		switch (currentStepId) {
			case 'owner':
				return await trigger(['ownerId'])
			case 'type':
				return await trigger(['type', 'listingType', 'status'])
			case 'details':
				return await trigger(['title'])
			case 'address':
				return await trigger(['address', 'addressNumber', 'neighborhood', 'city', 'state'])
			case 'pricing':
				if (listingType === 'rent' || listingType === 'both') {
					const isValid = await trigger(['rentalPrice'])
					if (!isValid) return false
				}
				if (listingType === 'sale' || listingType === 'both') {
					const isValid = await trigger(['salePrice'])
					if (!isValid) return false
				}
				return true
			case 'features':
			case 'photos':
			case 'publish':
				return true
			default:
				return true
		}
	}

	const handleNext = async () => {
		const isValid = await validateCurrentStep()
		if (isValid && currentStep < steps.length - 1) {
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

	const onSubmit = async (data: EditPropertyFormData) => {
		if (!property) return

		setIsUploading(true)

		try {
			const features = {
				hasPool: data.hasPool === true,
				hasGarden: data.hasGarden === true,
				hasGarage: data.hasGarage === true,
				hasElevator: data.hasElevator === true,
				hasGym: data.hasGym === true,
				hasPlayground: data.hasPlayground === true,
				hasSecurity: data.hasSecurity === true,
				hasAirConditioning: data.hasAirConditioning === true,
				hasFurnished: data.hasFurnished === true,
				hasPetFriendly: data.hasPetFriendly === true,
				hasBalcony: data.hasBalcony === true,
				hasBarbecue: data.hasBarbecue === true,
			}

			const commissionPercentageRaw = data.commissionPercentage
				? Number.parseInt(data.commissionPercentage.replace(/\D/g, ''), 10)
				: null

			const payload = {
				ownerId: data.ownerId,
				title: data.title,
				description: data.description || null,
				type: data.type as PropertyType,
				listingType: data.listingType as ListingType,
				status: data.status as PropertyStatus,
				zipCode: data.zipCode?.replace(/\D/g, '') || null,
				address: data.address || null,
				addressNumber: data.addressNumber || null,
				addressComplement: data.addressComplement || null,
				neighborhood: data.neighborhood || null,
				city: data.city || null,
				state: data.state || null,
				bedrooms: data.bedrooms ? Number.parseInt(data.bedrooms, 10) : undefined,
				bathrooms: data.bathrooms ? Number.parseInt(data.bathrooms, 10) : undefined,
				suites: data.suites ? Number.parseInt(data.suites, 10) : undefined,
				parkingSpaces: data.parkingSpaces ? Number.parseInt(data.parkingSpaces, 10) : undefined,
				area: data.area ? Number.parseInt(data.area, 10) : null,
				floor: data.floor ? Number.parseInt(data.floor, 10) : null,
				totalFloors: data.totalFloors ? Number.parseInt(data.totalFloors, 10) : null,
				rentalPrice: getCurrencyRawValue(data.rentalPrice || '') || null,
				salePrice: getCurrencyRawValue(data.salePrice || '') || null,
				iptuPrice: getCurrencyRawValue(data.iptuPrice || '') || null,
				condoFee: getCurrencyRawValue(data.condoFee || '') || null,
				commissionPercentage: commissionPercentageRaw,
				isMarketplace: data.isMarketplace ?? false,
				notes: data.notes || null,
				features,
			}

			// 1. Update property data
			await updateMutation.mutateAsync({
				id: property.id,
				input: payload,
			})

			// 2. Delete photos marked for deletion
			const photosToDelete = existingPhotos.filter((p) => p.markedForDeletion)
			for (const photo of photosToDelete) {
				try {
					await deletePhotoMutation.mutateAsync({
						propertyId: property.id,
						photoId: photo.id,
					})
				} catch {
					toast.error('Erro ao remover foto')
				}
			}

			// 3. Upload new photos
			if (newPhotos.length > 0) {
				try {
					// Get presigned URLs for all new photos
					const presignedUrlPromises = newPhotos.map((photo) =>
						getPresignedUrl({
							fileName: photo.file.name,
							contentType: photo.file.type,
							fieldId: `property-${property.id}`,
							allowedTypes: ['image/*'],
						}),
					)
					const presignedUrls = await Promise.all(presignedUrlPromises)

					// Upload all files directly to storage
					const uploadPromises = newPhotos.map((photo, index) =>
						uploadToPresignedUrl(presignedUrls[index].data.uploadUrl, photo.file),
					)
					await Promise.all(uploadPromises)

					// Register all photos in the database
					const photosToRegister: BatchRegisterPhotoItem[] = newPhotos.map((photo, index) => ({
						key: presignedUrls[index].data.key,
						originalName: photo.file.name,
						mimeType: photo.file.type,
						size: photo.file.size,
						url: presignedUrls[index].data.publicUrl,
						isPrimary: photo.id === primaryPhotoId,
					}))

					await batchRegisterPhotosMutation.mutateAsync({
						propertyId: property.id,
						photos: photosToRegister,
					})
				} catch {
					toast.error('Erro ao enviar algumas fotos')
				}
			}

			// 4. Update primary photo if it's an existing photo that changed
			const originalPrimaryPhoto = property.photos?.find((p) => p.isPrimary)
			const existingPrimaryChanged =
				primaryPhotoId &&
				!primaryPhotoId.startsWith('new-') &&
				originalPrimaryPhoto?.id !== primaryPhotoId

			if (existingPrimaryChanged) {
				try {
					await setPrimaryPhotoMutation.mutateAsync({
						propertyId: property.id,
						photoId: primaryPhotoId,
					})
				} catch {
					toast.error('Erro ao definir foto principal')
				}
			}

			toast.success('Imovel atualizado com sucesso!')
			handleClose()
		} catch (error: unknown) {
			const errorMessage =
				error &&
				typeof error === 'object' &&
				'response' in error &&
				error.response &&
				typeof error.response === 'object' &&
				'data' in error.response &&
				error.response.data &&
				typeof error.response.data === 'object' &&
				'message' in error.response.data
					? String(error.response.data.message)
					: 'Erro ao atualizar imovel'
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
		}
	}

	const handleClose = useCallback(() => {
		if (!updateMutation.isPending && !isUploading) {
			// Cleanup new photo previews
			for (const photo of newPhotos) {
				URL.revokeObjectURL(photo.preview)
			}
			reset()
			clearCepError()
			setCurrentStep(0)
			setExistingPhotos([])
			setNewPhotos([])
			setPrimaryPhotoId(null)
			onClose()
		}
	}, [updateMutation.isPending, isUploading, newPhotos, reset, clearCepError, onClose])

	const isSubmitting = updateMutation.isPending || isUploading

	// Skeleton renderers
	const renderStep1Skeleton = () => (
		<div className={styles.formSection}>
			<Skeleton width="100%" height="56px" borderRadius="8px" />
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="120px" height="16px" />
				<Skeleton width="100%" height="80px" borderRadius="8px" />
			</div>
		</div>
	)

	const renderStep2Skeleton = () => (
		<div className={styles.formSection}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="140px" height="16px" />
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
					{[1, 2, 3, 4, 5].map((i) => (
						<Skeleton key={i} width="100%" height="100px" borderRadius="12px" />
					))}
				</div>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="100px" height="16px" />
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} width="100%" height="80px" borderRadius="12px" />
					))}
				</div>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="60px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>
		</div>
	)

	const renderStep3Skeleton = () => (
		<div className={styles.formSection}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="140px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="80px" height="16px" />
				<Skeleton width="100%" height="100px" borderRadius="8px" />
			</div>
			<div className={styles.row4Cols}>
				{[1, 2, 3, 4].map((i) => (
					<div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<Skeleton width="60px" height="16px" />
						<Skeleton width="100%" height="44px" borderRadius="8px" />
					</div>
				))}
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="80px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>
		</div>
	)

	const renderStep4Skeleton = () => (
		<div className={styles.formSection}>
			<div className={styles.row3Cols}>
				{[1, 2, 3].map((i) => (
					<div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						<Skeleton width="60px" height="16px" />
						<Skeleton width="100%" height="44px" borderRadius="8px" />
					</div>
				))}
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
		</div>
	)

	const renderStep5Skeleton = () => (
		<div className={styles.formSection}>
			<Skeleton width="100%" height="56px" borderRadius="8px" />
			<div className={styles.row2Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="120px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="100px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
			</div>
			<div className={styles.row2Cols}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="100px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					<Skeleton width="100px" height="16px" />
					<Skeleton width="100%" height="44px" borderRadius="8px" />
				</div>
			</div>
			<Skeleton width="100%" height="56px" borderRadius="8px" />
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="160px" height="16px" />
				<Skeleton width="100%" height="44px" borderRadius="8px" />
			</div>
		</div>
	)

	const renderStep6Skeleton = () => (
		<div className={styles.formSection}>
			<div className={styles.featuresGrid}>
				{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
					<Skeleton key={i} width="100%" height="120px" borderRadius="12px" />
				))}
			</div>
		</div>
	)

	const renderStep7Skeleton = () => (
		<div className={styles.formSection}>
			<Skeleton width="100%" height="56px" borderRadius="8px" />
			<Skeleton width="100%" height="48px" borderRadius="8px" />
			<Skeleton width="100%" height="120px" borderRadius="12px" />
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} width="100%" height="120px" borderRadius="8px" />
				))}
			</div>
		</div>
	)

	const renderStep8Skeleton = () => (
		<div className={styles.formSection}>
			<Skeleton width="100%" height="56px" borderRadius="8px" />
			<Skeleton width="100%" height="80px" borderRadius="8px" />
			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Skeleton width="160px" height="16px" />
				<Skeleton width="100%" height="80px" borderRadius="8px" />
			</div>
			<Skeleton width="100%" height="120px" borderRadius="8px" />
		</div>
	)

	const renderSkeletonForCurrentStep = () => {
		switch (currentStepId) {
			case 'owner':
				return renderStep1Skeleton()
			case 'type':
				return renderStep2Skeleton()
			case 'details':
				return renderStep3Skeleton()
			case 'address':
				return renderStep4Skeleton()
			case 'pricing':
				return renderStep5Skeleton()
			case 'features':
				return renderStep6Skeleton()
			case 'photos':
				return renderStep7Skeleton()
			case 'publish':
				return renderStep8Skeleton()
			default:
				return renderStep1Skeleton()
		}
	}

	const renderCustomHeader = () => (
		<div className={styles.customHeader}>
			{/* Left: Title and Description */}
			<div className={styles.headerLeft}>
				<div className={styles.headerInfo}>
					<h2 className={styles.headerTitle}>
						Editar Imovel {property?.code ? `(${property.code})` : ''}
					</h2>
					<p className={styles.headerDescription}>{currentStepData?.description}</p>
				</div>
			</div>

			{/* Center: Steps */}
			<div className={styles.headerCenter}>
				{/* Full step indicators (hidden on mobile) */}
				<div className={styles.stepsContainer}>
					{steps.map((step, index) => {
						const isCompleted = index < currentStep
						const isActive = index === currentStep
						const isClickable = !isSubmitting && !isLoading

						return (
							<div key={step.id} className={styles.stepItem}>
								{index > 0 && (
									<div
										className={`${styles.stepConnector} ${
											isCompleted ? styles.stepConnectorCompleted : ''
										}`}
									/>
								)}
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
										{isCompleted ? <Check size={16} /> : step.icon}
									</div>
									<span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
										{step.title}
									</span>
								</button>
							</div>
						)
					})}
				</div>

				{/* Mobile dot indicators (shown only on small screens) */}
				<div className={styles.mobileStepIndicator}>
					{steps.map((step, index) => {
						const isCompleted = index < currentStep
						const isActive = index === currentStep
						const isClickable = !isSubmitting && !isLoading

						return (
							<button
								type="button"
								key={step.id}
								className={`${styles.mobileStepDot} ${
									isActive
										? styles.mobileStepDotActive
										: isCompleted
											? styles.mobileStepDotCompleted
											: ''
								}`}
								onClick={() => handleStepClick(index)}
								disabled={!isClickable}
								title={`Ir para ${step.title}`}
							/>
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
					Passo {currentStep + 1} de {steps.length}
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
						{isUploading ? 'Salvando...' : 'Salvar Alteracoes'}
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

	if (!property && !isLoading) return null

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Editar Imovel"
			size="full"
			footer={renderFooter()}
			customHeader={renderCustomHeader()}
		>
			{isLoading ? (
				<div className={styles.form}>{renderSkeletonForCurrentStep()}</div>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
					{/* Step: Proprietario */}
					{currentStepId === 'owner' && (
						<div className={styles.formSection}>
							<div className={styles.infoBox}>
								<Info size={18} className={styles.infoBoxIcon} />
								<p className={styles.infoBoxText}>
									Altere o proprietario do imovel se necessario. Caso o proprietario ainda nao
									esteja cadastrado, voce pode adiciona-lo na pagina de Proprietarios.
								</p>
							</div>

							<OwnerSelect
								owners={ownersData?.data || []}
								value={selectedOwnerId || ''}
								onChange={handleOwnerChange}
								label="Proprietario"
								error={errors.ownerId?.message}
								required
								disabled={isSubmitting}
								isLoading={isLoadingOwners}
							/>
						</div>
					)}

					{/* Step: Tipo do Imovel */}
					{currentStepId === 'type' && (
						<div className={styles.formSection}>
							<PropertyTypeSelector
								value={propertyType}
								onChange={handlePropertyTypeChange}
								error={errors.type?.message}
								required
								disabled={isSubmitting}
							/>

							<ListingTypeSelector
								value={listingType}
								onChange={handleListingTypeChange}
								error={errors.listingType?.message}
								required
								disabled={isSubmitting}
							/>

							<Select
								{...register('status')}
								label="Status do Imovel"
								error={errors.status?.message}
								options={STATUS_OPTIONS_NO_EMPTY}
								fullWidth
								required
								disabled={isSubmitting}
							/>
						</div>
					)}

					{/* Step: Detalhes */}
					{currentStepId === 'details' && (
						<div className={styles.formSection}>
							<Input
								{...register('title')}
								label="Titulo do Anuncio"
								placeholder="Ex: Casa 3 quartos no Centro"
								error={errors.title?.message}
								fullWidth
								required
								disabled={isSubmitting}
							/>

							<Textarea
								{...register('description')}
								label="Descricao"
								placeholder="Descreva o imovel em detalhes..."
								error={errors.description?.message}
								rows={4}
								showCharCount
								maxLength={5000}
								disabled={isSubmitting}
							/>

							{propertyType !== 'land' && (
								<>
									<div className={styles.row4Cols}>
										<Input
											{...register('bedrooms')}
											type="number"
											label="Quartos"
											placeholder="0"
											min="0"
											error={errors.bedrooms?.message}
											fullWidth
											disabled={isSubmitting}
										/>
										<Input
											{...register('suites')}
											type="number"
											label="Suites"
											placeholder="0"
											min="0"
											error={errors.suites?.message}
											fullWidth
											disabled={isSubmitting}
										/>
										<Input
											{...register('bathrooms')}
											type="number"
											label="Banheiros"
											placeholder="0"
											min="0"
											error={errors.bathrooms?.message}
											fullWidth
											disabled={isSubmitting}
										/>
										<Input
											{...register('parkingSpaces')}
											type="number"
											label="Vagas"
											placeholder="0"
											min="0"
											error={errors.parkingSpaces?.message}
											fullWidth
											disabled={isSubmitting}
										/>
									</div>

									{propertyType === 'apartment' && (
										<div className={styles.row2Cols}>
											<Input
												{...register('floor')}
												type="number"
												label="Andar"
												placeholder="0"
												min="0"
												error={errors.floor?.message}
												fullWidth
												disabled={isSubmitting}
											/>
											<Input
												{...register('totalFloors')}
												type="number"
												label="Total de Andares"
												placeholder="0"
												min="0"
												error={errors.totalFloors?.message}
												fullWidth
												disabled={isSubmitting}
											/>
										</div>
									)}
								</>
							)}

							<Input
								{...register('area')}
								type="number"
								label="Area (m²)"
								placeholder="0"
								min="0"
								error={errors.area?.message}
								fullWidth
								disabled={isSubmitting}
								leftIcon={<Ruler size={18} />}
							/>
						</div>
					)}

					{/* Step: Endereco */}
					{currentStepId === 'address' && (
						<div className={styles.formSection}>
							<div className={styles.row3Cols}>
								<div className={styles.cepWrapper}>
									<Input
										{...register('zipCode')}
										label="CEP"
										placeholder="00000-000"
										error={errors.zipCode?.message}
										fullWidth
										disabled={isSubmitting || cepLoading}
										onChange={createMaskedHandler('zipCode', 'cep')}
										onBlur={handleCepBlur}
										maxLength={9}
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
									required
									disabled={isSubmitting}
								/>
								<Select
									{...register('state')}
									label="Estado"
									placeholder="Selecione"
									error={errors.state?.message}
									fullWidth
									required
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
								required
								disabled={isSubmitting}
							/>

							<div className={styles.row2Cols}>
								<Input
									{...register('neighborhood')}
									label="Bairro"
									placeholder="Centro"
									error={errors.neighborhood?.message}
									fullWidth
									required
									disabled={isSubmitting}
								/>
								<div className={styles.row2ColsInner}>
									<Input
										{...register('addressNumber')}
										label="Numero"
										placeholder="123"
										error={errors.addressNumber?.message}
										fullWidth
										required
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
						</div>
					)}

					{/* Step: Valores e Comissao */}
					{currentStepId === 'pricing' && (
						<div className={styles.formSection}>
							<div className={styles.sectionHeader}>
								<DollarSign size={20} className={styles.sectionHeaderIcon} />
								<div>
									<h3 className={styles.sectionHeaderTitle}>Valores do Imovel</h3>
									<p className={styles.sectionHeaderDescription}>Defina os precos e taxas</p>
								</div>
							</div>

							<div className={styles.row2Cols}>
								{(listingType === 'rent' || listingType === 'both') && (
									<Input
										{...register('rentalPrice')}
										label="Valor do Aluguel"
										placeholder="R$ 0,00"
										error={errors.rentalPrice?.message}
										onChange={createMaskedHandler('rentalPrice', 'currency')}
										fullWidth
										required
										disabled={isSubmitting}
										leftIcon={<DollarSign size={18} />}
									/>
								)}
								{(listingType === 'sale' || listingType === 'both') && (
									<Input
										{...register('salePrice')}
										label="Valor de Venda"
										placeholder="R$ 0,00"
										error={errors.salePrice?.message}
										onChange={createMaskedHandler('salePrice', 'currency')}
										fullWidth
										required
										disabled={isSubmitting}
										leftIcon={<DollarSign size={18} />}
									/>
								)}
							</div>

							<div className={styles.row2Cols}>
								<Input
									{...register('iptuPrice')}
									label="IPTU (mensal)"
									placeholder="R$ 0,00"
									error={errors.iptuPrice?.message}
									onChange={createMaskedHandler('iptuPrice', 'currency')}
									fullWidth
									disabled={isSubmitting}
									leftIcon={<FileText size={18} />}
								/>
								<Input
									{...register('condoFee')}
									label="Condominio"
									placeholder="R$ 0,00"
									error={errors.condoFee?.message}
									onChange={createMaskedHandler('condoFee', 'currency')}
									fullWidth
									disabled={isSubmitting}
									leftIcon={<Building2 size={18} />}
								/>
							</div>

							<div className={styles.sectionHeader}>
								<Percent size={20} className={styles.sectionHeaderIcon} />
								<div>
									<h3 className={styles.sectionHeaderTitle}>Comissao</h3>
									<p className={styles.sectionHeaderDescription}>
										Percentual sobre o valor do negocio
									</p>
								</div>
							</div>

							<Input
								{...register('commissionPercentage')}
								label="Percentual de Comissao"
								placeholder="5.00%"
								error={errors.commissionPercentage?.message}
								onChange={createMaskedHandler('commissionPercentage', 'percentage')}
								fullWidth
								disabled={isSubmitting}
								leftIcon={<Percent size={18} />}
							/>

							<div className={styles.infoBox}>
								<Info size={18} className={styles.infoBoxIcon} />
								<p className={styles.infoBoxText}>
									O percentual de comissao sera aplicado sobre o valor total do negocio (aluguel ou
									venda).
								</p>
							</div>
						</div>
					)}

					{/* Step: Comodidades */}
					{currentStepId === 'features' && (
						<div className={styles.formSection}>
							<div className={styles.featuresGrid}>
								<label
									className={`${styles.featureCheckbox} ${watch('hasPool') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasPool')}
										disabled={isSubmitting}
									/>
									<Waves size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Piscina</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasGarden') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasGarden')}
										disabled={isSubmitting}
									/>
									<Flower2 size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Jardim</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasGarage') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasGarage')}
										disabled={isSubmitting}
									/>
									<Car size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Garagem</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasElevator') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasElevator')}
										disabled={isSubmitting}
									/>
									<Building2 size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Elevador</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasGym') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasGym')}
										disabled={isSubmitting}
									/>
									<Dumbbell size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Academia</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasPlayground') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasPlayground')}
										disabled={isSubmitting}
									/>
									<Baby size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Playground</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasSecurity') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasSecurity')}
										disabled={isSubmitting}
									/>
									<Shield size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Seguranca 24h</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasAirConditioning') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasAirConditioning')}
										disabled={isSubmitting}
									/>
									<AirVent size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Ar Condicionado</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasFurnished') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasFurnished')}
										disabled={isSubmitting}
									/>
									<Armchair size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Mobiliado</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasPetFriendly') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasPetFriendly')}
										disabled={isSubmitting}
									/>
									<PawPrint size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Aceita Pets</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasBalcony') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasBalcony')}
										disabled={isSubmitting}
									/>
									<Home size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Varanda</span>
								</label>
								<label
									className={`${styles.featureCheckbox} ${watch('hasBarbecue') ? styles.featureCheckboxChecked : ''}`}
								>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasBarbecue')}
										disabled={isSubmitting}
									/>
									<Flame size={28} className={styles.featureIcon} />
									<span className={styles.featureLabel}>Churrasqueira</span>
								</label>
							</div>
						</div>
					)}

					{/* Step: Fotos */}
					{currentStepId === 'photos' && property && (
						<div className={styles.formSection}>
							<div className={styles.photosHeader}>
								<div className={styles.photosHeaderContent}>
									<div className={styles.photosHeaderIcon}>
										<Image size={18} />
									</div>
									<div className={styles.photosHeaderText}>
										<h3 className={styles.photosHeaderTitle}>Galeria de Fotos</h3>
										<p className={styles.photosHeaderDescription}>
											Gerencie as fotos do imovel. As alteracoes serao salvas ao clicar em "Salvar
											Alteracoes".
										</p>
									</div>
								</div>
								<div className={styles.photosCounter}>
									<Camera size={12} />
									<span>
										{totalPhotosCount}/{maxPhotos}
									</span>
								</div>
							</div>

							<div className={styles.photosTips}>
								<div className={styles.photosTipItem}>
									<CheckCircle2 size={12} className={styles.photosTipIcon} />
									<span>Clique na estrela para definir a foto principal</span>
								</div>
								<div className={styles.photosTipItem}>
									<CheckCircle2 size={12} className={styles.photosTipIcon} />
									<span>Fotos removidas podem ser restauradas</span>
								</div>
							</div>

							{/* Drop zone for new photos */}
							{canAddMorePhotos && (
								<button
									type="button"
									className={`${styles.photoDropzone} ${isDragging ? styles.photoDropzoneDragging : ''} ${isSubmitting ? styles.photoDropzoneDisabled : ''}`}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									onClick={() => fileInputRef.current?.click()}
									disabled={isSubmitting}
								>
									<input
										ref={fileInputRef}
										type="file"
										style={{ display: 'none' }}
										onChange={handleInputChange}
										accept={ALLOWED_PHOTO_TYPES.join(',')}
										multiple
										disabled={isSubmitting}
									/>
									<div className={styles.photoDropzoneIcon}>
										<ImagePlus size={28} />
									</div>
									<p className={styles.photoDropzoneTitle}>
										Arraste fotos aqui ou clique para selecionar
									</p>
									<p className={styles.photoDropzoneSubtitle}>
										JPG, PNG, WebP ou GIF - Max 10MB por foto
									</p>
								</button>
							)}

							{/* Photos grid */}
							{(activeExistingPhotos.length > 0 ||
								newPhotos.length > 0 ||
								existingPhotos.some((p) => p.markedForDeletion)) && (
								<div className={styles.photosGrid}>
									{/* Existing photos (not marked for deletion) */}
									{existingPhotos
										.filter((p) => !p.markedForDeletion)
										.sort((a, b) => a.order - b.order)
										.map((photo) => (
											<div
												key={photo.id}
												className={`${styles.photoCard} ${photo.id === primaryPhotoId ? styles.photoCardPrimary : ''}`}
											>
												<img src={photo.url} alt="Foto do imovel" className={styles.photoImage} />
												{photo.id === primaryPhotoId && (
													<div className={`${styles.photoBadge} ${styles.photoBadgePrimary}`}>
														<Star size={10} />
														Principal
													</div>
												)}
												<div className={styles.photoOverlay}>
													<div className={styles.photoActions}>
														{photo.id !== primaryPhotoId && (
															<button
																type="button"
																className={styles.photoActionButton}
																onClick={() => handleSetPrimary(photo.id, false)}
																disabled={isSubmitting}
																title="Definir como principal"
															>
																<Star size={14} />
															</button>
														)}
														<button
															type="button"
															className={`${styles.photoActionButton} ${styles.photoActionButtonDanger}`}
															onClick={() => handleMarkForDeletion(photo.id)}
															disabled={isSubmitting}
															title="Remover foto"
														>
															<Trash2 size={14} />
														</button>
													</div>
												</div>
											</div>
										))}

									{/* New photos */}
									{newPhotos.map((photo) => (
										<div
											key={photo.id}
											className={`${styles.photoCard} ${photo.id === primaryPhotoId ? styles.photoCardPrimary : ''}`}
										>
											<img src={photo.preview} alt="Nova foto" className={styles.photoImage} />
											{photo.id === primaryPhotoId && (
												<div className={`${styles.photoBadge} ${styles.photoBadgePrimary}`}>
													<Star size={10} />
													Principal
												</div>
											)}
											<div className={`${styles.photoBadge} ${styles.photoBadgeNew}`}>Nova</div>
											<div className={styles.photoOverlay}>
												<div className={styles.photoActions}>
													{photo.id !== primaryPhotoId && (
														<button
															type="button"
															className={styles.photoActionButton}
															onClick={() => handleSetPrimary(photo.id, true)}
															disabled={isSubmitting}
															title="Definir como principal"
														>
															<Star size={14} />
														</button>
													)}
													<button
														type="button"
														className={`${styles.photoActionButton} ${styles.photoActionButtonDanger}`}
														onClick={() => handleRemoveNewPhoto(photo.id)}
														disabled={isSubmitting}
														title="Remover foto"
													>
														<Trash2 size={14} />
													</button>
												</div>
											</div>
										</div>
									))}

									{/* Deleted photos (with restore option) */}
									{existingPhotos
										.filter((p) => p.markedForDeletion)
										.map((photo) => (
											<div
												key={photo.id}
												className={`${styles.photoCard} ${styles.photoCardDeleted}`}
											>
												<img src={photo.url} alt="Foto removida" className={styles.photoImage} />
												<div className={`${styles.photoBadge} ${styles.photoBadgeDeleted}`}>
													<Trash2 size={10} />
													Removida
												</div>
												<div className={styles.photoOverlay}>
													<div className={styles.photoActions}>
														<button
															type="button"
															className={`${styles.photoActionButton} ${styles.photoActionButtonSuccess}`}
															onClick={() => handleRestorePhoto(photo.id)}
															disabled={isSubmitting}
															title="Restaurar foto"
														>
															<RotateCcw size={14} />
														</button>
													</div>
												</div>
											</div>
										))}
								</div>
							)}
						</div>
					)}

					{/* Step: Publicacao */}
					{currentStepId === 'publish' && (
						<div className={styles.formSection}>
							<div className={styles.publishHeader}>
								<Rocket size={18} className={styles.publishHeaderIcon} />
								<div>
									<h3 className={styles.publishHeaderTitle}>Publicacao</h3>
									<p className={styles.publishHeaderDescription}>
										Configure a visibilidade do imovel
									</p>
								</div>
							</div>

							<div className={styles.visibilityCard}>
								<div className={styles.visibilityOption}>
									<div className={styles.visibilityOptionIcon}>
										<Globe size={18} />
									</div>
									<div className={styles.visibilityOptionContent}>
										<h4 className={styles.visibilityOptionTitle}>Marketplace</h4>
										<p className={styles.visibilityOptionDescription}>
											Exibir este imovel no marketplace publico
										</p>
									</div>
									<label className={styles.marketplaceToggle}>
										<input
											type="checkbox"
											className={styles.toggleInput}
											{...register('isMarketplace')}
											disabled={isSubmitting}
										/>
										<span className={styles.toggleSlider} />
									</label>
								</div>
							</div>

							<div className={styles.notesSection}>
								<div className={styles.notesSectionHeader}>
									<FileText size={14} />
									<span>Observacoes Internas</span>
								</div>
								<Textarea
									{...register('notes')}
									placeholder="Anotacoes internas (nao exibidas publicamente)..."
									error={errors.notes?.message}
									rows={2}
									showCharCount
									maxLength={2000}
									value={notesValue}
									disabled={isSubmitting}
								/>
							</div>

							<div className={styles.summaryCard}>
								<div className={styles.summaryHeader}>
									<Sparkles size={14} className={styles.summaryHeaderIcon} />
									<h3 className={styles.summaryTitle}>Resumo</h3>
								</div>
								<div className={styles.summaryGrid}>
									<div className={styles.summaryItem}>
										<div className={styles.summaryItemIcon}>
											<Home size={14} />
										</div>
										<div className={styles.summaryItemContent}>
											<span className={styles.summaryLabel}>Tipo</span>
											<span className={styles.summaryValue}>
												{
													{
														house: 'Casa',
														apartment: 'Apartamento',
														land: 'Terreno',
														commercial: 'Comercial',
														rural: 'Rural',
													}[propertyType || 'house']
												}
											</span>
										</div>
									</div>
									<div className={styles.summaryItem}>
										<div className={styles.summaryItemIcon}>
											<DollarSign size={14} />
										</div>
										<div className={styles.summaryItemContent}>
											<span className={styles.summaryLabel}>Finalidade</span>
											<span className={styles.summaryValue}>
												{
													{
														rent: 'Locacao',
														sale: 'Venda',
														both: 'Ambos',
													}[listingType || 'rent']
												}
											</span>
										</div>
									</div>
									<div className={styles.summaryItem}>
										<div className={styles.summaryItemIcon}>
											<Camera size={14} />
										</div>
										<div className={styles.summaryItemContent}>
											<span className={styles.summaryLabel}>Fotos</span>
											<span className={styles.summaryValue}>
												{totalPhotosCount === 0 ? 'Nenhuma' : `${totalPhotosCount} foto(s)`}
												{newPhotos.length > 0 && ` (+${newPhotos.length} nova(s))`}
												{existingPhotos.filter((p) => p.markedForDeletion).length > 0 &&
													` (-${existingPhotos.filter((p) => p.markedForDeletion).length} removida(s))`}
											</span>
										</div>
									</div>
									<div className={styles.summaryItem}>
										<div className={styles.summaryItemIcon}>
											<Globe size={14} />
										</div>
										<div className={styles.summaryItemContent}>
											<span className={styles.summaryLabel}>Visibilidade</span>
											<span className={styles.summaryValue}>
												{watch('isMarketplace') ? 'Publico' : 'Interno'}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</form>
			)}
		</Modal>
	)
}
