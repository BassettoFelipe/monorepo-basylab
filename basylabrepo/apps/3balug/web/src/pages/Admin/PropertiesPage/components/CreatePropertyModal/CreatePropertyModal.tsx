import { zodResolver } from '@hookform/resolvers/zod'
import {
	AlertTriangle,
	Building2,
	Camera,
	CheckCircle2,
	DollarSign,
	Eye,
	EyeOff,
	FileText,
	Globe,
	Home,
	Image,
	Info,
	Loader2,
	MapPin,
	Percent,
	Rocket,
	Ruler,
	Settings,
	Sparkles,
	Upload,
	User,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'

import { Input } from '@/components/Input/Input'
import { OwnerSelect } from '@/components/OwnerSelect'
import { PhotoPicker, type SelectedPhoto } from '@/components/PhotoPicker/PhotoPicker'
import { ListingTypeSelector, PropertyTypeSelector } from '@/components/PropertyTypeSelector'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { WizardModal, type WizardStep } from '@/components/WizardModal'
import { useCreatePropertyMutation } from '@/queries/properties/useCreatePropertyMutation'
import { usePropertyOwnersQuery } from '@/queries/property-owners/usePropertyOwnersQuery'
import { useUploadPropertyPhotoMutation } from '@/queries/property-photos/useUploadPropertyPhotoMutation'
import type { ListingType, PropertyType } from '@/types/property.types'
import { BRAZILIAN_STATES } from '@/types/property-owner.types'
import { applyMask, getCurrencyRawValue } from '@/utils/masks'
import * as styles from './CreatePropertyModal.styles.css'

interface ViaCepResponse {
	cep: string
	logradouro: string
	complemento: string
	bairro: string
	localidade: string
	uf: string
	erro?: boolean
}

const createPropertySchema = z
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

type CreatePropertyFormData = z.infer<typeof createPropertySchema>

interface CreatePropertyModalProps {
	isOpen: boolean
	onClose: () => void
}

const STEPS: WizardStep[] = [
	{
		id: 'owner',
		title: 'Proprietario',
		description: 'Selecione o proprietario do imovel',
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

export function CreatePropertyModal({ isOpen, onClose }: CreatePropertyModalProps) {
	const createMutation = useCreatePropertyMutation()
	const uploadPhotoMutation = useUploadPropertyPhotoMutation()
	const [currentStep, setCurrentStep] = useState(0)
	const [cepLoading, setCepLoading] = useState(false)
	const [cepError, setCepError] = useState<string | null>(null)
	const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])
	const [isUploading, setIsUploading] = useState(false)

	const { data: ownersData, isLoading: isLoadingOwners } = usePropertyOwnersQuery({ limit: 100 })

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
		setValue,
		trigger,
	} = useForm<CreatePropertyFormData>({
		resolver: zodResolver(createPropertySchema),
		mode: 'onBlur',
		defaultValues: {
			type: 'house',
			listingType: 'rent',
			isMarketplace: false,
		},
	})

	const listingType = watch('listingType')
	const propertyType = watch('type')
	const notesValue = watch('notes') || ''

	useEffect(() => {
		if (isOpen) {
			setCurrentStep(0)
		}
	}, [isOpen])

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
		switch (currentStep) {
			case 0: // Proprietario
				return await trigger(['ownerId'])
			case 1: // Tipo
				return await trigger(['type', 'listingType'])
			case 2: // Detalhes
				return await trigger(['title'])
			case 3: // Endereco
				return await trigger(['address', 'city', 'state'])
			case 4: // Valores
				if (listingType === 'rent' || listingType === 'both') {
					const isValid = await trigger(['rentalPrice'])
					if (!isValid) return false
				}
				if (listingType === 'sale' || listingType === 'both') {
					const isValid = await trigger(['salePrice'])
					if (!isValid) return false
				}
				return true
			case 5: // Comodidades
			case 6: // Fotos
			case 7: // Publicacao
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

	const onSubmit = async (data: CreatePropertyFormData) => {
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
				: undefined

			const payload = {
				ownerId: data.ownerId,
				title: data.title,
				description: data.description || undefined,
				type: data.type as PropertyType,
				listingType: data.listingType as ListingType,
				zipCode: data.zipCode?.replace(/\D/g, '') || undefined,
				address: data.address || undefined,
				addressNumber: data.addressNumber || undefined,
				addressComplement: data.addressComplement || undefined,
				neighborhood: data.neighborhood || undefined,
				city: data.city || undefined,
				state: data.state || undefined,
				bedrooms: data.bedrooms ? Number.parseInt(data.bedrooms, 10) : undefined,
				bathrooms: data.bathrooms ? Number.parseInt(data.bathrooms, 10) : undefined,
				suites: data.suites ? Number.parseInt(data.suites, 10) : undefined,
				parkingSpaces: data.parkingSpaces ? Number.parseInt(data.parkingSpaces, 10) : undefined,
				area: data.area ? Number.parseInt(data.area, 10) : undefined,
				floor: data.floor ? Number.parseInt(data.floor, 10) : undefined,
				totalFloors: data.totalFloors ? Number.parseInt(data.totalFloors, 10) : undefined,
				rentalPrice: getCurrencyRawValue(data.rentalPrice || '') || undefined,
				salePrice: getCurrencyRawValue(data.salePrice || '') || undefined,
				iptuPrice: getCurrencyRawValue(data.iptuPrice || '') || undefined,
				condoFee: getCurrencyRawValue(data.condoFee || '') || undefined,
				commissionPercentage: commissionPercentageRaw || undefined,
				isMarketplace: data.isMarketplace ?? false,
				notes: data.notes || undefined,
				features,
			}

			const response = await createMutation.mutateAsync(payload)
			const propertyId = response.data.id

			if (selectedPhotos.length > 0) {
				setIsUploading(true)
				try {
					for (const photo of selectedPhotos) {
						await uploadPhotoMutation.mutateAsync({
							propertyId,
							file: photo.file,
							isPrimary: photo.isPrimary,
						})
					}
				} catch {
					toast.error('Imovel criado, mas houve erro ao enviar algumas fotos')
				} finally {
					setIsUploading(false)
				}
			}

			toast.success(response.message || 'Imovel criado com sucesso!')
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
					: 'Erro ao criar imovel'
			toast.error(errorMessage)
		}
	}

	const handleClose = useCallback(() => {
		if (!createMutation.isPending && !isUploading) {
			for (const photo of selectedPhotos) {
				URL.revokeObjectURL(photo.preview)
			}
			reset()
			setCepError(null)
			setSelectedPhotos([])
			setCurrentStep(0)
			onClose()
		}
	}, [createMutation.isPending, isUploading, selectedPhotos, reset, onClose])

	const isSubmitting = createMutation.isPending || isUploading

	const selectedOwnerId = watch('ownerId')

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
		(listingType: ListingType) => {
			setValue('listingType', listingType, { shouldValidate: true })
		},
		[setValue],
	)

	return (
		<WizardModal
			isOpen={isOpen}
			onClose={handleClose}
			title="Adicionar Imovel"
			steps={STEPS}
			currentStep={currentStep}
			onNext={handleNext}
			onPrevious={handlePrevious}
			onSubmit={handleSubmit(onSubmit)}
			isSubmitting={isSubmitting}
			submitButtonText="Adicionar Imovel"
			submitLoadingText={isUploading ? 'Enviando fotos...' : undefined}
		>
			<form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
				{/* Step 1: Proprietario */}
				{currentStep === 0 && (
					<div className={styles.formSection}>
						<div className={styles.infoBox}>
							<Info size={18} className={styles.infoBoxIcon} />
							<p className={styles.infoBoxText}>
								Selecione o proprietario do imovel. Caso o proprietario ainda nao esteja cadastrado,
								voce pode adiciona-lo na pagina de Proprietarios.
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

				{/* Step 2: Tipo do Imovel */}
				{currentStep === 1 && (
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
					</div>
				)}

				{/* Step 3: Detalhes */}
				{currentStep === 2 && (
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

				{/* Step 4: Endereco */}
				{currentStep === 3 && (
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

				{/* Step 5: Valores e Comissao */}
				{currentStep === 4 && (
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
								<p className={styles.sectionHeaderDescription}>Percentual sobre o valor do negocio</p>
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
								O percentual de comissao sera aplicado sobre o valor total do negocio (aluguel ou venda).
							</p>
						</div>
					</div>
				)}

				{/* Step 6: Comodidades */}
				{currentStep === 5 && (
					<div className={styles.formSection}>
						{propertyType === 'land' ? (
							<div className={styles.infoBox}>
								<Info size={18} className={styles.infoBoxIcon} />
								<p className={styles.infoBoxText}>
									Terrenos geralmente nao possuem comodidades. Clique em &quot;Proximo&quot; para
									continuar.
								</p>
							</div>
						) : (
							<div className={styles.featuresGrid}>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasPool')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Piscina</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasGarden')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Jardim</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasGarage')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Garagem</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasElevator')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Elevador</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasGym')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Academia</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasPlayground')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Playground</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasSecurity')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Seguranca 24h</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasAirConditioning')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Ar Condicionado</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasFurnished')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Mobiliado</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasPetFriendly')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Aceita Pets</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasBalcony')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Varanda</span>
								</label>
								<label className={styles.featureCheckbox}>
									<input
										type="checkbox"
										className={styles.checkbox}
										{...register('hasBarbecue')}
										disabled={isSubmitting}
									/>
									<span className={styles.featureLabel}>Churrasqueira</span>
								</label>
							</div>
						)}
					</div>
				)}

				{/* Step 7: Fotos */}
				{currentStep === 6 && (
					<div className={styles.formSection}>
						<div className={styles.photosHeader}>
							<div className={styles.photosHeaderContent}>
								<div className={styles.photosHeaderIcon}>
									<Image size={24} />
								</div>
								<div className={styles.photosHeaderText}>
									<h3 className={styles.photosHeaderTitle}>Galeria de Fotos</h3>
									<p className={styles.photosHeaderDescription}>
										Adicione fotos de qualidade para atrair mais interessados
									</p>
								</div>
							</div>
							<div className={styles.photosCounter}>
								<Camera size={16} />
								<span>{selectedPhotos.length}/20</span>
							</div>
						</div>

						<div className={styles.photosTips}>
							<div className={styles.photosTipItem}>
								<CheckCircle2 size={16} className={styles.photosTipIcon} />
								<span>A primeira foto sera a capa do anuncio</span>
							</div>
							<div className={styles.photosTipItem}>
								<CheckCircle2 size={16} className={styles.photosTipIcon} />
								<span>Use fotos bem iluminadas e em alta resolucao</span>
							</div>
							<div className={styles.photosTipItem}>
								<CheckCircle2 size={16} className={styles.photosTipIcon} />
								<span>Inclua fotos de todos os comodos principais</span>
							</div>
						</div>

						<PhotoPicker
							photos={selectedPhotos}
							onChange={setSelectedPhotos}
							maxPhotos={20}
							disabled={isSubmitting}
							label=""
						/>

						{selectedPhotos.length === 0 && (
							<div className={styles.photosEmptyState}>
								<Upload size={48} className={styles.photosEmptyIcon} />
								<p className={styles.photosEmptyTitle}>Nenhuma foto adicionada</p>
								<p className={styles.photosEmptyText}>
									Clique na area acima ou arraste suas fotos para adicionar
								</p>
							</div>
						)}
					</div>
				)}

				{/* Step 8: Publicacao */}
				{currentStep === 7 && (
					<div className={styles.formSection}>
						<div className={styles.publishHeader}>
							<Rocket size={32} className={styles.publishHeaderIcon} />
							<h3 className={styles.publishHeaderTitle}>Pronto para publicar!</h3>
							<p className={styles.publishHeaderDescription}>
								Revise as configuracoes e publique seu imovel
							</p>
						</div>

						<div className={styles.visibilityCard}>
							<div className={styles.visibilityOption}>
								<div className={styles.visibilityOptionIcon}>
									{watch('isMarketplace') ? <Eye size={24} /> : <EyeOff size={24} />}
								</div>
								<div className={styles.visibilityOptionContent}>
									<h4 className={styles.visibilityOptionTitle}>
										{watch('isMarketplace') ? 'Visivel no Marketplace' : 'Apenas interno'}
									</h4>
									<p className={styles.visibilityOptionDescription}>
										{watch('isMarketplace')
											? 'O imovel ficara visivel para todos no marketplace publico'
											: 'O imovel ficara visivel apenas para a equipe interna'}
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
								<FileText size={18} />
								<span>Observacoes Internas</span>
							</div>
							<Textarea
								{...register('notes')}
								placeholder="Anotacoes internas sobre o imovel (nao serao exibidas publicamente)..."
								error={errors.notes?.message}
								rows={3}
								showCharCount
								maxLength={2000}
								value={notesValue}
								disabled={isSubmitting}
							/>
						</div>

						<div className={styles.summaryCard}>
							<div className={styles.summaryHeader}>
								<Sparkles size={20} className={styles.summaryHeaderIcon} />
								<h3 className={styles.summaryTitle}>Resumo do Imovel</h3>
							</div>
							<div className={styles.summaryGrid}>
								<div className={styles.summaryItem}>
									<div className={styles.summaryItemIcon}>
										<Home size={18} />
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
												}[propertyType]
											}
										</span>
									</div>
								</div>
								<div className={styles.summaryItem}>
									<div className={styles.summaryItemIcon}>
										<DollarSign size={18} />
									</div>
									<div className={styles.summaryItemContent}>
										<span className={styles.summaryLabel}>Finalidade</span>
										<span className={styles.summaryValue}>
											{
												{
													rent: 'Locacao',
													sale: 'Venda',
													both: 'Locacao e Venda',
												}[listingType]
											}
										</span>
									</div>
								</div>
								<div className={styles.summaryItem}>
									<div className={styles.summaryItemIcon}>
										<Camera size={18} />
									</div>
									<div className={styles.summaryItemContent}>
										<span className={styles.summaryLabel}>Fotos</span>
										<span className={styles.summaryValue}>
											{selectedPhotos.length === 0
												? 'Nenhuma foto'
												: `${selectedPhotos.length} foto(s)`}
										</span>
									</div>
								</div>
								<div className={styles.summaryItem}>
									<div className={styles.summaryItemIcon}>
										<Globe size={18} />
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
		</WizardModal>
	)
}
