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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('pt-BR')
	}

	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
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
					<Skeleton width="150px" height="20px" />
					<div className={styles.loadingContainer}>
						<div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
							<Skeleton width="120px" height="120px" borderRadius="50%" />
							<div style={{ flex: 1 }}>
								<Skeleton width="60%" height="32px" />
								<div style={{ marginTop: '8px' }}>
									<Skeleton width="40%" height="20px" />
								</div>
								<div style={{ marginTop: '16px', display: 'flex', gap: '24px' }}>
									<Skeleton width="100px" height="20px" />
									<Skeleton width="100px" height="20px" />
								</div>
							</div>
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', marginTop: '32px' }}>
							<div>
								<Skeleton width="100%" height="200px" borderRadius="16px" />
								<div style={{ marginTop: '24px' }}>
									<Skeleton width="100%" height="150px" borderRadius="16px" />
								</div>
							</div>
							<Skeleton width="100%" height="300px" borderRadius="16px" />
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
					<Link to="/property-owners" className={styles.backLink}>
						<ArrowLeft size={16} />
						Voltar para Proprietarios
					</Link>
					<div className={styles.errorContainer}>
						<UserX size={64} className={styles.errorIcon} />
						<h2 className={styles.errorTitle}>Proprietario nao encontrado</h2>
						<p className={styles.errorDescription}>
							O proprietario que voce esta procurando nao existe ou foi removido.
						</p>
						<Button variant="primary" onClick={() => navigate('/property-owners')}>
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
				<Link to="/property-owners" className={styles.backLink}>
					<ArrowLeft size={16} />
					Voltar para Proprietarios
				</Link>

				{/* Header */}
				<div className={styles.header}>
					<div className={styles.headerMain}>
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

						<div className={styles.headerInfo}>
							<div className={styles.nameRow}>
								<h1 className={styles.name}>{owner.name}</h1>
								<span className={`${styles.badge} ${owner.documentType === 'cpf' ? styles.badgeCpf : styles.badgeCnpj}`}>
									{owner.documentType.toUpperCase()}
								</span>
							</div>
							<p className={styles.document}>
								{formatDocument(owner.document, owner.documentType)}
							</p>
							<div className={styles.quickStats}>
								<div className={styles.statItem}>
									<Building2 size={16} className={styles.statIcon} />
									<span className={styles.statValue}>{owner.propertiesCount ?? 0}</span>
									<span>imoveis</span>
								</div>
								<div className={styles.statItem}>
									<Calendar size={16} className={styles.statIcon} />
									<span>Desde</span>
									<span className={styles.statValue}>{formatDate(owner.createdAt)}</span>
								</div>
							</div>
						</div>
					</div>

					<div className={styles.headerActions}>
						<Button variant="outline" onClick={handleEdit}>
							<Edit size={18} />
							Editar
						</Button>
						<Button variant="danger" onClick={() => setIsDeleteDialogOpen(true)}>
							<Trash2 size={18} />
							Excluir
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className={styles.content}>
					<div className={styles.mainColumn}>
						{/* Contact Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h2 className={styles.cardTitle}>
									<Phone size={20} className={styles.cardTitleIcon} />
									Informacoes de Contato
								</h2>
							</div>
							<div className={styles.contactGrid}>
								<div className={styles.contactItem}>
									<div className={styles.contactIconWrapper}>
										<Phone size={20} />
									</div>
									<div className={styles.contactInfo}>
										<span className={styles.contactLabel}>Telefone Principal</span>
										{owner.phone ? (
											<a href={`tel:${owner.phone}`} className={styles.contactValue} style={{ textDecoration: 'none', color: 'inherit' }}>
												{formatPhone(owner.phone)}
											</a>
										) : (
											<span className={styles.contactValueMuted}>Nao informado</span>
										)}
									</div>
								</div>

								<div className={styles.contactItem}>
									<div className={styles.contactIconWrapper}>
										<Phone size={20} />
									</div>
									<div className={styles.contactInfo}>
										<span className={styles.contactLabel}>Telefone Secundario</span>
										{owner.phoneSecondary ? (
											<a href={`tel:${owner.phoneSecondary}`} className={styles.contactValue} style={{ textDecoration: 'none', color: 'inherit' }}>
												{formatPhone(owner.phoneSecondary)}
											</a>
										) : (
											<span className={styles.contactValueMuted}>Nao informado</span>
										)}
									</div>
								</div>

								<div className={`${styles.contactItem} ${styles.contactItemClickable}`} style={{ gridColumn: 'span 2' }}>
									<div className={styles.contactIconWrapper} style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
										<Mail size={20} />
									</div>
									<div className={styles.contactInfo}>
										<span className={styles.contactLabel}>Email</span>
										{owner.email ? (
											<a href={`mailto:${owner.email}`} className={styles.contactValue} style={{ textDecoration: 'none', color: 'inherit' }}>
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
									<h2 className={styles.cardTitle}>
										<MapPin size={20} className={styles.cardTitleIcon} />
										Endereco
									</h2>
								</div>
								<div className={styles.addressContent}>
									<div className={styles.addressMain}>
										<div className={styles.addressIconWrapper}>
											<MapPin size={24} />
										</div>
										<div className={styles.addressInfo}>
											<p className={styles.addressLine}>
												{owner.address && (
													<>
														{owner.address}
														{owner.addressNumber && `, ${owner.addressNumber}`}
														{owner.addressComplement && ` - ${owner.addressComplement}`}
													</>
												)}
												{!owner.address && 'Endereco nao informado'}
											</p>
											{owner.neighborhood && (
												<p className={styles.addressSecondary}>{owner.neighborhood}</p>
											)}
										</div>
									</div>
									<div className={styles.addressGrid}>
										<div className={styles.addressGridItem}>
											<span className={styles.addressGridLabel}>Cidade</span>
											<span className={styles.addressGridValue}>{owner.city || '-'}</span>
										</div>
										<div className={styles.addressGridItem}>
											<span className={styles.addressGridLabel}>Estado</span>
											<span className={styles.addressGridValue}>{owner.state || '-'}</span>
										</div>
										<div className={styles.addressGridItem}>
											<span className={styles.addressGridLabel}>CEP</span>
											<span className={styles.addressGridValue}>
												{owner.zipCode ? applyMask(owner.zipCode, 'cep') : '-'}
											</span>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Personal Info Card (CPF only) */}
						{hasPersonalInfo && (
							<div className={styles.card}>
								<div className={styles.cardHeader}>
									<h2 className={styles.cardTitle}>
										<User size={20} className={styles.cardTitleIcon} />
										Dados Pessoais
									</h2>
								</div>
								<div className={styles.personalGrid}>
									{owner.rg && (
										<div className={styles.personalItem}>
											<span className={styles.personalLabel}>RG</span>
											<span className={styles.personalValue}>{owner.rg}</span>
										</div>
									)}
									{owner.birthDate && (
										<div className={styles.personalItem}>
											<span className={styles.personalLabel}>Data de Nascimento</span>
											<span className={styles.personalValue}>{formatDate(owner.birthDate)}</span>
										</div>
									)}
									{owner.nationality && (
										<div className={styles.personalItem}>
											<span className={styles.personalLabel}>Nacionalidade</span>
											<span className={styles.personalValue}>{owner.nationality}</span>
										</div>
									)}
									{owner.maritalStatus && (
										<div className={styles.personalItem}>
											<span className={styles.personalLabel}>Estado Civil</span>
											<span className={styles.personalValue}>
												{MARITAL_STATUS_LABELS[owner.maritalStatus] || owner.maritalStatus}
											</span>
										</div>
									)}
									{owner.profession && (
										<div className={styles.personalItem}>
											<span className={styles.personalLabel}>Profissao</span>
											<span className={styles.personalValue}>{owner.profession}</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Documents Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h2 className={styles.cardTitle}>
									<FolderOpen size={20} className={styles.cardTitleIcon} />
									Documentos
								</h2>
								<span className={styles.cardCount}>{documents.length}</span>
							</div>
							{isLoadingDocs ? (
								<div className={styles.documentsGrid}>
									<Skeleton width="100%" height="200px" borderRadius="12px" />
									<Skeleton width="100%" height="200px" borderRadius="12px" />
									<Skeleton width="100%" height="200px" borderRadius="12px" />
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
														<FileText size={32} />
													</div>
												)}
												<div className={styles.documentOverlay}>
													<a
														href={doc.url}
														target="_blank"
														rel="noopener noreferrer"
														className={styles.documentAction}
														title="Abrir em nova aba"
													>
														<ExternalLink size={18} />
													</a>
													<a
														href={doc.url}
														download={doc.originalName}
														className={styles.documentAction}
														title="Baixar documento"
													>
														<Download size={18} />
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
								<div className={styles.emptyDocuments}>
									<FolderOpen size={48} className={styles.emptyDocumentsIcon} />
									<p className={styles.emptyDocumentsText}>Nenhum documento anexado</p>
								</div>
							)}
						</div>

						{/* Notes Card */}
						{owner.notes && (
							<div className={styles.card}>
								<div className={styles.cardHeader}>
									<h2 className={styles.cardTitle}>
										<FileText size={20} className={styles.cardTitleIcon} />
										Observacoes
									</h2>
								</div>
								<div className={styles.notesContent}>{owner.notes}</div>
							</div>
						)}
					</div>

					<div className={styles.sideColumn}>
						{/* Properties Card */}
						<div className={styles.card}>
							<div className={styles.cardHeader}>
								<h2 className={styles.cardTitle}>
									<Building2 size={20} className={styles.cardTitleIcon} />
									Imoveis
								</h2>
								<span className={styles.cardCount}>{owner.propertiesCount ?? 0}</span>
							</div>
							{owner.propertiesCount && owner.propertiesCount > 0 ? (
								<>
									<div className={styles.propertiesList}>
										{/* Placeholder for properties - would need to fetch actual properties */}
										<div className={styles.emptyProperties}>
											<Building2 size={32} />
											<p style={{ margin: 0, fontSize: '14px' }}>
												{owner.propertiesCount} {owner.propertiesCount === 1 ? 'imovel vinculado' : 'imoveis vinculados'}
											</p>
										</div>
									</div>
									<Link to={`/properties?ownerId=${id}`} className={styles.viewAllLink}>
										Ver todos os imoveis
										<ChevronRight size={16} />
									</Link>
								</>
							) : (
								<div className={styles.emptyProperties}>
									<Building2 size={40} />
									<p style={{ margin: 0, fontSize: '14px' }}>Nenhum imovel vinculado</p>
								</div>
							)}
						</div>

						{/* Metadata Card */}
						<div className={styles.metadataCard}>
							<div className={styles.metadataGrid}>
								<div className={styles.metadataItem}>
									<Calendar size={16} className={styles.metadataIcon} />
									<div className={styles.metadataInfo}>
										<span className={styles.metadataLabel}>Cadastrado em</span>
										<span className={styles.metadataValue}>{formatDateTime(owner.createdAt)}</span>
									</div>
								</div>
								{owner.updatedAt && (
									<div className={styles.metadataItem}>
										<Clock size={16} className={styles.metadataIcon} />
										<div className={styles.metadataInfo}>
											<span className={styles.metadataLabel}>Atualizado em</span>
											<span className={styles.metadataValue}>{formatDateTime(owner.updatedAt)}</span>
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
