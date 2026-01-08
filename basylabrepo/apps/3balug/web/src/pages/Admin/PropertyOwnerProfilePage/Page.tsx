import {
	ArrowLeft,
	Building2,
	Calendar,
	ChevronRight,
	Download,
	Edit,
	ExternalLink,
	FileText,
	FolderOpen,
	Trash2,
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
						<Skeleton width="120px" height="20px" />
						<Skeleton width="160px" height="32px" />
					</div>
					<div className={styles.profileHeader}>
						<Skeleton width="72px" height="72px" borderRadius="50%" />
						<div style={{ flex: 1 }}>
							<Skeleton width="200px" height="24px" />
							<Skeleton width="300px" height="16px" />
						</div>
					</div>
					<div className={styles.content}>
						<div className={styles.mainColumn}>
							<Skeleton width="100%" height="120px" borderRadius="8px" />
							<Skeleton width="100%" height="100px" borderRadius="8px" />
						</div>
						<div className={styles.sideColumn}>
							<Skeleton width="100%" height="140px" borderRadius="8px" />
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
							<span className={styles.pageTitle}>Proprietario</span>
						</div>
					</div>
					<div className={styles.errorContainer}>
						<UserX size={48} className={styles.errorIcon} />
						<h2 className={styles.errorTitle}>Nao encontrado</h2>
						<p className={styles.errorDescription}>
							Este proprietario nao existe ou foi removido.
						</p>
						<Button variant="outline" size="small" onClick={() => navigate('/property-owners')}>
							Voltar
						</Button>
					</div>
				</div>
			</AdminLayout>
		)
	}

	const avatarColor = getAvatarColor(owner.name)
	const documents = documentsData?.data || []

	const hasPersonalInfo = owner.documentType === 'cpf' && (
		owner.rg || owner.nationality || owner.maritalStatus || owner.profession || owner.birthDate
	)

	return (
		<AdminLayout>
			<div className={styles.container}>
				{/* Header */}
				<div className={styles.pageHeader}>
					<div className={styles.pageHeaderLeft}>
						<Link to="/property-owners" className={styles.backButton}>
							<ArrowLeft size={18} />
						</Link>
						<span className={styles.pageTitle}>Proprietario</span>
					</div>
					<div className={styles.pageHeaderRight}>
						<Button variant="outline" size="small" onClick={handleEdit}>
							<Edit size={14} />
							Editar
						</Button>
						<Button variant="danger" size="small" onClick={() => setIsDeleteDialogOpen(true)}>
							<Trash2 size={14} />
						</Button>
					</div>
				</div>

				{/* Profile Header */}
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
					</div>
					<div className={styles.profileInfo}>
						<div className={styles.nameRow}>
							<h1 className={styles.name}>{owner.name}</h1>
							<span className={`${styles.badge} ${owner.documentType === 'cpf' ? styles.badgeCpf : styles.badgeCnpj}`}>
								{owner.documentType.toUpperCase()}
							</span>
						</div>
						<div className={styles.profileMeta}>
							<span className={styles.metaItem}>
								{formatDocument(owner.document, owner.documentType)}
							</span>
							<span className={styles.metaItem}>
								<Building2 size={14} className={styles.metaIcon} />
								{owner.propertiesCount ?? 0} imoveis
							</span>
							{formatDate(owner.createdAt) && (
								<span className={styles.metaItem}>
									<Calendar size={14} className={styles.metaIcon} />
									Desde {formatDate(owner.createdAt)}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Content */}
				<div className={styles.content}>
					<div className={styles.mainColumn}>
						{/* Contact */}
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>Contato</h3>
							<div className={styles.infoGrid}>
								<div className={`${styles.infoItem} ${owner.phone ? styles.infoItemClickable : ''}`}>
									<span className={styles.infoLabel}>Telefone</span>
									{owner.phone ? (
										<a href={`tel:${owner.phone}`} className={styles.infoValueLink}>
											{formatPhone(owner.phone)}
										</a>
									) : (
										<span className={styles.infoValueMuted}>-</span>
									)}
								</div>
								<div className={`${styles.infoItem} ${owner.phoneSecondary ? styles.infoItemClickable : ''}`}>
									<span className={styles.infoLabel}>Telefone 2</span>
									{owner.phoneSecondary ? (
										<a href={`tel:${owner.phoneSecondary}`} className={styles.infoValueLink}>
											{formatPhone(owner.phoneSecondary)}
										</a>
									) : (
										<span className={styles.infoValueMuted}>-</span>
									)}
								</div>
								<div className={`${styles.infoItem} ${owner.email ? styles.infoItemClickable : ''}`} style={{ gridColumn: 'span 2' }}>
									<span className={styles.infoLabel}>Email</span>
									{owner.email ? (
										<a href={`mailto:${owner.email}`} className={styles.infoValueLink}>
											{owner.email}
										</a>
									) : (
										<span className={styles.infoValueMuted}>-</span>
									)}
								</div>
							</div>
						</div>

						{/* Address */}
						{(owner.address || owner.city || owner.state || owner.zipCode) && (
							<div className={styles.section}>
								<h3 className={styles.sectionTitle}>Endereco</h3>
								<div className={styles.infoGridThree}>
									<div className={styles.infoItem} style={{ gridColumn: 'span 3' }}>
										<span className={styles.infoLabel}>Logradouro</span>
										<span className={styles.infoValue}>
											{owner.address ? (
												<>
													{owner.address}
													{owner.addressNumber && `, ${owner.addressNumber}`}
													{owner.addressComplement && ` - ${owner.addressComplement}`}
													{owner.neighborhood && ` - ${owner.neighborhood}`}
												</>
											) : (
												<span className={styles.infoValueMuted}>-</span>
											)}
										</span>
									</div>
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

						{/* Personal Info (CPF only) */}
						{hasPersonalInfo && (
							<div className={styles.section}>
								<h3 className={styles.sectionTitle}>Dados Pessoais</h3>
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

						{/* Notes */}
						{owner.notes && (
							<div className={styles.section}>
								<h3 className={styles.sectionTitle}>Observacoes</h3>
								<div className={styles.notesContent}>{owner.notes}</div>
							</div>
						)}

						{/* Documents */}
						<div className={styles.section}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>Documentos</h3>
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
														<FileText size={24} />
													</div>
												)}
												<div className={styles.documentOverlay}>
													<a
														href={doc.url}
														target="_blank"
														rel="noopener noreferrer"
														className={styles.documentAction}
													>
														<ExternalLink size={14} />
													</a>
													<a
														href={doc.url}
														download={doc.originalName}
														className={styles.documentAction}
													>
														<Download size={14} />
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
									<FolderOpen size={24} />
									<p className={styles.emptyStateText}>Nenhum documento</p>
								</div>
							)}
						</div>
					</div>

					<div className={styles.sideColumn}>
						{/* Properties */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>Imoveis</h3>
								<span className={styles.cardCount}>{owner.propertiesCount ?? 0}</span>
							</div>
							{owner.propertiesCount && owner.propertiesCount > 0 ? (
								<>
									<div className={styles.propertiesEmpty}>
										<Building2 size={18} />
										{owner.propertiesCount} {owner.propertiesCount === 1 ? 'imovel' : 'imoveis'}
									</div>
									<Link to={`/properties?ownerId=${id}`} className={styles.viewAllLink}>
										Ver imoveis
										<ChevronRight size={14} />
									</Link>
								</>
							) : (
								<div className={styles.propertiesEmpty}>
									<Building2 size={18} />
									Nenhum imovel
								</div>
							)}
						</div>

						{/* Metadata */}
						<div className={styles.card}>
							<h3 className={styles.cardTitle} style={{ marginBottom: '12px' }}>Registro</h3>
							<div className={styles.metadataList}>
								{formatDate(owner.createdAt) && (
									<div className={styles.metadataItem}>
										<span>Criado em</span>
										<span className={styles.metadataValue}>{formatDate(owner.createdAt)}</span>
									</div>
								)}
								{owner.updatedAt && formatDate(owner.updatedAt) && (
									<div className={styles.metadataItem}>
										<span>Atualizado</span>
										<span className={styles.metadataValue}>{formatDate(owner.updatedAt)}</span>
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
				description={`Tem certeza que deseja excluir <strong>${owner.name}</strong>?`}
				confirmText="Excluir"
				cancelText="Cancelar"
				isLoading={deleteMutation.isPending}
				variant="danger"
			/>
		</AdminLayout>
	)
}
