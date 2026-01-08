import {
	ArrowLeft,
	Bath,
	Bed,
	Building,
	Calendar,
	Car,
	Check,
	ChevronLeft,
	ChevronRight,
	Copy,
	Edit,
	EyeOff,
	FileText,
	Globe,
	Hash,
	Home,
	ImageOff,
	Images,
	Info,
	Layers,
	Lock,
	MapPin,
	Percent,
	Ruler,
	Sparkles,
	Square,
	StickyNote,
	User,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { usePropertyQuery } from '@/queries/properties/usePropertyQuery'
import type { ListingType, PropertyStatus, PropertyType } from '@/types/property.types'
import * as styles from './styles.css'

const propertyTypeLabels: Record<PropertyType, string> = {
	house: 'Casa',
	apartment: 'Apartamento',
	land: 'Terreno',
	commercial: 'Comercial',
	rural: 'Rural',
}

const listingTypeLabels: Record<ListingType, string> = {
	rent: 'Locacao',
	sale: 'Venda',
	both: 'Locacao e Venda',
}

const statusLabels: Record<PropertyStatus, string> = {
	available: 'Disponivel',
	rented: 'Alugado',
	sold: 'Vendido',
	maintenance: 'Manutencao',
	unavailable: 'Indisponivel',
}

const featureLabels: Record<string, string> = {
	hasPool: 'Piscina',
	hasGarden: 'Jardim',
	hasGarage: 'Garagem',
	hasElevator: 'Elevador',
	hasGym: 'Academia',
	hasPlayground: 'Playground',
	hasSecurity: 'Seguranca 24h',
	hasAirConditioning: 'Ar Condicionado',
	hasFurnished: 'Mobiliado',
	hasPetFriendly: 'Aceita Pets',
	hasBalcony: 'Varanda',
	hasBarbecue: 'Churrasqueira',
}

const getTypeBadgeClass = (type: PropertyType) => {
	const classes: Record<PropertyType, string> = {
		house: styles.badgeHouse,
		apartment: styles.badgeApartment,
		land: styles.badgeLand,
		commercial: styles.badgeCommercial,
		rural: styles.badgeRural,
	}
	return classes[type]
}

const getListingTypeBadgeClass = (listingType: ListingType) => {
	const classes: Record<ListingType, string> = {
		rent: styles.badgeRent,
		sale: styles.badgeSale,
		both: styles.badgeBoth,
	}
	return classes[listingType]
}

const getStatusBadgeClass = (status: PropertyStatus) => {
	const classes: Record<PropertyStatus, string> = {
		available: styles.badgeAvailable,
		rented: styles.badgeRented,
		sold: styles.badgeSold,
		maintenance: styles.badgeMaintenance,
		unavailable: styles.badgeUnavailable,
	}
	return classes[status]
}

const formatCurrency = (value: number | null) => {
	if (value === null || value === undefined) return '-'
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value / 100)
}

const formatDate = (dateString: string | undefined) => {
	if (!dateString) return '-'
	return new Date(dateString).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
}

