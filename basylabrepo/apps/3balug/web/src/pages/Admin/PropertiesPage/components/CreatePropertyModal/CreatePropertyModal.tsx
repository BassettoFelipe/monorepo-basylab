import { zodResolver } from '@hookform/resolvers/zod'
import {
	AirVent,
	AlertTriangle,
	Armchair,
	Baby,
	Building2,
	Camera,
	Car,
	CheckCircle2,
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
	PawPrint,
	Percent,
	Rocket,
	Ruler,
	Shield,
	Sparkles,
	Upload,
	Waves,
} from 'lucide-react'
import type { FocusEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Input } from '@/components/Input/Input'
import { OwnerSelect } from '@/components/OwnerSelect'
import { PhotoPicker, type SelectedPhoto } from '@/components/PhotoPicker/PhotoPicker'
import { ListingTypeSelector, PropertyTypeSelector } from '@/components/PropertyTypeSelector'
import { Select } from '@/components/Select/Select'
import { Textarea } from '@/components/Textarea/Textarea'
import { WizardModal } from '@/components/WizardModal'
import { getPropertyStepsForType } from '@/constants/wizard-steps'
import { useCepLookup } from '@/hooks/useCepLookup'
import { useMaskedInput } from '@/hooks/useMaskedInput'
import { useCreatePropertyMutation } from '@/queries/properties/useCreatePropertyMutation'
import { usePropertyOwnersQuery } from '@/queries/property-owners/usePropertyOwnersQuery'
import { useBatchRegisterPhotosMutation } from '@/queries/property-photos/useBatchRegisterPhotosMutation'
import { type CreatePropertyFormData, createPropertySchema } from '@/schemas/property.schema'
import { getPresignedUrl, uploadToPresignedUrl } from '@/services/files/presigned-url'
import type { BatchRegisterPhotoItem } from '@/services/property-photos/batch-register'
import type { ListingType, PropertyType } from '@/types/property.types'
import { BRAZILIAN_STATES } from '@/types/property-owner.types'
import { getCurrencyRawValue } from '@/utils/masks'
import * as styles from './CreatePropertyModal.styles.css'

interface CreatePropertyModalProps {
	isOpen: boolean
	onClose: () => void
}

