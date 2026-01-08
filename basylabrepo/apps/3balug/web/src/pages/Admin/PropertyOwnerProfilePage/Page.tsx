import {
	ArrowLeft,
	Building2,
	Calendar,
	ChevronRight,
	Clock,
	Download,
	Edit,
	ExternalLink,
	FileText,
	FolderOpen,
	Mail,
	MapPin,
	Phone,
	Trash2,
	User,
	UserX,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useDeletePropertyOwnerMutation } from '@/queries/property-owners/useDeletePropertyOwnerMutation'
import { usePropertyOwnerQuery } from '@/queries/property-owners/usePropertyOwnerQuery'
import { useDocumentsQuery } from '@/queries/documents/documents.queries'
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPE_LABELS } from '@/types/document.types'
import { applyMask } from '@/utils/masks'
import { useState } from 'react'
import * as styles from './styles.css'

const MARITAL_STATUS_LABELS: Record<string, string> = {
	solteiro: 'Solteiro(a)',
	casado: 'Casado(a)',
	divorciado: 'Divorciado(a)',
	viuvo: 'Viuvo(a)',
	uniao_estavel: 'Uniao Estavel',
}

export function PropertyOwnerProfilePage() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const { data: owner, isLoading, error } = usePropertyOwnerQuery(id || '')
	const { data: documentsData, isLoading: isLoadingDocs } = useDocumentsQuery(
		DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
		id || '',
		{ enabled: !!id },
	)
	const deleteMutation = useDeletePropertyOwnerMutation()

	const formatDocument = (doc: string, type: 'cpf' | 'cnpj') => {
		return applyMask(doc, type)
	}

	const formatPhone = (phone: string) => {
		return applyMask(phone, 'phone')
	}

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return null
		try {
			const date = new Date(dateString)
			if (Number.isNaN(date.getTime())) return null
			return date.toLocaleDateString('pt-BR')
		} catch {
			return null
		}
	}

	const getInitials = (name: string) => {
		const parts = name.trim().split(' ')
		if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
	}

	const getAvatarColor = (name: string) => {
		const colors = [
			{ bg: '#DBEAFE', text: '#1E40AF' },
			{ bg: '#E0E7FF', text: '#4338CA' },
			{ bg: '#D1FAE5', text: '#065F46' },
			{ bg: '#FEF3C7', text: '#92400E' },
			{ bg: '#FCE7F3', text: '#9D174D' },
			{ bg: '#E0F2FE', text: '#0369A1' },
			{ bg: '#F3E8FF', text: '#7C3AED' },
		]
		const index = name.length % colors.length
		return colors[index]
	}

	const isImageFile = (mimeType: string) => {
		return mimeType.startsWith('image/')
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
								<ArrowLeft size={18} />
							</Link>
							<h1 className={styles.pageTitle}>Proprietario</h1>
						</div>
					</div>
					<div className={styles.errorContainer}>
						<UserX size={48} className={styles.errorIcon} />
						<h2 className={styles.errorTitle}>Proprietario nao encontrado</h2>
						<p className={styles.errorDescription}>
							Este proprietario nao existe ou foi removido.
						</p>
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
	const hasAddress = owner.address || owner.city || owner.state || owner.zipCode
	const hasPersonalInfo = owner.documentType === 'cpf' && (
		owner.rg || owner.nationality || owner.maritalStatus || owner.profession || owner.birthDate
	)

	return (
		<AdminLayout>
			<div className={styles.container}>
				{/* Page Header */}
				<div className={styles.pageHeader}>
					<div className={styles.pageHeaderLeft}>
						<Link to="/property-owners" className={styles.backButton}>
							<ArrowLeft size={18} />
						</Link>
						<h1 className={styles.pageTitle}>Perfil do Proprietario</h1>
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
								<span className={`${styles.badge} ${owner.documentType === 'cpf' ? styles.badgeCpf : styles.badgeCnpj}`}>
									{owner.documentType.toUpperCase()}
								</span>
							</div>
							<p className={styles.document}>{formatDocument(owner.document, owner.documentType)}</p>
							<div className={styles.quickStats}>
								<div className={styles.statItem}>
									<Building2 size={14} className={styles.statIcon} />
									<span className={styles.statValue}>{owner.propertiesCount ?? 0}</span>
									<span>imoveis</span>
								</div>
								{formatDate(owner.createdAt) && (
									<div className={styles.statItem}>
										<Calendar size={14} className={styles.statIcon} />
										<span>Cliente desde</span>
										<span className={styles.statValue}>{formatDate(owner.createdAt)}</span>
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
											{owner.zipCode ? applyMask(owner.zipCode, 'cep') : '-'}
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
									{owner.birthDate && formatDate(owner.birthDate) && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Nascimento</span>
											<span className={styles.infoValue}>{formatDate(owner.birthDate)}</span>
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

						{/* Documents Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>
									<FolderOpen size={16} className={styles.cardTitleIcon} />
									Documentos
								</h3>
								<span className={styles.cardCount}>{documents.length}</span>
							</div>
							{isLoadingDocs ? (
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
													<img src={doc.url} alt={doc.originalName} className={styles.documentImage} />
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
													{DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS] || doc.documentType}
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
							)}
						</div>
					</div>

					<div className={styles.sideColumn}>
						{/* Properties Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>
									<Building2 size={16} className={styles.cardTitleIcon} />
									Imoveis
								</h3>
							</div>
							<div className={styles.propertiesContent}>
								<Building2 size={24} className={styles.propertiesIcon} />
								<span className={styles.propertiesCount}>{owner.propertiesCount ?? 0}</span>
								<span className={styles.propertiesLabel}>
									{owner.propertiesCount === 1 ? 'imovel vinculado' : 'imoveis vinculados'}
								</span>
							</div>
							{owner.propertiesCount && owner.propertiesCount > 0 && (
								<Link to={`/properties?ownerId=${id}`} className={styles.viewAllLink}>
									Ver imoveis
									<ChevronRight size={14} />
								</Link>
							)}
						</div>

						{/* Metadata Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>
									<Clock size={16} className={styles.cardTitleIcon} />
									Registro
								</h3>
							</div>
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
