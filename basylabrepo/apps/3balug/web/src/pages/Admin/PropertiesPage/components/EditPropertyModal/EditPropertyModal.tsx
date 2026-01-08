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
	Info,
	Loader2,
	MapPin,
	PawPrint,
	Percent,
	Rocket,
	Ruler,
	Settings,
	Shield,
	Sparkles,
	User,
	Waves,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { OwnerSelect } from '@/components/OwnerSelect'
import { PropertyPhotoUpload } from '@/components/PropertyPhotoUpload/PropertyPhotoUpload'
import { ListingTypeSelector, PropertyTypeSelector } from '@/components/PropertyTypeSelector'
import { Select } from '@/components/Select/Select'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { Textarea } from '@/components/Textarea/Textarea'
import { useUpdatePropertyMutation } from '@/queries/properties/useUpdatePropertyMutation'
import { usePropertyOwnersQuery } from '@/queries/property-owners/usePropertyOwnersQuery'
import type { ListingType, Property, PropertyStatus, PropertyType } from '@/types/property.types'
import { BRAZILIAN_STATES } from '@/types/property-owner.types'
import { applyMask, formatCurrencyToInput, getCurrencyRawValue } from '@/utils/masks'
import * as styles from '../CreatePropertyModal/CreatePropertyModal.styles.css'

interface ViaCepResponse {
	cep: string
	logradouro: string
	complemento: string
	bairro: string
	localidade: string
	uf: string
	erro?: boolean
}

const editPropertySchema = z
	.object({
		// Step 1: Proprietario
		ownerId: z.string().min(1, 'Proprietario e obrigatorio'),

		// Step 2: Tipo do Imovel
		type: z.enum(['house', 'apartment', 'land', 'commercial', 'rural'], {
			message: 'Selecione o tipo do imovel',
		}),
		listingType: z.enum(['rent', 'sale', 'both'], {
			message: 'Selecione a finalidade',
		}),
		status: z.enum(['available', 'rented', 'sold', 'maintenance', 'unavailable'], {
			message: 'Selecione o status',
		}),

		// Step 3: Informacoes Basicas
		title: z
			.string()
			.min(3, 'Titulo deve ter pelo menos 3 caracteres')
			.max(200, 'Titulo deve ter no maximo 200 caracteres'),
		description: z.string().optional(),
		bedrooms: z.string().optional(),
		bathrooms: z.string().optional(),
		suites: z.string().optional(),
		parkingSpaces: z.string().optional(),
		area: z.string().optional(),
		floor: z.string().optional(),
		totalFloors: z.string().optional(),

		// Step 4: Endereco
		zipCode: z.string().optional(),
		address: z.string().min(1, 'Endereco e obrigatorio'),
		addressNumber: z.string().optional(),
		addressComplement: z.string().optional(),
		neighborhood: z.string().optional(),
		city: z.string().min(1, 'Cidade e obrigatoria'),
		state: z.string().min(1, 'Estado e obrigatorio').max(2, 'Use a sigla do estado (ex: SP)'),

		// Step 5: Valores e Comissao
		rentalPrice: z.string().optional(),
		salePrice: z.string().optional(),
		iptuPrice: z.string().optional(),
		condoFee: z.string().optional(),
		commissionPercentage: z.string().optional(),

		// Step 6: Comodidades
		hasPool: z.boolean().optional(),
		hasGarden: z.boolean().optional(),
		hasGarage: z.boolean().optional(),
		hasElevator: z.boolean().optional(),
		hasGym: z.boolean().optional(),
		hasPlayground: z.boolean().optional(),
		hasSecurity: z.boolean().optional(),
		hasAirConditioning: z.boolean().optional(),
		hasFurnished: z.boolean().optional(),
		hasPetFriendly: z.boolean().optional(),
		hasBalcony: z.boolean().optional(),
		hasBarbecue: z.boolean().optional(),

		// Step 7: Publicacao
		isMarketplace: z.boolean().optional(),
		notes: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.listingType === 'rent' || data.listingType === 'both') {
				const rentalValue = getCurrencyRawValue(data.rentalPrice || '')
				return rentalValue > 0
			}
			return true
		},
		{
			message: 'Preco de aluguel e obrigatorio para locacao',
			path: ['rentalPrice'],
		},
	)
	.refine(
		(data) => {
			if (data.listingType === 'sale' || data.listingType === 'both') {
				const saleValue = getCurrencyRawValue(data.salePrice || '')
				return saleValue > 0
			}
			return true
		},
		{
			message: 'Preco de venda e obrigatorio para venda',
			path: ['salePrice'],
		},
	)

