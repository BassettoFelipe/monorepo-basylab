import {
	AlignLeft,
	Calendar,
	CheckCircle,
	CheckSquare,
	Download,
	File,
	FileText,
	Hash,
	Image,
	List,
	Mail,
	Paperclip,
	Phone,
	Type,
	XCircle,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar/Avatar'
import { Modal } from '@/components/Modal/Modal'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { useUserCustomFieldsQuery } from '@/queries/custom-fields/useUserCustomFieldsQuery'
import { type CustomFieldWithValue, FIELD_TYPES, type FieldType } from '@/types/custom-field.types'
import type { UploadedFile } from '@/types/document.types'
import * as styles from '../ViewUserFieldsModal.styles.css'

const formatDate = (dateString: string): string => {
	try {
		const date = new Date(dateString)
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		})
	} catch {
		return dateString
	}
}

const formatPhone = (phone: string): string => {
	const digits = phone.replace(/\D/g, '')
	if (digits.length === 11) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
	}
	if (digits.length === 10) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
	}
	return phone
}

const getFieldTypeIcon = (type: FieldType) => {
	const iconProps = { size: 14 }
	switch (type) {
		case FIELD_TYPES.TEXT:
			return <Type {...iconProps} />
		case FIELD_TYPES.TEXTAREA:
			return <AlignLeft {...iconProps} />
		case FIELD_TYPES.NUMBER:
			return <Hash {...iconProps} />
		case FIELD_TYPES.EMAIL:
			return <Mail {...iconProps} />
		case FIELD_TYPES.PHONE:
			return <Phone {...iconProps} />
		case FIELD_TYPES.DATE:
			return <Calendar {...iconProps} />
		case FIELD_TYPES.SELECT:
			return <List {...iconProps} />
		case FIELD_TYPES.CHECKBOX:
			return <CheckSquare {...iconProps} />
		case FIELD_TYPES.FILE:
			return <Paperclip {...iconProps} />
		default:
			return <Type {...iconProps} />
	}
}

const getFieldTypeLabel = (type: FieldType): string => {
	switch (type) {
		case FIELD_TYPES.TEXT:
			return 'Texto'
		case FIELD_TYPES.TEXTAREA:
			return 'Texto longo'
		case FIELD_TYPES.NUMBER:
			return 'Número'
		case FIELD_TYPES.EMAIL:
			return 'E-mail'
		case FIELD_TYPES.PHONE:
			return 'Telefone'
		case FIELD_TYPES.DATE:
			return 'Data'
		case FIELD_TYPES.SELECT:
			return 'Seleção'
		case FIELD_TYPES.CHECKBOX:
			return 'Confirmação'
		case FIELD_TYPES.FILE:
			return 'Arquivo'
		default:
			return 'Campo'
	}
}

interface ViewUserFieldsModalProps {
	isOpen: boolean
	onClose: () => void
	userId: string | null
}

