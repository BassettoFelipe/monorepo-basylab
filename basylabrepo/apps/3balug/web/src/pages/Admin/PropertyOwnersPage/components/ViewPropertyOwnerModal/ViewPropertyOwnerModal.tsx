import { Calendar, ExternalLink, FileText, Mail, MapPin, Phone, User } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { Modal } from '@/components/Modal/Modal'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { useDocumentsQuery } from '@/queries/documents/documents.queries'
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_TYPE_LABELS } from '@/types/document.types'
import type { PropertyOwner } from '@/types/property-owner.types'
import { applyMask } from '@/utils/masks'
import * as styles from '../ViewPropertyOwnerModal.styles.css'

interface ViewPropertyOwnerModalProps {
	isOpen: boolean
	onClose: () => void
	propertyOwner: PropertyOwner | null
	onEdit?: () => void
	isLoading?: boolean
}

function ViewSkeleton() {
	return (
		<div className={styles.container}>
			{/* Header skeleton */}
			<div className={styles.header}>
				<Skeleton width={64} height={64} borderRadius="50%" />
				<div
					className={styles.headerInfo}
					style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
				>
					<Skeleton width={200} height={24} />
					<Skeleton width={150} height={20} />
				</div>
			</div>

			{/* Contato skeleton */}
			<div className={styles.section}>
				<Skeleton width={80} height={16} />
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<Skeleton width={18} height={18} borderRadius={4} />
						<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
							<Skeleton width={60} height={12} />
							<Skeleton width={120} height={16} />
						</div>
					</div>
					<div className={styles.infoItem}>
						<Skeleton width={18} height={18} borderRadius={4} />
						<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
							<Skeleton width={60} height={12} />
							<Skeleton width={180} height={16} />
						</div>
					</div>
				</div>
			</div>

			{/* Endereco skeleton */}
			<div className={styles.section}>
				<Skeleton width={80} height={16} />
				<div className={styles.infoItem}>
					<Skeleton width={18} height={18} borderRadius={4} />
					<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<Skeleton width={250} height={16} />
						<Skeleton width={150} height={16} />
					</div>
				</div>
			</div>

			{/* Documentos skeleton */}
			<div className={styles.section}>
				<Skeleton width={100} height={16} />
				<div className={styles.documentsGrid}>
					<Skeleton width="100%" height={140} borderRadius={8} />
					<Skeleton width="100%" height={140} borderRadius={8} />
				</div>
			</div>

			{/* Metadados skeleton */}
			<div className={styles.metadata}>
				<Skeleton width={180} height={14} />
			</div>
		</div>
	)
}

