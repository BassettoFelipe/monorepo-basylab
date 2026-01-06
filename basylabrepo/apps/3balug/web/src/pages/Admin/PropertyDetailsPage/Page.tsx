import { ArrowLeft, Bath, Bed, Car, Check, Edit, ImageOff, MapPin, Ruler, User } from 'lucide-react'
import { useState } from 'react'
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

export function PropertyDetailsPage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

	const { data: property, isLoading, error } = usePropertyQuery(id || '')

	if (isLoading) {
		return (
			<AdminLayout>
				<div className={styles.container}>
					<Skeleton width="150px" height="20px" />
					<div style={{ marginTop: '24px' }}>
						<Skeleton width="60%" height="32px" />
						<div style={{ marginTop: '8px' }}>
							<Skeleton width="40%" height="20px" />
						</div>
					</div>
					<div
						style={{
							marginTop: '32px',
							display: 'grid',
							gridTemplateColumns: '2fr 1fr',
							gap: '24px',
						}}
					>
						<Skeleton width="100%" height="400px" />
						<Skeleton width="100%" height="300px" />
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

	const photos = property.photos || []
	const sortedPhotos = [...photos].sort((a, b) => {
		if (a.isPrimary && !b.isPrimary) return -1
		if (!a.isPrimary && b.isPrimary) return 1
		return a.order - b.order
	})
	const currentPhoto = sortedPhotos[selectedPhotoIndex]

	const activeFeatures = property.features
		? Object.entries(property.features)
				.filter(([, value]) => value === true)
				.map(([key]) => key)
		: []

	const fullAddress = [
		property.address,
		property.neighborhood,
		property.city && property.state
			? `${property.city}/${property.state}`
			: property.city || property.state,
		property.zipCode ? `CEP: ${property.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}` : null,
	]
		.filter(Boolean)
		.join(', ')

	return (
		<AdminLayout>
			<div className={styles.container}>
				<Link to="/properties" className={styles.backLink}>
					<ArrowLeft size={16} />
					Voltar para Imoveis
				</Link>

				<div className={styles.header}>
					<div className={styles.headerInfo}>
						<h1 className={styles.title}>{property.title}</h1>
						<p className={styles.subtitle}>
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
					<div className={styles.headerActions}>
						<Button
							variant="primary"
							onClick={() => navigate(`/properties?modal=edit&id=${property.id}`)}
						>
							<Edit size={18} />
							Editar
						</Button>
					</div>
				</div>

				<div className={styles.content}>
					<div className={styles.mainColumn}>
						{/* Gallery */}
						<div className={styles.card}>
							<div className={styles.galleryContainer}>
								{sortedPhotos.length > 0 ? (
									<>
										<img
											src={currentPhoto?.url}
											alt={property.title}
											className={styles.mainImage}
										/>
										{sortedPhotos.length > 1 && (
											<div className={styles.thumbnailsRow}>
												{sortedPhotos.map((photo, index) => (
													<img
														key={photo.id}
														src={photo.url}
														alt={`Foto ${index + 1}`}
														className={`${styles.thumbnail} ${
															index === selectedPhotoIndex ? styles.thumbnailActive : ''
														}`}
														onClick={() => setSelectedPhotoIndex(index)}
													/>
												))}
											</div>
										)}
									</>
								) : (
									<div className={styles.noPhotos}>
										<ImageOff size={48} />
										<span>Nenhuma foto cadastrada</span>
									</div>
								)}
							</div>
						</div>

						{/* Description */}
						<div className={styles.card}>
							<h2 className={styles.cardTitle}>Descricao</h2>
							{property.description ? (
								<p className={styles.description}>{property.description}</p>
							) : (
								<p className={`${styles.description} ${styles.noDescription}`}>
									Nenhuma descricao informada
								</p>
							)}
						</div>

						{/* Features */}
						{activeFeatures.length > 0 && (
							<div className={styles.card}>
								<h2 className={styles.cardTitle}>Comodidades</h2>
								<div className={styles.featuresList}>
									{activeFeatures.map((feature) => (
										<span key={feature} className={styles.featureTag}>
											<Check size={14} />
											{featureLabels[feature] || feature}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Address */}
						{fullAddress && (
							<div className={styles.card}>
								<h2 className={styles.cardTitle}>Endereco</h2>
								<p className={styles.addressText}>{fullAddress}</p>
							</div>
						)}
					</div>

					<div className={styles.sideColumn}>
						{/* Price Card */}
						<div className={styles.card}>
							{(property.listingType === 'rent' || property.listingType === 'both') &&
								property.rentalPrice && (
									<div
										className={styles.priceCard}
										style={{
											marginBottom: property.listingType === 'both' ? '16px' : 0,
										}}
									>
										<p className={styles.priceLabel}>Aluguel</p>
										<p className={styles.priceValue}>
											{formatCurrency(property.rentalPrice)}
											<span className={styles.pricePerMonth}>/mes</span>
										</p>
									</div>
								)}
							{(property.listingType === 'sale' || property.listingType === 'both') &&
								property.salePrice && (
									<div className={styles.priceCard}>
										<p className={styles.priceLabel}>Venda</p>
										<p className={styles.priceValue}>{formatCurrency(property.salePrice)}</p>
									</div>
								)}

							{(property.iptuPrice || property.condoFee) && (
								<div className={styles.infoGrid} style={{ marginTop: '16px' }}>
									{property.iptuPrice && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>IPTU</span>
											<span className={styles.infoValue}>
												{formatCurrency(property.iptuPrice)}/mes
											</span>
										</div>
									)}
									{property.condoFee && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Condominio</span>
											<span className={styles.infoValue}>
												{formatCurrency(property.condoFee)}/mes
											</span>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Characteristics */}
						<div className={styles.card}>
							<h2 className={styles.cardTitle}>Caracteristicas</h2>
							<div className={styles.infoGrid}>
								<div className={styles.infoItem}>
									<span className={styles.infoLabel}>
										<Bed size={14} style={{ marginRight: '4px' }} />
										Quartos
									</span>
									<span className={styles.infoValue}>{property.bedrooms ?? 0}</span>
								</div>
								<div className={styles.infoItem}>
									<span className={styles.infoLabel}>
										<Bath size={14} style={{ marginRight: '4px' }} />
										Banheiros
									</span>
									<span className={styles.infoValue}>{property.bathrooms ?? 0}</span>
								</div>
								<div className={styles.infoItem}>
									<span className={styles.infoLabel}>
										<Car size={14} style={{ marginRight: '4px' }} />
										Vagas
									</span>
									<span className={styles.infoValue}>{property.parkingSpaces ?? 0}</span>
								</div>
								<div className={styles.infoItem}>
									<span className={styles.infoLabel}>
										<Ruler size={14} style={{ marginRight: '4px' }} />
										Area
									</span>
									<span className={styles.infoValue}>
										{property.area ? `${property.area} m²` : '-'}
									</span>
								</div>
							</div>
						</div>

						{/* Owner */}
						{property.owner && (
							<div className={styles.card}>
								<h2 className={styles.cardTitle}>Proprietario</h2>
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
								<h2 className={styles.cardTitle}>Corretor Responsavel</h2>
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
					</div>
				</div>
			</div>
		</AdminLayout>
	)
}