export function PropertyDetailsPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [showGallery, setShowGallery] = useState(false)
	const [galleryIndex, setGalleryIndex] = useState(0)
	const [codeCopied, setCodeCopied] = useState(false)

	const { data: property, isLoading, error } = usePropertyQuery(id || '')

	const photos = property?.photos || []
	const sortedPhotos = [...photos].sort((a, b) => {
		if (a.isPrimary && !b.isPrimary) return -1
		if (!a.isPrimary && b.isPrimary) return 1
		return a.order - b.order
	})
	const primaryPhoto = sortedPhotos[0]

	const handlePrevPhoto = useCallback(() => {
		setGalleryIndex((prev) => (prev > 0 ? prev - 1 : sortedPhotos.length - 1))
	}, [sortedPhotos.length])

	const handleNextPhoto = useCallback(() => {
		setGalleryIndex((prev) => (prev < sortedPhotos.length - 1 ? prev + 1 : 0))
	}, [sortedPhotos.length])

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!showGallery) return
			if (e.key === 'ArrowLeft') handlePrevPhoto()
			if (e.key === 'ArrowRight') handleNextPhoto()
			if (e.key === 'Escape') setShowGallery(false)
		},
		[showGallery, handlePrevPhoto, handleNextPhoto],
	)

	const handleCopyCode = useCallback(() => {
		if (property?.code) {
			navigator.clipboard.writeText(property.code)
			setCodeCopied(true)
			setTimeout(() => setCodeCopied(false), 2000)
		}
	}, [property?.code])

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown])

	if (isLoading) {
		return (
			<AdminLayout>
				<div className={styles.skeletonBanner} />
				<div className={styles.container}>
					<div className={styles.propertyHeader}>
						<Skeleton width="60%" height="32px" />
						<div style={{ marginTop: '8px' }}>
							<Skeleton width="40%" height="20px" />
						</div>
						<div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
							<Skeleton width="80px" height="24px" variant="rounded" />
							<Skeleton width="80px" height="24px" variant="rounded" />
							<Skeleton width="80px" height="24px" variant="rounded" />
						</div>
					</div>
					<div className={styles.content}>
						<div className={styles.mainColumn}>
							<Skeleton width="100%" height="120px" />
							<Skeleton width="100%" height="200px" />
						</div>
						<div className={styles.sideColumn}>
							<Skeleton width="100%" height="200px" />
							<Skeleton width="100%" height="150px" />
						</div>
					</div>
				</div>
			</AdminLayout>
		)
	}

	if (error || !property) {
		return (
			<AdminLayout>
				<div className={styles.container}>
					<Link to="/properties" className={styles.backLink}>
						<ArrowLeft size={16} />
						Voltar para Imoveis
					</Link>
					<div className={styles.errorContainer}>
						<ImageOff size={48} />
						<p>Imovel nao encontrado</p>
						<Button variant="outline" onClick={() => navigate('/properties')}>
							Voltar para lista
						</Button>
					</div>
				</div>
			</AdminLayout>
		)
	}

	const activeFeatures = property.features
		? Object.entries(property.features)
				.filter(([, value]) => value === true)
				.map(([key]) => key)
		: []

	// Build full address with all components
	const addressParts = []
	if (property.address) {
		let mainAddress = property.address
		if (property.addressNumber) mainAddress += `, ${property.addressNumber}`
		if (property.addressComplement) mainAddress += ` - ${property.addressComplement}`
		addressParts.push(mainAddress)
	}
	if (property.neighborhood) addressParts.push(property.neighborhood)
	if (property.city && property.state) {
		addressParts.push(`${property.city}/${property.state}`)
	} else if (property.city || property.state) {
		addressParts.push(property.city || property.state)
	}
	if (property.zipCode) {
		addressParts.push(`CEP: ${property.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}`)
	}
	const fullAddress = addressParts.filter(Boolean).join(', ')

	// Check if it's an apartment type (to show floor info)
	const isApartment = property.type === 'apartment'

	// Check if there are additional area details
	const hasAreaDetails = property.totalArea || property.builtArea

	// Check if there are additional property details
	const hasAdditionalDetails =
		property.suites ||
		property.yearBuilt ||
		(isApartment && (property.floor || property.totalFloors))

	// Check if there are commission details
	const hasCommissionDetails = property.commissionPercentage || property.commissionValue

	return (
		<AdminLayout>
			{/* Hero Banner com foto principal */}
			<div className={styles.heroBanner}>
				{primaryPhoto ? (
					<img src={primaryPhoto.url} alt={property.title} className={styles.heroImage} />
				) : (
					<div className={styles.heroNoImage}>
						<ImageOff size={64} />
						<span>Nenhuma foto cadastrada</span>
					</div>
				)}
				<div className={styles.heroGradient} aria-hidden="true" />

				{/* Back button sobre o banner */}
				<Link to="/properties" className={styles.heroBackButton}>
					<ArrowLeft size={16} />
					Voltar
				</Link>

				{/* Edit button sobre o banner */}
				<div className={styles.heroEditButton}>
					<Button
						variant="primary"
						onClick={() => navigate(`/properties?modal=edit&id=${property.id}`)}
					>
						<Edit size={16} />
						Editar
					</Button>
				</div>

				{/* Photo count badge */}
				{sortedPhotos.length > 0 && (
					<button
						type="button"
						className={styles.photoCount}
						onClick={() => {
							setGalleryIndex(0)
							setShowGallery(true)
						}}
					>
						<Images size={18} />
						{sortedPhotos.length} {sortedPhotos.length === 1 ? 'foto' : 'fotos'}
					</button>
				)}
			</div>

			<div className={styles.container}>
				{/* Property Header */}
				<div className={styles.propertyHeader}>
					{/* Code and Marketplace indicator */}
					<div className={styles.propertyMeta}>
						{property.code && (
							<button
								type="button"
								className={styles.propertyCode}
								onClick={handleCopyCode}
								title="Clique para copiar"
							>
								<Hash size={14} />
								{property.code}
								<Copy size={12} className={styles.copyIcon} />
								{codeCopied && <span className={styles.copiedTooltip}>Copiado!</span>}
							</button>
						)}
						{property.isMarketplace && (
							<span className={styles.marketplaceBadge}>
								<Globe size={12} />
								Marketplace
							</span>
						)}
					</div>

					<h1 className={styles.propertyTitle}>{property.title}</h1>
					<p className={styles.propertyLocation}>
						<MapPin size={16} />
						{property.city && property.state
							? `${property.city}, ${property.state}`
							: property.city || property.state || 'Endereco nao informado'}
					</p>
					<div className={styles.badgesRow}>
						<span className={`${styles.badge} ${getTypeBadgeClass(property.type)}`}>
							{propertyTypeLabels[property.type]}
						</span>
						<span className={`${styles.badge} ${getListingTypeBadgeClass(property.listingType)}`}>
							{listingTypeLabels[property.listingType]}
						</span>
						<span className={`${styles.badge} ${getStatusBadgeClass(property.status)}`}>
							{statusLabels[property.status]}
						</span>
					</div>
				</div>

				{/* Main Content */}
				<div className={styles.content}>
					{/* Main Column */}
					<div className={styles.mainColumn}>
						{/* Main Characteristics Grid */}
						<div className={styles.characteristicsGrid}>
							<div className={styles.characteristicItem}>
								<div className={styles.characteristicIcon}>
									<Bed size={20} />
								</div>
								<span className={styles.characteristicValue}>{property.bedrooms ?? 0}</span>
								<span className={styles.characteristicLabel}>Quartos</span>
							</div>
							<div className={styles.characteristicItem}>
								<div className={styles.characteristicIcon}>
									<Bath size={20} />
								</div>
								<span className={styles.characteristicValue}>{property.bathrooms ?? 0}</span>
								<span className={styles.characteristicLabel}>Banheiros</span>
							</div>
							<div className={styles.characteristicItem}>
								<div className={styles.characteristicIcon}>
									<Car size={20} />
								</div>
								<span className={styles.characteristicValue}>{property.parkingSpaces ?? 0}</span>
								<span className={styles.characteristicLabel}>Vagas</span>
							</div>
							<div className={styles.characteristicItem}>
								<div className={styles.characteristicIcon}>
									<Ruler size={20} />
								</div>
								<span className={styles.characteristicValue}>
									{property.area ? `${property.area}` : '-'}
								</span>
								<span className={styles.characteristicLabel}>m²</span>
							</div>
						</div>

						{/* Additional Details (suites, floor, year) */}
						{hasAdditionalDetails && (
							<div className={styles.card}>
								<h2 className={styles.cardTitle}>
									<span className={styles.cardTitleIcon}>
										<Info size={18} />
									</span>
									Detalhes do Imovel
								</h2>
								<div className={styles.detailsGrid}>
									{property.suites !== null && property.suites !== undefined && (
										<div className={styles.detailItem}>
											<span className={styles.detailLabel}>
												<Bed size={14} />
												Suites
											</span>
											<span className={styles.detailValue}>{property.suites}</span>
										</div>
									)}
									{isApartment && property.floor !== null && property.floor !== undefined && (
										<div className={styles.detailItem}>
											<span className={styles.detailLabel}>
												<Layers size={14} />
												Andar
											</span>
											<span className={styles.detailValue}>
												{property.floor}
												{property.totalFloors ? `/${property.totalFloors}` : ''}
											</span>
										</div>
									)}
									{isApartment &&
										!property.floor &&
										property.totalFloors !== null &&
										property.totalFloors !== undefined && (
											<div className={styles.detailItem}>
												<span className={styles.detailLabel}>
													<Building size={14} />
													Total de Andares
												</span>
												<span className={styles.detailValue}>{property.totalFloors}</span>
											</div>
										)}
									{property.yearBuilt !== null && property.yearBuilt !== undefined && (
										<div className={styles.detailItem}>
											<span className={styles.detailLabel}>
												<Calendar size={14} />
												Ano de Construcao
											</span>
											<span className={styles.detailValue}>{property.yearBuilt}</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Area Details */}
						{hasAreaDetails && (
							<div className={styles.card}>
								<h2 className={styles.cardTitle}>
									<span className={styles.cardTitleIcon}>
										<Square size={18} />
									</span>
									Areas
								</h2>
								<div className={styles.detailsGrid}>
									{property.area !== null && property.area !== undefined && (
										<div className={styles.detailItem}>
											<span className={styles.detailLabel}>
												<Ruler size={14} />
												Area Util
											</span>
											<span className={styles.detailValue}>{property.area} m²</span>
										</div>
									)}
									{property.totalArea !== null && property.totalArea !== undefined && (
										<div className={styles.detailItem}>
											<span className={styles.detailLabel}>
												<Square size={14} />
												Area Total
											</span>
											<span className={styles.detailValue}>{property.totalArea} m²</span>
										</div>
									)}
									{property.builtArea !== null && property.builtArea !== undefined && (
										<div className={styles.detailItem}>
											<span className={styles.detailLabel}>
												<Home size={14} />
												Area Construida
											</span>
											<span className={styles.detailValue}>{property.builtArea} m²</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Description */}
						<div className={styles.card}>
							<h2 className={styles.cardTitle}>
								<span className={styles.cardTitleIcon}>
									<FileText size={18} />
								</span>
								Descricao
							</h2>
							{property.description ? (
								<p className={styles.description}>{property.description}</p>
							) : (
								<p className={`${styles.description} ${styles.noDescription}`}>
									Nenhuma descricao informada
								</p>
							)}
						</div>

						{/* Photo Gallery */}
						{sortedPhotos.length > 1 && (
							<div className={styles.card}>
								<div className={styles.cardTitleRow}>
									<h2 className={`${styles.cardTitle} ${styles.cardTitleNoMargin}`}>
										<span className={styles.cardTitleIcon}>
											<Images size={18} />
										</span>
										Fotos do Imovel
									</h2>
									<span className={styles.photoCountBadge}>{sortedPhotos.length} fotos</span>
								</div>
								<div className={styles.photoGalleryGrid}>
									{sortedPhotos.slice(0, 6).map((photo, index) => (
										<button
											key={photo.id}
											type="button"
											className={styles.photoGalleryItem}
											onClick={() => {
												setGalleryIndex(index)
												setShowGallery(true)
											}}
										>
											<img
												src={photo.url}
												alt={`Foto ${index + 1}`}
												className={styles.photoGalleryImage}
											/>
											{index === 5 && sortedPhotos.length > 6 && (
												<div className={styles.photoGalleryOverlay}>
													<span className={styles.photoGalleryMore}>
														+{sortedPhotos.length - 6}
													</span>
												</div>
											)}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Features/Amenities */}
						{activeFeatures.length > 0 && (
							<div className={styles.card}>
								<h2 className={styles.cardTitle}>
									<span className={styles.cardTitleIcon}>
										<Sparkles size={18} />
									</span>
									Comodidades
								</h2>
								<div className={styles.featuresList}>
									{activeFeatures.map((feature) => (
										<div key={feature} className={styles.featureTag}>
											<span className={styles.featureIcon}>
												<Check size={14} />
											</span>
											{featureLabels[feature] || feature}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Address */}
						{fullAddress && (
							<div className={styles.card}>
								<h2 className={styles.cardTitle}>
									<span className={styles.cardTitleIcon}>
										<MapPin size={18} />
									</span>
									Endereco
								</h2>
								<p className={styles.addressText}>{fullAddress}</p>
							</div>
						)}

						{/* Internal Notes */}
						{property.notes && (
							<div className={styles.card}>
								<div className={styles.cardTitleRow}>
									<h2 className={`${styles.cardTitle} ${styles.cardTitleNoMargin}`}>
										<span className={styles.cardTitleIcon}>
											<StickyNote size={18} />
										</span>
										Observacoes Internas
									</h2>
									<span className={styles.adminOnlyBadge}>
										<EyeOff size={12} />
										Visivel apenas para administradores
									</span>
								</div>
								<p className={styles.notesText}>{property.notes}</p>
							</div>
						)}
					</div>

					{/* Side Column */}
					<div className={styles.sideColumn}>
						{/* Price Card */}
						<div className={styles.priceCardSticky}>
							<div className={styles.priceCard}>
								{/* Main Price */}
								<div className={styles.priceMain}>
									{(property.listingType === 'rent' || property.listingType === 'both') &&
										property.rentalPrice && (
											<div>
												<p className={styles.priceLabel}>Aluguel</p>
												<p className={styles.priceValue}>
													{formatCurrency(property.rentalPrice)}
													<span className={styles.pricePerMonth}>/mes</span>
												</p>
											</div>
										)}
									{(property.listingType === 'sale' || property.listingType === 'both') &&
										property.salePrice && (
											<div className={property.listingType === 'both' ? styles.priceDivider : ''}>
												<p className={styles.priceLabel}>Venda</p>
												<p className={styles.priceValue}>{formatCurrency(property.salePrice)}</p>
											</div>
										)}
								</div>

								{/* Secondary Prices */}
								{(property.iptuPrice || property.condoFee) && (
									<div>
										{property.iptuPrice && (
											<div className={styles.priceSecondary}>
												<span>IPTU</span>
												<span className={styles.priceSecondaryValue}>
													{formatCurrency(property.iptuPrice)}/mes
												</span>
											</div>
										)}
										{property.condoFee && (
											<div className={styles.priceSecondary}>
												<span>Condominio</span>
												<span className={styles.priceSecondaryValue}>
													{formatCurrency(property.condoFee)}/mes
												</span>
											</div>
										)}
									</div>
								)}

								{/* Commission Info */}
								{hasCommissionDetails && (
									<div className={styles.commissionSection}>
										<div className={styles.commissionHeader}>
											<p className={styles.commissionTitle}>
												<Percent size={14} />
												Comissao
											</p>
											<span className={styles.adminOnlyBadgeSmall}>
												<Lock size={10} />
												Admin
											</span>
										</div>
										{property.commissionPercentage !== null &&
											property.commissionPercentage !== undefined && (
												<div className={styles.priceSecondary}>
													<span>Percentual</span>
													<span className={styles.priceSecondaryValue}>
														{property.commissionPercentage}%
													</span>
												</div>
											)}
										{property.commissionValue !== null &&
											property.commissionValue !== undefined && (
												<div className={styles.priceSecondary}>
													<span>Valor</span>
													<span className={styles.priceSecondaryValue}>
														{formatCurrency(property.commissionValue)}
													</span>
												</div>
											)}
									</div>
								)}
							</div>
						</div>

						{/* Owner */}
						{property.owner && (
							<div className={styles.card}>
								<div className={styles.cardTitleRow}>
									<h2 className={`${styles.cardTitle} ${styles.cardTitleNoMargin}`}>
										<span className={styles.cardTitleIcon}>
											<Home size={18} />
										</span>
										Proprietario
									</h2>
									<span className={styles.adminOnlyBadgeSmall}>
										<Lock size={10} />
										Admin
									</span>
								</div>
								<div className={styles.ownerCard}>
									<div className={styles.ownerAvatar}>
										<User size={24} />
									</div>
									<div className={styles.ownerInfo}>
										<p className={styles.ownerName}>{property.owner.name}</p>
										<p className={styles.ownerRole}>Proprietario</p>
									</div>
								</div>
							</div>
						)}

						{/* Broker */}
						{property.broker && (
							<div className={styles.card}>
								<div className={styles.cardTitleRow}>
									<h2 className={`${styles.cardTitle} ${styles.cardTitleNoMargin}`}>
										<span className={styles.cardTitleIcon}>
											<User size={18} />
										</span>
										Corretor Responsavel
									</h2>
									<span className={styles.adminOnlyBadgeSmall}>
										<Lock size={10} />
										Admin
									</span>
								</div>
								<div className={styles.ownerCard}>
									<div className={styles.ownerAvatar}>
										<User size={24} />
									</div>
									<div className={styles.ownerInfo}>
										<p className={styles.ownerName}>{property.broker.name}</p>
										<p className={styles.ownerRole}>Corretor</p>
									</div>
								</div>
							</div>
						)}

						{/* Registration Info */}
						{property.createdAt && (
							<div className={styles.registrationInfo}>
								<Calendar size={14} />
								<span>Cadastrado em {formatDate(property.createdAt)}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Photo Gallery Modal */}
			{showGallery && sortedPhotos.length > 0 && (
				<div className={styles.galleryModal}>
					<div className={styles.galleryHeader}>
						<span className={styles.galleryTitle}>
							{galleryIndex + 1} / {sortedPhotos.length}
						</span>
						<button
							type="button"
							className={styles.galleryClose}
							onClick={() => setShowGallery(false)}
						>
							<X size={24} />
						</button>
					</div>

					<div className={styles.galleryMain}>
						<img
							src={sortedPhotos[galleryIndex]?.url}
							alt={`Foto ${galleryIndex + 1}`}
							className={styles.galleryImage}
						/>

						{sortedPhotos.length > 1 && (
							<>
								<button
									type="button"
									className={`${styles.galleryNav} ${styles.galleryNavPrev}`}
									onClick={handlePrevPhoto}
								>
									<ChevronLeft size={28} />
								</button>
								<button
									type="button"
									className={`${styles.galleryNav} ${styles.galleryNavNext}`}
									onClick={handleNextPhoto}
								>
									<ChevronRight size={28} />
								</button>
							</>
						)}
					</div>

					{sortedPhotos.length > 1 && (
						<div className={styles.galleryThumbnails}>
							{sortedPhotos.map((photo, index) => (
								<button
									key={photo.id}
									type="button"
									className={`${styles.galleryThumbnail} ${index === galleryIndex ? styles.galleryThumbnailActive : ''}`}
									onClick={() => setGalleryIndex(index)}
								>
									<img
										src={photo.url}
										alt={`Thumbnail ${index + 1}`}
										className={styles.galleryThumbnailImage}
									/>
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</AdminLayout>
	)
}