type EditPropertyFormData = z.infer<typeof editPropertySchema>

interface Step {
	id: string
	title: string
	description: string
	icon: React.ReactNode
}

const ALL_STEPS: Step[] = [
	{
		id: 'owner',
		title: 'Proprietario',
		description: 'Proprietario do imovel',
		icon: <User size={16} />,
	},
	{
		id: 'type',
		title: 'Categoria',
		description: 'Tipo e finalidade do imovel',
		icon: <Building2 size={16} />,
	},
	{
		id: 'details',
		title: 'Detalhes',
		description: 'Informacoes basicas do imovel',
		icon: <Home size={16} />,
	},
	{
		id: 'address',
		title: 'Endereco',
		description: 'Localizacao do imovel',
		icon: <MapPin size={16} />,
	},
	{
		id: 'pricing',
		title: 'Valores',
		description: 'Precos e comissao',
		icon: <DollarSign size={16} />,
	},
	{
		id: 'features',
		title: 'Extras',
		description: 'Caracteristicas do imovel',
		icon: <Settings size={16} />,
	},
	{
		id: 'photos',
		title: 'Fotos',
		description: 'Imagens do imovel',
		icon: <Camera size={16} />,
	},
	{
		id: 'publish',
		title: 'Publicacao',
		description: 'Configuracoes de publicacao',
		icon: <Globe size={16} />,
	},
]

function getStepsForPropertyType(type: PropertyType): Step[] {
	if (type === 'land') {
		return ALL_STEPS.filter((step) => step.id !== 'features')
	}
	return ALL_STEPS
}

interface EditPropertyModalProps {
	isOpen: boolean
	onClose: () => void
	property: Property | null
	isLoading?: boolean
}

const STATUS_OPTIONS = [
	{ value: 'available', label: 'Disponivel' },
	{ value: 'rented', label: 'Alugado' },
	{ value: 'sold', label: 'Vendido' },
	{ value: 'maintenance', label: 'Manutencao' },
	{ value: 'unavailable', label: 'Indisponivel' },
]