export function ViewUserFieldsModal({ isOpen, onClose, userId }: ViewUserFieldsModalProps) {
	const { data, isLoading, error } = useUserCustomFieldsQuery(userId)

	const parseFileValue = (value: string | null): UploadedFile[] => {
		if (!value) return []
		try {
			return JSON.parse(value)
		} catch {
			return []
		}
	}

	const getFileIcon = (contentType: string) => {
		if (contentType.startsWith('image/')) {
			return <Image size={16} />
		}
		if (contentType === 'application/pdf') {
			return <FileText size={16} />
		}
		return <File size={16} />
	}

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const renderFieldValue = (field: CustomFieldWithValue) => {
		if (field.type === FIELD_TYPES.FILE) {
			const files = parseFileValue(field.value)
			if (files.length === 0) {
				return <span className={styles.emptyValue}>Nenhum arquivo enviado</span>
			}
			return (
				<div className={styles.filesContainer}>
					{files.map((file) => (
						<a
							key={file.key}
							href={file.url}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.fileItem}
						>
							{file.contentType.startsWith('image/') ? (
								<img src={file.url} alt={file.fileName} className={styles.filePreview} />
							) : (
								<span className={styles.fileIconWrapper}>{getFileIcon(file.contentType)}</span>
							)}
							<div className={styles.fileDetails}>
								<span className={styles.fileName}>{file.fileName}</span>
								<span className={styles.fileSize}>{formatFileSize(file.size)}</span>
							</div>
							<Download size={14} className={styles.downloadIcon} />
						</a>
					))}
				</div>
			)
		}

		if (field.type === FIELD_TYPES.CHECKBOX) {
			return (
				<div
					className={`${styles.checkboxValue} ${field.value === 'true' ? styles.checkboxChecked : styles.checkboxUnchecked}`}
				>
					{field.value === 'true' ? (
						<>
							<CheckCircle size={14} />
							<span>Sim</span>
						</>
					) : (
						<>
							<XCircle size={14} />
							<span>Não</span>
						</>
					)}
				</div>
			)
		}

		if (!field.value) {
			return <span className={styles.emptyValue}>Não preenchido</span>
		}

		// Múltipla seleção - mostrar valores como lista
		if (field.type === FIELD_TYPES.SELECT && field.allowMultiple) {
			try {
				const selectedValues = JSON.parse(field.value) as string[]
				if (selectedValues.length === 0) {
					return <span className={styles.emptyValue}>Nenhuma opção selecionada</span>
				}
				return (
					<div className={styles.multipleValues}>
						{selectedValues.map((val) => (
							<span key={val} className={styles.multipleValueTag}>
								{val}
							</span>
						))}
					</div>
				)
			} catch {
				// Se não for JSON válido, mostra o valor bruto
				return <span className={styles.fieldValue}>{field.value}</span>
			}
		}

		// Formatar valor baseado no tipo
		let formattedValue = field.value

		if (field.type === FIELD_TYPES.DATE) {
			formattedValue = formatDate(field.value)
		} else if (field.type === FIELD_TYPES.PHONE) {
			formattedValue = formatPhone(field.value)
		}

		return <span className={styles.fieldValue}>{formattedValue}</span>
	}

	const displayName = data?.user?.name || 'Usuário'
	const displayEmail = data?.user?.email || ''
	const avatarUrl = data?.user?.avatarUrl || null
	const fields = data?.data || []
	const filledFieldsCount = fields.filter((f) => f.value).length

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Campos Preenchidos" size="xl">
			<div className={styles.content}>
				{isLoading && (
					<div className={styles.loadingContainer}>
						<Skeleton height="60px" width="100%" />
						<Skeleton height="60px" width="100%" />
						<Skeleton height="60px" width="100%" />
					</div>
				)}

				{error && (
					<div className={styles.errorContainer}>
						<p>Erro ao carregar os campos. Tente novamente.</p>
					</div>
				)}

				{!isLoading && !error && fields.length === 0 && (
					<div className={styles.emptyContainer}>
						<p>Nenhum campo customizado configurado.</p>
					</div>
				)}

				{!isLoading && !error && fields.length > 0 && (
					<>
						<div className={styles.summary}>
							<div className={styles.summaryHeader}>
								<Avatar src={avatarUrl} name={displayName} size="medium" />
								<div className={styles.summaryInfo}>
									<span className={styles.summaryTitle}>{displayName}</span>
									<span className={styles.summaryText}>{displayEmail}</span>
								</div>
							</div>
							<div className={styles.progressWrapper}>
								<span className={styles.progressLabel}>
									{filledFieldsCount} de {fields.length} campos
								</span>
								<div className={styles.progressBar}>
									<div
										className={styles.progressFill}
										style={{
											width: `${(filledFieldsCount / fields.length) * 100}%`,
										}}
									/>
								</div>
								<span className={styles.progressPercent}>
									{Math.round((filledFieldsCount / fields.length) * 100)}%
								</span>
							</div>
						</div>

						<div className={styles.fieldsContainer}>
							{fields.map((field) => (
								<div
									key={field.id}
									className={`${styles.fieldCard} ${!field.value ? styles.fieldCardEmpty : ''} ${field.value ? styles.fieldCardFilled : ''}`}
								>
									<div className={styles.fieldHeader}>
										<span className={styles.fieldTypeIcon}>{getFieldTypeIcon(field.type)}</span>
										<div className={styles.fieldLabelInfo}>
											<span className={styles.fieldLabel}>
												{field.label}
												{field.isRequired && <span className={styles.required}>*</span>}
											</span>
											<span className={styles.fieldType}>{getFieldTypeLabel(field.type)}</span>
										</div>
										{!field.isActive && <span className={styles.inactiveBadge}>Inativo</span>}
									</div>
									<div className={styles.fieldValueContainer}>{renderFieldValue(field)}</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</Modal>
	)
}
