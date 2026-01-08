import {
	ArrowLeft,
	Bath,
	Bed,
	Building2,
	Calendar,
	Car,
	ChevronDown,
	Clock,
	Download,
	Edit,
	ExternalLink,
	FileText,
	FolderOpen,
	Home,
	Mail,
	MapPin,
	Phone,
	Ruler,
	Trash2,
	User,
	UserX,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useDeletedDocumentsQuery, useDocumentsQuery } from '@/queries/documents/documents.queries'
import { usePropertiesQuery } from '@/queries/properties/usePropertiesQuery'
import { useDeletePropertyOwnerMutation } from '@/queries/property-owners/useDeletePropertyOwnerMutation'
import { usePropertyOwnerQuery } from '@/queries/property-owners/usePropertyOwnerQuery'
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPE_LABELS } from '@/types/document.types'
import type { Property, PropertyStatus } from '@/types/property.types'
import { MARITAL_STATUS_LABELS } from '@/types/property-owner.types'
import { getAvatarColor, getInitials } from '@/utils/avatar'
import {
	formatCep,
	formatCurrencyFromCents,
	formatDateOrNull,
	formatDocument,
	formatPhone,
} from '@/utils/format'
import * as styles from './styles.css'

// Alias para uso no componente onde esperamos null em vez de '-'
const formatDate = formatDateOrNull

const PROPERTY_TYPE_LABELS: Record<string, string> = {
	house: 'Casa',
	apartment: 'Apartamento',
	land: 'Terreno',
	commercial: 'Comercial',
	rural: 'Rural',
}

const LISTING_TYPE_LABELS: Record<string, string> = {
	rent: 'Locacao',
	sale: 'Venda',
	both: 'Locacao e Venda',
}

const STATUS_LABELS: Record<string, string> = {
	available: 'Disponivel',
	rented: 'Alugado',
	sold: 'Vendido',
	maintenance: 'Manutencao',
	unavailable: 'Indisponivel',
}

type StatusFilter = 'all' | PropertyStatus
type DocumentsFilter = 'active' | 'deleted'