export function EditPropertyModal({
	isOpen,
	onClose,
	property,
	isLoading = false,
}: EditPropertyModalProps) {
	const updateMutation = useUpdatePropertyMutation()
	const [currentStep, setCurrentStep] = useState(0)
	const [cepLoading, setCepLoading] = useState(false)
	const [cepError, setCepError] = useState<string | null>(null)

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

	const listingType = watch('listingType')
	const propertyType = watch('type')
	const notesValue = watch('notes') || ''
	const selectedOwnerId = watch('ownerId')

	const steps = getStepsForPropertyType(propertyType || 'house')
	const currentStepId = steps[currentStep]?.id
	const currentStepData = steps[currentStep]
	const isLastStep = currentStep === steps.length - 1
	const isFirstStep = currentStep === 0
	const progress = ((currentStep + 1) / steps.length) * 100

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

			setCurrentStep(0)
			setCepError(null)
		}
	}, [property, isOpen, reset])

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

	const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = applyMask(e.target.value, 'cep')
		setValue('zipCode', masked, { shouldValidate: false })
	}

	const handleCurrencyChange =
		(field: 'rentalPrice' | 'salePrice' | 'iptuPrice' | 'condoFee') =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const masked = applyMask(e.target.value, 'currency')
			setValue(field, masked, { shouldValidate: false })
		}

	const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let value = e.target.value.replace(/\D/g, '')
		if (value.length > 4) value = value.slice(0, 4)
		if (Number.parseInt(value, 10) > 10000) value = '10000'
		const numValue = Number.parseInt(value, 10) || 0
		const formatted = numValue > 0 ? `${(numValue / 100).toFixed(2)}%` : ''
		setValue('commissionPercentage', formatted, { shouldValidate: false })
	}

	const fetchAddressByCep = useCallback(
		async (cep: string) => {
			const cleanCep = cep.replace(/\D/g, '')
			if (cleanCep.length !== 8) return

			setCepLoading(true)
			setCepError(null)

			try {
				const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
				if (!response.ok) throw new Error('Erro ao buscar CEP')

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

	const validateCurrentStep = async (): Promise<boolean> => {
		switch (currentStepId) {
			case 'owner':
				return await trigger(['ownerId'])
			case 'type':
				return await trigger(['type', 'listingType', 'status'])
			case 'details':
				return await trigger(['title'])
			case 'address':
				return await trigger(['address', 'city', 'state'])
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

	const onSubmit = async (data: EditPropertyFormData) => {
		if (!property) return

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

			const response = await updateMutation.mutateAsync({
				id: property.id,
				input: payload,
			})
			toast.success(response.message || 'Imovel atualizado com sucesso!')
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
		}
	}

	const handleClose = useCallback(() => {
		if (!updateMutation.isPending) {
			reset()
			setCepError(null)
			setCurrentStep(0)
			onClose()
		}
	}, [updateMutation.isPending, reset, onClose])

	const isSubmitting = updateMutation.isPending

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
				<div className={styles.stepsContainer}>
					{steps.map((step, index) => {
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
								{index < steps.length - 1 && (
									<div className={styles.stepConnectorWrapper}>
										<div
											className={`${styles.stepConnector} ${
												isCompleted ? styles.stepConnectorCompleted : ''
											}`}
										/>
									</div>
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
						Salvar Alteracoes
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
									Altere o proprietario do imovel se necessario. Caso o proprietario ainda nao esteja
									cadastrado, voce pode adiciona-lo na pagina de Proprietarios.
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
								options={STATUS_OPTIONS}
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
										onChange={handleCepChange}
										onBlur={(e) => fetchAddressByCep(e.target.value)}
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
										onChange={handleCurrencyChange('rentalPrice')}
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
										onChange={handleCurrencyChange('salePrice')}
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
									onChange={handleCurrencyChange('iptuPrice')}
									fullWidth
									disabled={isSubmitting}
									leftIcon={<FileText size={18} />}
								/>
								<Input
									{...register('condoFee')}
									label="Condominio"
									placeholder="R$ 0,00"
									error={errors.condoFee?.message}
									onChange={handleCurrencyChange('condoFee')}
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
								onChange={handlePercentageChange}
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
											Gerencie as fotos do imovel. Adicione novas ou remova as existentes.
										</p>
									</div>
								</div>
								<div className={styles.photosCounter}>
									<Camera size={12} />
									<span>{property.photos?.length || 0}/20</span>
								</div>
							</div>

							<div className={styles.photosTips}>
								<div className={styles.photosTipItem}>
									<CheckCircle2 size={12} className={styles.photosTipIcon} />
									<span>Primeira foto = capa</span>
								</div>
								<div className={styles.photosTipItem}>
									<CheckCircle2 size={12} className={styles.photosTipIcon} />
									<span>Fotos bem iluminadas</span>
								</div>
								<div className={styles.photosTipItem}>
									<CheckCircle2 size={12} className={styles.photosTipIcon} />
									<span>Todos os comodos</span>
								</div>
							</div>

							<PropertyPhotoUpload
								propertyId={property.id}
								photos={property.photos || []}
								maxPhotos={20}
								disabled={isSubmitting}
							/>
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
												{property?.photos?.length === 0
													? 'Nenhuma'
													: `${property?.photos?.length || 0} foto(s)`}
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