export function CreatePropertyModal({ isOpen, onClose }: CreatePropertyModalProps) {
	const createMutation = useCreatePropertyMutation()
	const batchRegisterPhotosMutation = useBatchRegisterPhotosMutation()
	const [currentStep, setCurrentStep] = useState(0)
	const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const prevIsOpenRef = useRef(isOpen)

	const { data: ownersData, isLoading: isLoadingOwners } = usePropertyOwnersQuery({ limit: 100 })

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
		setValue,
		trigger,
		control,
	} = useForm<CreatePropertyFormData>({
		resolver: zodResolver(createPropertySchema),
		mode: 'onBlur',
		defaultValues: {
			type: 'house',
			listingType: 'rent',
			isMarketplace: false,
		},
	})

	const { createMaskedHandler } = useMaskedInput(setValue)

	// Use useWatch for reactive values (more efficient than multiple watch() calls)
	const [listingType, propertyType, notesValue, selectedOwnerId, isMarketplace] = useWatch({
		control,
		name: ['listingType', 'type', 'notes', 'ownerId', 'isMarketplace'],
	})

	// Watch feature checkboxes for styling
	const featureValues = useWatch({
		control,
		name: [
			'hasPool',
			'hasGarden',
			'hasGarage',
			'hasElevator',
			'hasGym',
			'hasPlayground',
			'hasSecurity',
			'hasAirConditioning',
			'hasFurnished',
			'hasPetFriendly',
			'hasBalcony',
			'hasBarbecue',
		],
	})

	const steps = getPropertyStepsForType(propertyType || 'house')
	const currentStepId = steps[currentStep]?.id

	// Reset step when modal opens (using ref to detect transition)
	useEffect(() => {
		if (isOpen && !prevIsOpenRef.current) {
			setCurrentStep(0)
		}
		prevIsOpenRef.current = isOpen
	}, [isOpen])

	// Cleanup blob URLs on unmount to prevent memory leaks
	useEffect(() => {
		return () => {
			for (const photo of selectedPhotos) {
				URL.revokeObjectURL(photo.preview)
			}
		}
	}, [selectedPhotos])

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
				return await trigger(['type', 'listingType'])
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
					// Step 1: Get presigned URLs for all photos in parallel
					const presignedUrlPromises = selectedPhotos.map((photo) =>
						getPresignedUrl({
							fileName: photo.file.name,
							contentType: photo.file.type,
							fieldId: `property-${propertyId}`,
							allowedTypes: ['image/*'],
						}),
					)
					const presignedUrls = await Promise.all(presignedUrlPromises)

					// Step 2: Upload all files directly to storage in parallel
					const uploadPromises = selectedPhotos.map((photo, index) =>
						uploadToPresignedUrl(presignedUrls[index].data.uploadUrl, photo.file),
					)
					await Promise.all(uploadPromises)

					// Step 3: Register all photos in the database with a single batch request
					const photosToRegister: BatchRegisterPhotoItem[] = selectedPhotos.map((photo, index) => ({
						key: presignedUrls[index].data.key,
						originalName: photo.file.name,
						mimeType: photo.file.type,
						size: photo.file.size,
						url: presignedUrls[index].data.publicUrl,
						isPrimary: photo.isPrimary,
					}))

					await batchRegisterPhotosMutation.mutateAsync({
						propertyId,
						photos: photosToRegister,
					})
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
			clearCepError()
			setSelectedPhotos([])
			setCurrentStep(0)
			onClose()
		}
	}, [createMutation.isPending, isUploading, selectedPhotos, reset, clearCepError, onClose])

	const isSubmitting = createMutation.isPending || isUploading

	// Simple handlers without useCallback - they are not passed to memoized children
	const handleOwnerChange = (ownerId: string) => {
		setValue('ownerId', ownerId, { shouldValidate: true })
	}

	const handlePropertyTypeChange = (type: PropertyType) => {
		setValue('type', type, { shouldValidate: true })
	}

	const handleListingTypeChange = (type: ListingType) => {
		setValue('listingType', type, { shouldValidate: true })
	}

	return (
		<WizardModal
			isOpen={isOpen}
			onClose={handleClose}
			title="Adicionar Imovel"
			steps={steps}
			currentStep={currentStep}
			onNext={handleNext}
			onPrevious={handlePrevious}
			onSubmit={handleSubmit(onSubmit)}
			isSubmitting={isSubmitting}
			submitButtonText="Adicionar Imovel"
			submitLoadingText={isUploading ? 'Enviando fotos...' : undefined}
		>
			<form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
				{/* Step: Proprietario */}
				{currentStepId === 'owner' && (
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
								className={`${styles.featureCheckbox} ${featureValues[0] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[1] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[2] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[3] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[4] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[5] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[6] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[7] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[8] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[9] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[10] ? styles.featureCheckboxChecked : ''}`}
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
								className={`${styles.featureCheckbox} ${featureValues[11] ? styles.featureCheckboxChecked : ''}`}
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
				{currentStepId === 'photos' && (
					<div className={styles.formSection}>
						<div className={styles.photosHeader}>
							<div className={styles.photosHeaderContent}>
								<div className={styles.photosHeaderIcon}>
									<Image size={18} />
								</div>
								<div className={styles.photosHeaderText}>
									<h3 className={styles.photosHeaderTitle}>Galeria de Fotos</h3>
									<p className={styles.photosHeaderDescription}>
										Adicione fotos de qualidade para atrair mais interessados
									</p>
								</div>
							</div>
							<div className={styles.photosCounter}>
								<Camera size={12} />
								<span>{selectedPhotos.length}/20</span>
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

						<PhotoPicker
							photos={selectedPhotos}
							onChange={setSelectedPhotos}
							maxPhotos={20}
							disabled={isSubmitting}
							label=""
						/>

						{selectedPhotos.length === 0 && (
							<div className={styles.photosEmptyState}>
								<Upload size={32} className={styles.photosEmptyIcon} />
								<p className={styles.photosEmptyTitle}>Nenhuma foto adicionada</p>
								<p className={styles.photosEmptyText}>Clique acima ou arraste suas fotos</p>
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
												}[propertyType]
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
												}[listingType]
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
											{selectedPhotos.length === 0 ? 'Nenhuma' : `${selectedPhotos.length} foto(s)`}
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
											{isMarketplace ? 'Publico' : 'Interno'}
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