export function PropertyOwnerProfilePage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [propertiesLimit, setPropertiesLimit] = useState(5)
	const [documentsFilter, setDocumentsFilter] = useState<DocumentsFilter>('active')

	const { data: owner, isLoading, error } = usePropertyOwnerQuery(id || '')
	const { data: documentsData, isLoading: isLoadingDocs } = useDocumentsQuery(
		DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
		id || '',
		{ enabled: !!id },
	)
	const { data: deletedDocumentsData, isLoading: isLoadingDeletedDocs } = useDeletedDocumentsQuery(
		DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
		id || '',
		{ enabled: !!id },
	)
	const { data: propertiesData, isLoading: isLoadingProperties } = usePropertiesQuery({
		ownerId: id,
		status: statusFilter === 'all' ? undefined : statusFilter,
		limit: 100,
	})
	const deleteMutation = useDeletePropertyOwnerMutation()

	const isImageFile = (mimeType: string) => {
		return mimeType.startsWith('image/')
	}

	const getStatusStyle = (status: string) => {
		switch (status) {
			case 'available':
				return styles.statusAvailable
			case 'rented':
				return styles.statusRented
			case 'sold':
				return styles.statusSold
			case 'maintenance':
				return styles.statusMaintenance
			default:
				return styles.statusUnavailable
		}
	}

	const getPropertyLocation = (property: Property) => {
		const parts = []
		if (property.neighborhood) parts.push(property.neighborhood)
		if (property.city) parts.push(property.city)
		if (property.state) parts.push(property.state)
		return parts.join(', ') || 'Localizacao nao informada'
	}

	const handleEdit = () => {
		navigate(`/property-owners?modal=edit&id=${id}`)
	}

	const handleDelete = async () => {
		if (!id) return
		try {
			await deleteMutation.mutateAsync(id)
			navigate('/property-owners')
		} catch {
			// Error handled by mutation
		}
	}

	if (isLoading) {
		return (
			<AdminLayout>
				<div className={styles.container}>
					<div className={styles.pageHeader}>
						<Skeleton width="150px" height="24px" />
						<Skeleton width="180px" height="36px" />
					</div>
					<div className={styles.profileCard}>
						<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
							<Skeleton width="80px" height="80px" borderRadius="50%" />
							<div style={{ flex: 1 }}>
								<Skeleton width="200px" height="24px" />
								<Skeleton width="150px" height="16px" />
								<Skeleton width="250px" height="16px" />
							</div>
						</div>
					</div>
					<div className={styles.content}>
						<div className={styles.mainColumn}>
							<Skeleton width="100%" height="150px" borderRadius="16px" />
							<Skeleton width="100%" height="120px" borderRadius="16px" />
						</div>
						<div className={styles.sideColumn}>
							<Skeleton width="100%" height="150px" borderRadius="16px" />
						</div>
					</div>
				</div>
			</AdminLayout>
		)
	}

	if (error || !owner) {
		return (
			<AdminLayout>
				<div className={styles.container}>
					<div className={styles.pageHeader}>
						<div className={styles.pageHeaderLeft}>
							<Link to="/property-owners" className={styles.backButton}>
								<ArrowLeft size={16} />
								Voltar
							</Link>
						</div>
					</div>
					<div className={styles.errorContainer}>
						<UserX size={48} className={styles.errorIcon} />
						<h2 className={styles.errorTitle}>Proprietario nao encontrado</h2>
						<p className={styles.errorDescription}>Este proprietario nao existe ou foi removido.</p>
						<Button variant="outline" size="small" onClick={() => navigate('/property-owners')}>
							Voltar para lista
						</Button>
					</div>
				</div>
			</AdminLayout>
		)
	}

	const avatarColor = getAvatarColor(owner.name)
	const documents = documentsData?.data || []
	const deletedDocuments = deletedDocumentsData?.data || []
	const hasAddress = owner.address || owner.city || owner.state || owner.zipCode
	const hasPersonalInfo =
		owner.documentType === 'cpf' &&
		(owner.rg || owner.nationality || owner.maritalStatus || owner.profession || owner.birthDate)

	return (
		<AdminLayout>
			<div className={styles.container}>
				{/* Page Header */}
				<div className={styles.pageHeader}>
					<div className={styles.pageHeaderLeft}>
						<Link to="/property-owners" className={styles.backButton}>
							<ArrowLeft size={16} />
							Voltar
						</Link>
					</div>
					<div className={styles.pageHeaderRight}>
						<Button variant="outline" size="small" onClick={handleEdit}>
							<Edit size={14} />
							Editar
						</Button>
						<Button variant="danger" size="small" onClick={() => setIsDeleteDialogOpen(true)}>
							<Trash2 size={14} />
							Excluir
						</Button>
					</div>
				</div>

				{/* Profile Card */}
				<div className={styles.profileCard}>
					<div className={styles.profileHeader}>
						<div className={styles.avatarContainer}>
							{owner.photoUrl ? (
								<img src={owner.photoUrl} alt={owner.name} className={styles.avatar} />
							) : (
								<div
									className={styles.avatarFallback}
									style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
								>
									{getInitials(owner.name)}
								</div>
							)}
							<div className={styles.statusIndicator} />
						</div>
						<div className={styles.profileInfo}>
							<div className={styles.nameRow}>
								<h2 className={styles.name}>{owner.name}</h2>
								<span
									className={`${styles.badge} ${owner.documentType === 'cpf' ? styles.badgeCpf : styles.badgeCnpj}`}
								>
									{owner.documentType.toUpperCase()}
								</span>
							</div>
							<p className={styles.document}>
								{formatDocument(owner.document, owner.documentType)}
							</p>
							<div className={styles.quickStats}>
								<div className={styles.statItem}>
									<Building2 size={14} className={styles.statIcon} />
									<span className={styles.statValue}>{owner.propertiesCount ?? 0}</span>
									<span>imoveis</span>
								</div>
								{formatDateOrNull(owner.createdAt) && (
									<div className={styles.statItem}>
										<Calendar size={14} className={styles.statIcon} />
										<span>Cliente desde</span>
										<span className={styles.statValue}>{formatDateOrNull(owner.createdAt)}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className={styles.content}>
					<div className={styles.mainColumn}>
						{/* Contact Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>
									<Phone size={16} className={styles.cardTitleIcon} />
									Contato
								</h3>
							</div>
							<div className={styles.contactGrid}>
								<div className={styles.contactItem}>
									<div className={`${styles.contactIconWrapper} ${styles.contactIconPhone}`}>
										<Phone size={16} />
									</div>
									<div className={styles.contactInfo}>
										<span className={styles.contactLabel}>Telefone</span>
										{owner.phone ? (
											<a href={`tel:${owner.phone}`} className={styles.contactValue}>
												{formatPhone(owner.phone)}
											</a>
										) : (
											<span className={styles.contactValueMuted}>Nao informado</span>
										)}
									</div>
								</div>
								<div className={styles.contactItem}>
									<div className={`${styles.contactIconWrapper} ${styles.contactIconPhone}`}>
										<Phone size={16} />
									</div>
									<div className={styles.contactInfo}>
										<span className={styles.contactLabel}>Telefone 2</span>
										{owner.phoneSecondary ? (
											<a href={`tel:${owner.phoneSecondary}`} className={styles.contactValue}>
												{formatPhone(owner.phoneSecondary)}
											</a>
										) : (
											<span className={styles.contactValueMuted}>Nao informado</span>
										)}
									</div>
								</div>
								<div className={styles.contactItem} style={{ gridColumn: 'span 2' }}>
									<div className={`${styles.contactIconWrapper} ${styles.contactIconEmail}`}>
										<Mail size={16} />
									</div>
									<div className={styles.contactInfo}>
										<span className={styles.contactLabel}>Email</span>
										{owner.email ? (
											<a href={`mailto:${owner.email}`} className={styles.contactValue}>
												{owner.email}
											</a>
										) : (
											<span className={styles.contactValueMuted}>Nao informado</span>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Address Card */}
						{hasAddress && (
							<div className={styles.card}>
								<div className={styles.cardHeader}>
									<h3 className={styles.cardTitle}>
										<MapPin size={16} className={styles.cardTitleIcon} />
										Endereco
									</h3>
								</div>
								<div className={styles.addressMain}>
									<div className={styles.addressIconWrapper}>
										<MapPin size={18} />
									</div>
									<div className={styles.addressInfo}>
										<p className={styles.addressLine}>
											{owner.address ? (
												<>
													{owner.address}
													{owner.addressNumber && `, ${owner.addressNumber}`}
													{owner.addressComplement && ` - ${owner.addressComplement}`}
												</>
											) : (
												'Endereco nao informado'
											)}
										</p>
										{owner.neighborhood && (
											<p className={styles.addressSecondary}>{owner.neighborhood}</p>
										)}
									</div>
								</div>
								<div className={styles.infoGrid}>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Cidade</span>
										<span className={owner.city ? styles.infoValue : styles.infoValueMuted}>
											{owner.city || '-'}
										</span>
									</div>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Estado</span>
										<span className={owner.state ? styles.infoValue : styles.infoValueMuted}>
											{owner.state || '-'}
										</span>
									</div>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>CEP</span>
										<span className={owner.zipCode ? styles.infoValue : styles.infoValueMuted}>
											{formatCep(owner.zipCode) || '-'}
										</span>
									</div>
								</div>
							</div>
						)}

						{/* Personal Info Card */}
						{hasPersonalInfo && (
							<div className={styles.card}>
								<div className={styles.cardHeader}>
									<h3 className={styles.cardTitle}>
										<User size={16} className={styles.cardTitleIcon} />
										Dados Pessoais
									</h3>
								</div>
								<div className={styles.infoGrid}>
									{owner.rg && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>RG</span>
											<span className={styles.infoValue}>{owner.rg}</span>
										</div>
									)}
									{owner.birthDate && formatDateOrNull(owner.birthDate) && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Nascimento</span>
											<span className={styles.infoValue}>{formatDateOrNull(owner.birthDate)}</span>
										</div>
									)}
									{owner.nationality && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Nacionalidade</span>
											<span className={styles.infoValue}>{owner.nationality}</span>
										</div>
									)}
									{owner.maritalStatus && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Estado Civil</span>
											<span className={styles.infoValue}>
												{MARITAL_STATUS_LABELS[owner.maritalStatus] || owner.maritalStatus}
											</span>
										</div>
									)}
									{owner.profession && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Profissao</span>
											<span className={styles.infoValue}>{owner.profession}</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Notes Card */}
						{owner.notes && (
							<div className={styles.card}>
								<div className={styles.cardHeader}>
									<h3 className={styles.cardTitle}>
										<FileText size={16} className={styles.cardTitleIcon} />
										Observacoes
									</h3>
								</div>
								<div className={styles.notesContent}>{owner.notes}</div>
							</div>
						)}

						{/* Properties History Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.propertiesHistoryHeader}>
									<h3 className={styles.cardTitle}>
										<Building2 size={16} className={styles.cardTitleIcon} />
										Historico de Imoveis
									</h3>
									<div className={styles.propertiesHistoryFilters}>
										<button
											type="button"
											className={`${styles.filterButton} ${statusFilter === 'all' ? styles.filterButtonActive : ''}`}
											onClick={() => setStatusFilter('all')}
										>
											Todos
										</button>
										<button
											type="button"
											className={`${styles.filterButton} ${statusFilter === 'available' ? styles.filterButtonActive : ''}`}
											onClick={() => setStatusFilter('available')}
										>
											Disponiveis
										</button>
										<button
											type="button"
											className={`${styles.filterButton} ${statusFilter === 'rented' ? styles.filterButtonActive : ''}`}
											onClick={() => setStatusFilter('rented')}
										>
											Alugados
										</button>
										<button
											type="button"
											className={`${styles.filterButton} ${statusFilter === 'sold' ? styles.filterButtonActive : ''}`}
											onClick={() => setStatusFilter('sold')}
										>
											Vendidos
										</button>
									</div>
								</div>
								<span className={styles.cardCount}>{propertiesData?.total ?? 0}</span>
							</div>

							{isLoadingProperties ? (
								<div className={styles.propertiesList}>
									<Skeleton width="100%" height="120px" borderRadius="12px" />
									<Skeleton width="100%" height="120px" borderRadius="12px" />
								</div>
							) : propertiesData && propertiesData.data.length > 0 ? (
								<>
									<div className={styles.propertiesList}>
										{propertiesData.data.slice(0, propertiesLimit).map((property) => (
											<Link
												key={property.id}
												to={`/properties/${property.id}`}
												className={styles.propertyCard}
											>
												<div className={styles.propertyImageContainer}>
													{property.photos && property.photos.length > 0 ? (
														<img
															src={property.photos[0].url}
															alt={property.title}
															className={styles.propertyImage}
														/>
													) : (
														<div className={styles.propertyImagePlaceholder}>
															<Home size={32} />
														</div>
													)}
												</div>
												<div className={styles.propertyInfo}>
													<div className={styles.propertyHeader}>
														<h4 className={styles.propertyTitle}>{property.title}</h4>
														{property.code && (
															<span className={styles.propertyCode}>{property.code}</span>
														)}
													</div>
													<div className={styles.propertyBadges}>
														<span className={styles.propertyTypeBadge}>
															{PROPERTY_TYPE_LABELS[property.type] || property.type}
														</span>
														<span className={styles.listingTypeBadge}>
															{LISTING_TYPE_LABELS[property.listingType] || property.listingType}
														</span>
														<span
															className={`${styles.statusBadge} ${getStatusStyle(property.status)}`}
														>
															{STATUS_LABELS[property.status] || property.status}
														</span>
													</div>
													<div className={styles.propertyLocation}>
														<MapPin size={12} />
														<span>{getPropertyLocation(property)}</span>
													</div>
													<div className={styles.propertyMeta}>
														{property.bedrooms !== null && property.bedrooms > 0 && (
															<div className={styles.propertyMetaItem}>
																<Bed size={12} className={styles.propertyMetaIcon} />
																<span className={styles.propertyMetaValue}>
																	{property.bedrooms}
																</span>
																<span>quartos</span>
															</div>
														)}
														{property.bathrooms !== null && property.bathrooms > 0 && (
															<div className={styles.propertyMetaItem}>
																<Bath size={12} className={styles.propertyMetaIcon} />
																<span className={styles.propertyMetaValue}>
																	{property.bathrooms}
																</span>
																<span>banheiros</span>
															</div>
														)}
														{property.parkingSpaces !== null && property.parkingSpaces > 0 && (
															<div className={styles.propertyMetaItem}>
																<Car size={12} className={styles.propertyMetaIcon} />
																<span className={styles.propertyMetaValue}>
																	{property.parkingSpaces}
																</span>
																<span>vagas</span>
															</div>
														)}
														{property.area !== null && property.area > 0 && (
															<div className={styles.propertyMetaItem}>
																<Ruler size={12} className={styles.propertyMetaIcon} />
																<span className={styles.propertyMetaValue}>{property.area}</span>
																<span>m²</span>
															</div>
														)}
													</div>
												</div>
												<div className={styles.propertyPricing}>
													{property.listingType !== 'sale' && property.rentalPrice ? (
														<div>
															<span className={styles.propertyPrice}>
																{formatCurrencyFromCents(property.rentalPrice)}
															</span>
															<span className={styles.propertyPriceLabel}>/mes</span>
														</div>
													) : property.salePrice ? (
														<div>
															<span className={styles.propertyPrice}>
																{formatCurrencyFromCents(property.salePrice)}
															</span>
															<span className={styles.propertyPriceLabel}>venda</span>
														</div>
													) : (
														<span className={styles.propertyPriceLabel}>Preco nao informado</span>
													)}
												</div>
											</Link>
										))}
									</div>
									{propertiesData.data.length > propertiesLimit && (
										<button
											type="button"
											className={styles.loadMoreButton}
											onClick={() => setPropertiesLimit((prev) => prev + 5)}
										>
											<ChevronDown size={16} />
											Ver mais imoveis ({propertiesData.data.length - propertiesLimit} restantes)
										</button>
									)}
								</>
							) : (
								<div className={styles.propertiesEmptyState}>
									<div className={styles.propertiesEmptyIcon}>
										<Building2 size={28} />
									</div>
									{statusFilter === 'all' ? (
										<>
											<h4 className={styles.propertiesEmptyTitle}>Nenhum imovel cadastrado</h4>
											<p className={styles.propertiesEmptyDescription}>
												Este proprietario ainda nao possui imoveis vinculados. Cadastre um novo
												imovel e vincule a este proprietario.
											</p>
										</>
									) : (
										<>
											<h4 className={styles.propertiesEmptyTitle}>
												Nenhum imovel {STATUS_LABELS[statusFilter]?.toLowerCase()}
											</h4>
											<p className={styles.propertiesEmptyDescription}>
												Nao ha imoveis com o status "{STATUS_LABELS[statusFilter]}" para este
												proprietario. Tente selecionar outro filtro.
											</p>
										</>
									)}
								</div>
							)}
						</div>

						{/* Documents Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.documentsHistoryHeader}>
									<h3 className={styles.cardTitle}>
										<FolderOpen size={16} className={styles.cardTitleIcon} />
										Documentos
									</h3>
									<div className={styles.documentsHistoryFilters}>
										<button
											type="button"
											className={`${styles.filterButton} ${documentsFilter === 'active' ? styles.filterButtonActive : ''}`}
											onClick={() => setDocumentsFilter('active')}
										>
											Ativos ({documents.length})
										</button>
										<button
											type="button"
											className={`${styles.filterButton} ${documentsFilter === 'deleted' ? styles.filterButtonActive : ''}`}
											onClick={() => setDocumentsFilter('deleted')}
										>
											Excluidos ({deletedDocuments.length})
										</button>
									</div>
								</div>
								<span className={styles.cardCount}>
									{documentsFilter === 'active' ? documents.length : deletedDocuments.length}
								</span>
							</div>

							{/* Active Documents */}
							{documentsFilter === 'active' &&
								(isLoadingDocs ? (
									<div className={styles.documentsGrid}>
										<Skeleton width="100%" height="100px" borderRadius="8px" />
										<Skeleton width="100%" height="100px" borderRadius="8px" />
									</div>
								) : documents.length > 0 ? (
									<div className={styles.documentsGrid}>
										{documents.map((doc) => (
											<div key={doc.id} className={styles.documentCard}>
												<div className={styles.documentPreview}>
													{isImageFile(doc.mimeType) ? (
														<img
															src={doc.url}
															alt={doc.originalName}
															className={styles.documentImage}
														/>
													) : (
														<div className={styles.documentIconWrapper}>
															<FileText size={20} />
														</div>
													)}
													<div className={styles.documentOverlay}>
														<a
															href={doc.url}
															target="_blank"
															rel="noopener noreferrer"
															className={styles.documentAction}
														>
															<ExternalLink size={12} />
														</a>
														<a
															href={doc.url}
															download={doc.originalName}
															className={styles.documentAction}
														>
															<Download size={12} />
														</a>
													</div>
												</div>
												<div className={styles.documentInfo}>
													<p className={styles.documentName} title={doc.originalName}>
														{doc.originalName}
													</p>
													<p className={styles.documentType}>
														{DOCUMENT_TYPE_LABELS[
															doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS
														] || doc.documentType}
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className={styles.emptyState}>
										<FolderOpen size={20} />
										<p className={styles.emptyStateText}>Nenhum documento</p>
									</div>
								))}

							{/* Deleted Documents */}
							{documentsFilter === 'deleted' &&
								(isLoadingDeletedDocs ? (
									<div className={styles.documentsGrid}>
										<Skeleton width="100%" height="100px" borderRadius="8px" />
										<Skeleton width="100%" height="100px" borderRadius="8px" />
									</div>
								) : deletedDocuments.length > 0 ? (
									<div className={styles.documentsGrid}>
										{deletedDocuments.map((doc) => (
											<div key={doc.id} className={styles.deletedDocumentCard}>
												<div className={styles.deletedBadge}>
													<Trash2 size={10} />
													Excluido
												</div>
												<div className={styles.documentPreview}>
													{isImageFile(doc.mimeType) ? (
														<img
															src={doc.url}
															alt={doc.originalName}
															className={styles.documentImage}
														/>
													) : (
														<div className={styles.documentIconWrapper}>
															<FileText size={20} />
														</div>
													)}
													<div className={styles.documentOverlay}>
														<a
															href={doc.url}
															target="_blank"
															rel="noopener noreferrer"
															className={styles.documentAction}
														>
															<ExternalLink size={12} />
														</a>
														<a
															href={doc.url}
															download={doc.originalName}
															className={styles.documentAction}
														>
															<Download size={12} />
														</a>
													</div>
												</div>
												<div className={styles.documentInfo}>
													<p className={styles.documentName} title={doc.originalName}>
														{doc.originalName}
													</p>
													<p className={styles.documentType}>
														{DOCUMENT_TYPE_LABELS[
															doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS
														] || doc.documentType}
													</p>
												</div>
												{doc.deletedAt && (
													<div className={styles.deletedDocumentInfo}>
														<div className={styles.deletedDocumentMeta}>
															<Clock size={10} />
															<span>Excluido em {formatDate(doc.deletedAt)}</span>
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<div className={styles.emptyState}>
										<Trash2 size={20} />
										<p className={styles.emptyStateText}>Nenhum documento excluido</p>
									</div>
								))}
						</div>
					</div>

					<div className={styles.sideColumn}>
						{/* Metadata Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>
									<Clock size={16} className={styles.cardTitleIcon} />
									Registro
								</h3>
							</div>
							{formatDate(owner.createdAt) || (owner.updatedAt && formatDate(owner.updatedAt)) ? (
								<div className={styles.metadataList}>
									{formatDate(owner.createdAt) && (
										<div className={styles.metadataItem}>
											<Calendar size={14} className={styles.metadataIcon} />
											<div className={styles.metadataInfo}>
												<span className={styles.metadataLabel}>Criado em</span>
												<span className={styles.metadataValue}>{formatDate(owner.createdAt)}</span>
											</div>
										</div>
									)}
									{owner.updatedAt && formatDate(owner.updatedAt) && (
										<div className={styles.metadataItem}>
											<Clock size={14} className={styles.metadataIcon} />
											<div className={styles.metadataInfo}>
												<span className={styles.metadataLabel}>Atualizado em</span>
												<span className={styles.metadataValue}>{formatDate(owner.updatedAt)}</span>
											</div>
										</div>
									)}
								</div>
							) : (
								<div className={styles.emptyState}>
									<Clock size={20} />
									<p className={styles.emptyStateText}>Sem informacoes de registro</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<ConfirmDialog
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={handleDelete}
				title="Excluir Proprietario"
				description={`Tem certeza que deseja excluir <strong>${owner.name}</strong>? Esta acao nao pode ser desfeita.`}
				confirmText="Excluir"
				cancelText="Cancelar"
				isLoading={deleteMutation.isPending}
				variant="danger"
			/>
		</AdminLayout>
	)
}