export function ViewPropertyOwnerModal({
	isOpen,
	onClose,
	propertyOwner,
	onEdit,
	isLoading = false,
}: ViewPropertyOwnerModalProps) {
	const { data: documentsData, isLoading: isLoadingDocs } = useDocumentsQuery(
		DOCUMENT_ENTITY_TYPES.PROPERTY_OWNER,
		propertyOwner?.id || '',
		{ enabled: isOpen && !!propertyOwner?.id },
	)

	const formatDocument = (doc: string, type: 'cpf' | 'cnpj') => {
		return applyMask(doc, type)
	}

	const formatPhone = (phone: string) => {
		return applyMask(phone, 'phone')
	}

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('pt-BR')
	}

	const isImageFile = (mimeType: string) => {
		return mimeType.startsWith('image/')
	}

	const showSkeleton = isLoading || !propertyOwner

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Detalhes do Proprietario"
			size="xl"
			footer={
				<>
					<Button variant="outline" onClick={onClose}>
						Fechar
					</Button>
					{!showSkeleton && onEdit && (
						<Button variant="primary" onClick={onEdit}>
							Editar
						</Button>
					)}
				</>
			}
		>
			{showSkeleton ? (
				<ViewSkeleton />
			) : (
				<div className={styles.container}>
					{/* Header com avatar e info principal */}
					<div className={styles.header}>
						<div className={styles.avatar}>
							<User size={32} />
						</div>
						<div className={styles.headerInfo}>
							<h2 className={styles.name}>{propertyOwner.name}</h2>
							<div className={styles.badges}>
								<span
									className={`${styles.badge} ${
										propertyOwner.documentType === 'cpf' ? styles.badgeCpf : styles.badgeCnpj
									}`}
								>
									{propertyOwner.documentType.toUpperCase()}
								</span>
								<span className={styles.document}>
									{formatDocument(propertyOwner.document, propertyOwner.documentType)}
								</span>
							</div>
						</div>
					</div>

					{/* Informacoes de contato */}
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>Contato</h3>
						<div className={styles.infoGrid}>
							{propertyOwner.phone && (
								<div className={styles.infoItem}>
									<Phone size={18} className={styles.infoIcon} />
									<div>
										<span className={styles.infoLabel}>Telefone</span>
										<span className={styles.infoValue}>{formatPhone(propertyOwner.phone)}</span>
									</div>
								</div>
							)}
							{propertyOwner.email && (
								<div className={styles.infoItem}>
									<Mail size={18} className={styles.infoIcon} />
									<div>
										<span className={styles.infoLabel}>Email</span>
										<span className={styles.infoValue}>{propertyOwner.email}</span>
									</div>
								</div>
							)}
							{propertyOwner.birthDate && (
								<div className={styles.infoItem}>
									<Calendar size={18} className={styles.infoIcon} />
									<div>
										<span className={styles.infoLabel}>Data de Nascimento</span>
										<span className={styles.infoValue}>{formatDate(propertyOwner.birthDate)}</span>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Endereco */}
					{(propertyOwner.address ||
						propertyOwner.city ||
						propertyOwner.state ||
						propertyOwner.zipCode) && (
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>Endereco</h3>
							<div className={styles.infoItem}>
								<MapPin size={18} className={styles.infoIcon} />
								<div>
									<span className={styles.infoValue}>
										{propertyOwner.address && (
											<>
												{propertyOwner.address}
												<br />
											</>
										)}
										{propertyOwner.city && propertyOwner.state && (
											<>
												{propertyOwner.city}/{propertyOwner.state}
											</>
										)}
										{propertyOwner.zipCode && (
											<> - CEP: {applyMask(propertyOwner.zipCode, 'cep')}</>
										)}
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Documentos */}
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>Documentos ({documentsData?.data?.length || 0})</h3>
						{isLoadingDocs ? (
							<div className={styles.documentsGrid}>
								<Skeleton width="100%" height={140} />
								<Skeleton width="100%" height={140} />
							</div>
						) : documentsData?.data && documentsData.data.length > 0 ? (
							<div className={styles.documentsGrid}>
								{documentsData.data.map((doc) => (
									<div key={doc.id} className={styles.documentCard}>
										{isImageFile(doc.mimeType) ? (
											<div className={styles.documentPreview}>
												<img
													src={doc.url}
													alt={doc.originalName}
													className={styles.documentImage}
												/>
											</div>
										) : (
											<div className={styles.documentIconWrapper}>
												<FileText size={24} />
											</div>
										)}
										<div className={styles.documentInfo}>
											<span className={styles.documentName} title={doc.originalName}>
												{doc.originalName}
											</span>
											<span className={styles.documentType}>
												{DOCUMENT_TYPE_LABELS[
													doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS
												] || doc.documentType}
											</span>
										</div>
										<a
											href={doc.url}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.documentLink}
											title="Abrir documento"
										>
											<ExternalLink size={16} />
										</a>
									</div>
								))}
							</div>
						) : (
							<p className={styles.emptyText}>Nenhum documento anexado</p>
						)}
					</div>

					{/* Observacoes */}
					{propertyOwner.notes && (
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>Observacoes</h3>
							<p className={styles.notes}>{propertyOwner.notes}</p>
						</div>
					)}

					{/* Metadados */}
					<div className={styles.metadata}>
						<span>Cadastrado em: {formatDate(propertyOwner.createdAt)}</span>
						{propertyOwner.updatedAt && (
							<span>Atualizado em: {formatDate(propertyOwner.updatedAt)}</span>
						)}
					</div>
				</div>
			)}
		</Modal>
	)
}
