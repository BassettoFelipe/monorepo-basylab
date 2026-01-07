import { zodResolver } from '@hookform/resolvers/zod'
import {
	Building2,
	Calendar,
	Camera,
	Check,
	Clock,
	CreditCard,
	FileText,
	Info,
	Mail,
	Trash2,
	User as UserIcon,
	Users,
	X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { Avatar } from '@/components/Avatar/Avatar'
import { Button } from '@/components/Button/Button'
import {
	type ExistingFile,
	FileUploadLocal,
	type LocalFile,
} from '@/components/FileUploadLocal/FileUploadLocal'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useUser } from '@/queries/auth/useUser'
import { useDeleteAvatarMutation } from '@/queries/avatar/useDeleteAvatarMutation'
import { useUploadAvatarMutation } from '@/queries/avatar/useUploadAvatarMutation'
import { useCompanyQuery } from '@/queries/company/useCompanyQuery'
import { useUpdateCompanyMutation } from '@/queries/company/useUpdateCompanyMutation'
import { useMyCustomFieldsQuery } from '@/queries/custom-fields/useMyCustomFieldsQuery'
import { useSaveMyCustomFieldsMutation } from '@/queries/custom-fields/useSaveMyCustomFieldsMutation'
import { uploadWithPresignedUrl } from '@/services/files/upload'
import { FIELD_TYPES } from '@/types/custom-field.types'
import * as styles from './styles.css'

const companySchema = z.object({
	companyName: z
		.string()
		.min(1, 'Nome da empresa é obrigatório')
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no máximo 100 caracteres'),
})

type CompanyFormData = z.infer<typeof companySchema>

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

function getRoleLabel(role: string): string {
	const roles: Record<string, string> = {
		broker: 'Corretor',
		manager: 'Gerente',
		insurance_analyst: 'Analista de Seguros',
		owner: 'Proprietário',
		admin: 'Administrador',
	}
	return roles[role] || role
}

function getStatusLabel(status: string): string {
	const statuses: Record<string, string> = {
		active: 'Ativa',
		pending: 'Pendente',
		canceled: 'Cancelada',
		expired: 'Expirada',
	}
	return statuses[status] || status
}

function getStatusStyle(status: string): string {
	switch (status) {
		case 'active':
			return styles.statusActive
		case 'pending':
			return styles.statusPending
		default:
			return styles.statusInactive
	}
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value / 100)
}

function formatDate(date: string): string {
	return new Date(date).toLocaleDateString('pt-BR')
}

export function MyProfilePage() {
	const { user, isLoading } = useUser()
	const { data: company, isLoading: isLoadingCompany } = useCompanyQuery()
	const { data: customFieldsData, isLoading: isLoadingCustomFields } = useMyCustomFieldsQuery()
	const updateCompanyMutation = useUpdateCompanyMutation()
	const uploadAvatarMutation = useUploadAvatarMutation()
	const deleteAvatarMutation = useDeleteAvatarMutation()
	const saveCustomFieldsMutation = useSaveMyCustomFieldsMutation()
	const [isEditingCompany, setIsEditingCompany] = useState(false)
	const [isEditingCustomFields, setIsEditingCustomFields] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Custom fields state
	const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
	const [fieldFiles, setFieldFiles] = useState<Record<string, LocalFile[]>>({})
	const [existingFieldFiles, setExistingFieldFiles] = useState<Record<string, ExistingFile[]>>({})
	const [isUploading, setIsUploading] = useState(false)
	const [customFieldsInitialized, setCustomFieldsInitialized] = useState(false)

	const customFields = customFieldsData?.data || []

	// Inicializar valores dos campos quando carregarem
	useEffect(() => {
		if (customFields.length > 0 && !customFieldsInitialized) {
			const initialValues: Record<string, string> = {}
			const initialExistingFiles: Record<string, ExistingFile[]> = {}

			for (const field of customFields) {
				if (field.type === FIELD_TYPES.FILE && field.value) {
					try {
						const parsed = JSON.parse(field.value)
						if (Array.isArray(parsed)) {
							initialExistingFiles[field.id] = parsed.map(
								(f: { url: string; fileName: string; key: string }, idx: number) => ({
									url: f.url,
									name: f.fileName,
									id: f.key || `existing-${idx}`,
								}),
							)
						}
					} catch {
						// Ignore parsing errors
					}
					initialValues[field.id] = ''
				} else {
					initialValues[field.id] = field.value || ''
				}
			}

			setFieldValues(initialValues)
			setExistingFieldFiles(initialExistingFiles)
			setCustomFieldsInitialized(true)
		}
	}, [customFields, customFieldsInitialized])

	// Calcular progresso dos campos personalizados (todos os campos, não apenas obrigatórios)
	const customFieldsProgress = useMemo(() => {
		let completed = 0
		const total = customFields.length

		for (const field of customFields) {
			if (field.type === FIELD_TYPES.FILE) {
				const hasNewFiles = fieldFiles[field.id]?.length > 0
				const hasExistingFiles = existingFieldFiles[field.id]?.length > 0
				if (hasNewFiles || hasExistingFiles) completed++
			} else if (field.type === FIELD_TYPES.SELECT && field.allowMultiple) {
				// Para múltipla seleção, verificar se pelo menos uma opção foi selecionada
				const value = fieldValues[field.id]
				if (value) {
					try {
						const selectedValues = JSON.parse(value) as string[]
						if (selectedValues.length > 0) completed++
					} catch {
						// Ignora erros de parse
					}
				}
			} else {
				if (fieldValues[field.id]?.trim()) completed++
			}
		}

		return { completed, total }
	}, [customFields, fieldValues, fieldFiles, existingFieldFiles])

	const isAvatarLoading = uploadAvatarMutation.isPending || deleteAvatarMutation.isPending

	const {
		register: registerCompany,
		handleSubmit: handleSubmitCompany,
		formState: { errors: companyErrors },
		reset: resetCompany,
	} = useForm<CompanyFormData>({
		resolver: zodResolver(companySchema),
		values: {
			companyName: company?.name || '',
		},
	})

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		if (!ACCEPTED_TYPES.includes(file.type)) {
			alert('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.')
			return
		}

		if (file.size > MAX_SIZE) {
			alert('Arquivo muito grande. O tamanho máximo é 10MB.')
			return
		}

		uploadAvatarMutation.mutate(file)

		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleDeleteAvatar = () => {
		if (!user?.avatarUrl) return
		deleteAvatarMutation.mutate()
	}

	const onSubmitCompany = async (data: CompanyFormData) => {
		try {
			const response = await updateCompanyMutation.mutateAsync({
				name: data.companyName,
			})
			toast.success(response.message || 'Empresa atualizada com sucesso!')
			setIsEditingCompany(false)
		} catch (error: unknown) {
			const errorMessage =
				error && typeof error === 'object' && 'message' in error
					? String(error.message)
					: 'Erro ao atualizar empresa'
			toast.error(errorMessage)
		}
	}

	const handleCancelEdit = () => {
		resetCompany()
		setIsEditingCompany(false)
	}

	// Custom fields handlers
	const handleCustomFieldChange = (fieldId: string, value: string) => {
		setFieldValues((prev) => ({ ...prev, [fieldId]: value }))
	}

	const handleCustomFileChange = (fieldId: string, files: LocalFile[]) => {
		setFieldFiles((prev) => ({ ...prev, [fieldId]: files }))
	}

	const handleRemoveExistingFile = (fieldId: string, file: ExistingFile) => {
		setExistingFieldFiles((prev) => ({
			...prev,
			[fieldId]: (prev[fieldId] || []).filter((f) => f.id !== file.id),
		}))
	}

	const handleCancelCustomFieldsEdit = () => {
		// Reset to original values
		const initialValues: Record<string, string> = {}
		const initialExistingFiles: Record<string, ExistingFile[]> = {}

		for (const field of customFields) {
			if (field.type === FIELD_TYPES.FILE && field.value) {
				try {
					const parsed = JSON.parse(field.value)
					if (Array.isArray(parsed)) {
						initialExistingFiles[field.id] = parsed.map(
							(f: { url: string; fileName: string; key: string }, idx: number) => ({
								url: f.url,
								name: f.fileName,
								id: f.key || `existing-${idx}`,
							}),
						)
					}
				} catch {
					// Ignore
				}
				initialValues[field.id] = ''
			} else {
				initialValues[field.id] = field.value || ''
			}
		}

		setFieldValues(initialValues)
		setFieldFiles({})
		setExistingFieldFiles(initialExistingFiles)
		setIsEditingCustomFields(false)
	}

	const handleSaveCustomFields = async () => {
		try {
			setIsUploading(true)

			// Coletar todos os uploads necessários
			const uploadTasks: Array<{
				fieldId: string
				file: File
				maxFileSize: number
				allowedTypes: string[]
			}> = []

			for (const field of customFields) {
				if (field.type === FIELD_TYPES.FILE) {
					const localFiles = fieldFiles[field.id] || []
					for (const localFile of localFiles) {
						uploadTasks.push({
							fieldId: field.id,
							file: localFile.file,
							maxFileSize: field.fileConfig?.maxFileSize || 5,
							allowedTypes: field.fileConfig?.allowedTypes || [],
						})
					}
				}
			}

			// Fazer uploads em paralelo
			const uploadResults = await Promise.all(
				uploadTasks.map((task) =>
					uploadWithPresignedUrl({
						file: task.file,
						fieldId: task.fieldId,
						maxFileSize: task.maxFileSize,
						allowedTypes: task.allowedTypes,
					}).then((result) => ({
						fieldId: task.fieldId,
						...result,
					})),
				),
			)

			// Agrupar resultados por fieldId
			const uploadedFiles: Record<
				string,
				Array<{
					url: string
					key: string
					fileName: string
					size: number
					contentType: string
				}>
			> = {}

			for (const result of uploadResults) {
				if (!uploadedFiles[result.fieldId]) {
					uploadedFiles[result.fieldId] = []
				}
				uploadedFiles[result.fieldId].push({
					url: result.url,
					key: result.key,
					fileName: result.fileName,
					size: result.size,
					contentType: result.contentType,
				})
			}

			// Preparar dados para salvar
			const fieldsToSave = customFields.map((field) => {
				if (field.type === FIELD_TYPES.FILE) {
					const newFiles = uploadedFiles[field.id] || []
					const existing = existingFieldFiles[field.id] || []

					const existingFormatted = existing.map((ef) => ({
						url: ef.url,
						key: ef.id,
						fileName: ef.name,
						size: 0,
						contentType: '',
					}))

					const allFiles = [...existingFormatted, ...newFiles]
					return {
						fieldId: field.id,
						value: allFiles.length > 0 ? JSON.stringify(allFiles) : null,
					}
				}
				return {
					fieldId: field.id,
					value: fieldValues[field.id] || null,
				}
			})

			await saveCustomFieldsMutation.mutateAsync({ fields: fieldsToSave })
			toast.success('Informações atualizadas com sucesso!')

			const newExistingFiles: Record<string, ExistingFile[]> = {}
			for (const field of customFields) {
				if (field.type === FIELD_TYPES.FILE) {
					const newFiles = uploadedFiles[field.id] || []
					const existing = existingFieldFiles[field.id] || []

					// Converter novos uploads para o formato ExistingFile
					const newAsExisting = newFiles.map((f) => ({
						url: f.url,
						name: f.fileName,
						id: f.key,
					}))

					newExistingFiles[field.id] = [...existing, ...newAsExisting]
				}
			}

			setExistingFieldFiles((prev) => ({ ...prev, ...newExistingFiles }))
			setFieldFiles({})
			setIsEditingCustomFields(false)
		} catch (err) {
			const errorMessage =
				err && typeof err === 'object' && 'message' in err
					? String(err.message)
					: 'Erro ao salvar informações'
			toast.error(errorMessage)
		} finally {
			setIsUploading(false)
		}
	}

	const renderCustomField = (field: (typeof customFields)[0]) => {
		const value = fieldValues[field.id] || ''
		const isDisabled = !isEditingCustomFields || saveCustomFieldsMutation.isPending || isUploading

		switch (field.type) {
			case FIELD_TYPES.SELECT:
				if (field.allowMultiple) {
					// Múltipla seleção - renderiza checkboxes
					const selectedValues: string[] = value
						? (() => {
								try {
									return JSON.parse(value)
								} catch {
									return []
								}
							})()
						: []

					const handleMultipleChange = (opt: string, checked: boolean) => {
						let newValues: string[]
						if (checked) {
							newValues = [...selectedValues, opt]
						} else {
							newValues = selectedValues.filter((v) => v !== opt)
						}
						handleCustomFieldChange(field.id, JSON.stringify(newValues))
					}

					return (
						<div key={field.id} className={styles.customFieldWrapper} role="group" aria-labelledby={`field-label-${field.id}`}>
							<span id={`field-label-${field.id}`} className={styles.customFieldLabel}>
								{field.label}
								{field.isRequired && ' *'}
							</span>
							<div className={styles.checkboxGroupOptions}>
								{(field.options || []).map((opt) => (
									<label key={opt} className={styles.checkboxWrapper}>
										<input
											type="checkbox"
											className={styles.checkboxInput}
											checked={selectedValues.includes(opt)}
											onChange={(e) => handleMultipleChange(opt, e.target.checked)}
											disabled={isDisabled}
										/>
										<span className={styles.checkboxLabel}>{opt}</span>
									</label>
								))}
							</div>
						</div>
					)
				}

				// Seleção única - renderiza select normal
				return (
					<Select
						key={field.id}
						value={value}
						onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
						label={`${field.label}${field.isRequired ? ' *' : ''}`}
						fullWidth
						disabled={isDisabled}
						options={(field.options || []).map((opt) => ({
							value: opt,
							label: opt,
						}))}
						placeholder={field.placeholder || `Selecione ${field.label}`}
					/>
				)

			case FIELD_TYPES.TEXTAREA:
				return (
					<div key={field.id} className={styles.customFieldWrapper}>
						<label className={styles.customFieldLabel}>
							{field.label}
							{field.isRequired && ' *'}
						</label>
						<textarea
							value={value}
							onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
							placeholder={field.placeholder || ''}
							disabled={isDisabled}
							className={styles.customFieldTextarea}
						/>
					</div>
				)

			case FIELD_TYPES.CHECKBOX:
				return (
					<div key={field.id} className={styles.customFieldWrapper}>
						<label className={styles.checkboxWrapper}>
							<input
								type="checkbox"
								className={styles.checkboxInput}
								checked={value === 'true'}
								onChange={(e) => handleCustomFieldChange(field.id, e.target.checked ? 'true' : '')}
								disabled={isDisabled}
							/>
							<span className={styles.checkboxLabel}>
								{field.label}
								{field.isRequired && ' *'}
							</span>
						</label>
					</div>
				)

			case FIELD_TYPES.FILE:
				return (
					<div key={field.id} className={styles.customFieldWrapper}>
						<FileUploadLocal
							label={field.label}
							required={field.isRequired}
							maxFileSize={field.fileConfig?.maxFileSize || 5}
							maxFiles={field.fileConfig?.maxFiles || 1}
							allowedTypes={field.fileConfig?.allowedTypes || []}
							value={fieldFiles[field.id] || []}
							existingFiles={existingFieldFiles[field.id] || []}
							onChange={(files) => handleCustomFileChange(field.id, files)}
							onRemoveExisting={(file) => handleRemoveExistingFile(field.id, file)}
							disabled={isDisabled}
						/>
					</div>
				)

			default:
				return (
					<Input
						key={field.id}
						value={value}
						onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
						type={
							field.type === FIELD_TYPES.NUMBER
								? 'number'
								: field.type === FIELD_TYPES.DATE
									? 'date'
									: field.type === FIELD_TYPES.EMAIL
										? 'email'
										: field.type === FIELD_TYPES.PHONE
											? 'tel'
											: 'text'
						}
						label={`${field.label}${field.isRequired ? ' *' : ''}`}
						placeholder={field.placeholder || ''}
						fullWidth
						disabled={isDisabled}
					/>
				)
		}
	}

	// Loading State
	if (isLoading) {
		return (
			<AdminLayout>
				<div className={styles.page}>
					{/* Header Skeleton */}
					<header className={styles.profileHeader}>
						<div className={styles.headerGradient} />
						<div className={styles.headerContent}>
							<div className={styles.avatarWrapper}>
								<Skeleton width="96px" height="96px" borderRadius="50%" />
							</div>
							<div className={styles.profileInfo}>
								<div className={styles.profileNameRow}>
									<Skeleton width="180px" height="32px" />
									<Skeleton width="90px" height="28px" borderRadius="9999px" />
								</div>
								<div className={styles.profileMeta}>
									<Skeleton width="200px" height="20px" />
									<Skeleton width="150px" height="20px" />
								</div>
								<div className={styles.profileStats}>
									<div className={styles.statItem}>
										<Skeleton width="36px" height="36px" borderRadius="8px" />
										<div className={styles.statContent}>
											<Skeleton width="60px" height="16px" />
											<Skeleton width="80px" height="14px" />
										</div>
									</div>
									<div className={styles.statItem}>
										<Skeleton width="36px" height="36px" borderRadius="8px" />
										<div className={styles.statContent}>
											<Skeleton width="60px" height="16px" />
											<Skeleton width="80px" height="14px" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</header>

					{/* Cards Skeleton */}
					<div className={styles.cardsGrid}>
						<section className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardHeaderLeft}>
									<Skeleton width="40px" height="40px" borderRadius="8px" />
									<div className={styles.cardTitleGroup}>
										<Skeleton width="80px" height="18px" />
										<Skeleton width="140px" height="14px" />
									</div>
								</div>
							</div>
							<div className={styles.cardBody}>
								<div className={styles.infoList}>
									<div className={styles.infoItem}>
										<Skeleton width="60px" height="16px" />
										<Skeleton width="140px" height="16px" />
									</div>
								</div>
							</div>
						</section>

						<section className={styles.card}>
							<div className={styles.cardHeader}>
								<div className={styles.cardHeaderLeft}>
									<Skeleton width="40px" height="40px" borderRadius="8px" />
									<div className={styles.cardTitleGroup}>
										<Skeleton width="100px" height="18px" />
										<Skeleton width="120px" height="14px" />
									</div>
								</div>
							</div>
							<div className={styles.cardBody}>
								<div className={styles.infoList}>
									{[1, 2, 3].map((i) => (
										<div key={i} className={styles.infoItem}>
											<Skeleton width="80px" height="16px" />
											<Skeleton width="120px" height="16px" />
										</div>
									))}
								</div>
							</div>
						</section>
					</div>
				</div>
			</AdminLayout>
		)
	}

	// Error State
	if (!user) {
		return (
			<AdminLayout>
				<div className={styles.page}>
					<div className={styles.errorState}>
						<p>Erro ao carregar informações do usuário</p>
					</div>
				</div>
			</AdminLayout>
		)
	}

	const subscription = user.subscription
	const hasActiveSubscription = subscription?.status === 'active'
	const isTeamMember = !!user.createdBy

	// Calcular estatísticas
	const memberSince = user.createdAt
		? new Date(user.createdAt).toLocaleDateString('pt-BR', {
				month: 'short',
				year: 'numeric',
			})
		: null

	return (
		<AdminLayout>
			<div className={styles.page}>
				{/* Profile Header com Degradê */}
				<header className={styles.profileHeader}>
					<div className={styles.headerGradient} />
					<div className={styles.headerContent}>
						<div className={styles.avatarWrapper}>
							<Avatar
								src={user.avatarUrl}
								name={user.name}
								size="large"
								isLoading={isAvatarLoading}
							/>
							<div className={styles.avatarOverlay}>
								<button
									type="button"
									className={styles.avatarBtn}
									onClick={() => fileInputRef.current?.click()}
									disabled={isAvatarLoading}
									aria-label="Alterar foto"
								>
									<Camera size={16} />
								</button>
								{user.avatarUrl && (
									<button
										type="button"
										className={`${styles.avatarBtn} ${styles.avatarBtnDelete}`}
										onClick={handleDeleteAvatar}
										disabled={isAvatarLoading}
										aria-label="Remover foto"
									>
										<Trash2 size={16} />
									</button>
								)}
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept={ACCEPTED_TYPES.join(',')}
								onChange={handleFileChange}
								className={styles.fileInput}
								tabIndex={-1}
							/>
						</div>

						<div className={styles.profileInfo}>
							<div className={styles.profileNameRow}>
								<h1 className={styles.profileName}>{user.name}</h1>
								<span className={styles.roleBadge}>{getRoleLabel(user.role)}</span>
							</div>

							<div className={styles.profileMeta}>
								<span className={styles.profileMetaItem}>
									<Mail size={14} className={styles.profileMetaIcon} />
									{user.email}
								</span>
								{company?.name && (
									<span className={styles.profileMetaItem}>
										<Building2 size={14} className={styles.profileMetaIcon} />
										{company.name}
									</span>
								)}
								{subscription?.status === 'active' && (
									<span className={styles.profileMetaItem}>
										<CreditCard size={14} className={styles.profileMetaIcon} />
										{subscription.plan?.name}
									</span>
								)}
							</div>

							<div className={styles.profileStats}>
								{memberSince && (
									<div className={styles.statItem}>
										<div className={styles.statIcon}>
											<Calendar size={16} />
										</div>
										<div className={styles.statContent}>
											<span className={styles.statValue}>{memberSince}</span>
											<span className={styles.statLabel}>Membro desde</span>
										</div>
									</div>
								)}
								{subscription?.daysRemaining !== null &&
									subscription?.daysRemaining !== undefined &&
									hasActiveSubscription && (
										<div className={styles.statItem}>
											<div className={styles.statIcon}>
												<Clock size={16} />
											</div>
											<div className={styles.statContent}>
												<span className={styles.statValue}>{subscription.daysRemaining} dias</span>
												<span className={styles.statLabel}>Até renovação</span>
											</div>
										</div>
									)}
								{isTeamMember && (
									<div className={styles.statItem}>
										<div className={styles.statIcon}>
											<Users size={16} />
										</div>
										<div className={styles.statContent}>
											<span className={styles.statValue}>Equipe</span>
											<span className={styles.statLabel}>Membro da equipe</span>
										</div>
									</div>
								)}
								{subscription?.status === 'active' && (
									<div className={styles.statItem}>
										<div className={styles.statIcon}>
											<Check size={16} />
										</div>
										<div className={styles.statContent}>
											<span className={styles.statValue}>Ativa</span>
											<span className={styles.statLabel}>Assinatura</span>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</header>

				{/* Cards Grid (50/50) */}
				<div className={styles.cardsGrid}>
					{/* Company Card */}
					<section className={styles.card}>
						<div className={styles.cardHeader}>
							<div className={styles.cardHeaderLeft}>
								<div className={styles.cardIcon}>
									<Building2 size={20} />
								</div>
								<div className={styles.cardTitleGroup}>
									<h2 className={styles.cardTitle}>Empresa</h2>
									<p className={styles.cardSubtitle}>Informações da organização</p>
								</div>
							</div>
							{!isTeamMember && !isEditingCompany && (
								<Button
									type="button"
									variant="ghost"
									size="small"
									onClick={() => setIsEditingCompany(true)}
								>
									Editar
								</Button>
							)}
						</div>

						<div className={styles.cardBody}>
							{isLoadingCompany ? (
								<Skeleton height="20px" width="180px" />
							) : isEditingCompany ? (
								<form className={styles.form} onSubmit={handleSubmitCompany(onSubmitCompany)}>
									<Input
										{...registerCompany('companyName')}
										label="Nome da Empresa"
										placeholder="Nome da sua empresa"
										error={companyErrors.companyName?.message}
										fullWidth
									/>
									<div className={styles.formActions}>
										<Button
											type="button"
											variant="ghost"
											size="small"
											onClick={handleCancelEdit}
											disabled={updateCompanyMutation.isPending}
										>
											Cancelar
										</Button>
										<Button
											type="submit"
											variant="primary"
											size="small"
											loading={updateCompanyMutation.isPending}
										>
											Salvar
										</Button>
									</div>
								</form>
							) : (
								<div className={styles.infoList}>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Nome</span>
										<span className={styles.infoValue}>{company?.name || 'Não definido'}</span>
									</div>
								</div>
							)}

							{isTeamMember && !isEditingCompany && (
								<div className={styles.infoBox}>
									<Info size={16} className={styles.infoBoxIcon} />
									<p className={styles.infoBoxText}>
										Apenas o proprietário pode editar o nome da empresa.
									</p>
								</div>
							)}
						</div>
					</section>

					{/* Subscription / Role Card */}
					<section className={styles.card}>
						<div className={styles.cardHeader}>
							<div className={styles.cardHeaderLeft}>
								<div className={styles.cardIcon}>
									{isTeamMember ? <UserIcon size={20} /> : <CreditCard size={20} />}
								</div>
								<div className={styles.cardTitleGroup}>
									<h2 className={styles.cardTitle}>
										{isTeamMember ? 'Minha Função' : 'Assinatura'}
									</h2>
									<p className={styles.cardSubtitle}>
										{isTeamMember ? 'Seu papel na organização' : 'Detalhes do seu plano'}
									</p>
								</div>
							</div>
						</div>

						<div className={styles.cardBody}>
							{isTeamMember ? (
								<>
									<div className={styles.infoList}>
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Cargo</span>
											<span className={styles.infoValue}>{getRoleLabel(user.role)}</span>
										</div>
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Empresa</span>
											<span className={styles.infoValue}>
												{isLoadingCompany ? (
													<Skeleton width="100px" height="16px" />
												) : (
													company?.name || 'Não disponível'
												)}
											</span>
										</div>
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Status</span>
											<span className={`${styles.statusBadge} ${styles.statusActive}`}>
												<Check size={12} />
												Ativo
											</span>
										</div>
									</div>

									<div className={styles.infoBox}>
										<Info size={16} className={styles.infoBoxIcon} />
										<p className={styles.infoBoxText}>
											Você faz parte da equipe e tem acesso às funcionalidades do sistema através da
											assinatura da empresa.
										</p>
									</div>
								</>
							) : subscription?.plan ? (
								<div className={styles.infoList}>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Plano</span>
										<span className={styles.infoValue}>{subscription.plan.name}</span>
									</div>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Valor</span>
										<span className={styles.infoValue}>
											{formatCurrency(subscription.plan.price ?? 0)}/mês
										</span>
									</div>
									<div className={styles.infoItem}>
										<span className={styles.infoLabel}>Status</span>
										<span
											className={`${styles.statusBadge} ${getStatusStyle(subscription.status)}`}
										>
											{hasActiveSubscription ? <Check size={12} /> : <X size={12} />}
											{getStatusLabel(subscription.status)}
										</span>
									</div>
									{subscription.startDate && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Início</span>
											<span className={styles.infoValue}>
												<Calendar size={14} className={styles.infoIcon} />
												{formatDate(subscription.startDate)}
											</span>
										</div>
									)}
									{subscription.endDate && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Próxima cobrança</span>
											<span className={styles.infoValue}>
												<Calendar size={14} className={styles.infoIcon} />
												{formatDate(subscription.endDate)}
											</span>
										</div>
									)}
									{subscription.daysRemaining !== null && hasActiveSubscription && (
										<div className={styles.infoItem}>
											<span className={styles.infoLabel}>Renova em</span>
											<span className={styles.infoValue}>
												{subscription.daysRemaining}{' '}
												{subscription.daysRemaining === 1 ? 'dia' : 'dias'}
											</span>
										</div>
									)}
								</div>
							) : (
								<div className={styles.emptyState}>
									<p className={styles.emptyStateText}>Nenhuma assinatura ativa encontrada.</p>
									<Button variant="primary" size="small" disabled>
										Assinar Agora
									</Button>
								</div>
							)}
						</div>

						{subscription?.plan && !isTeamMember && (
							<div className={styles.cardFooter}>
								<Button variant="outline" size="small" fullWidth disabled>
									Alterar Plano
								</Button>
							</div>
						)}
					</section>
				</div>

				{/* Custom Fields Section */}
				{(isLoadingCustomFields || customFields.length > 0) && (
					<section className={styles.card}>
						<div className={styles.cardHeader}>
							<div className={styles.cardHeaderLeft}>
								<div className={styles.cardIcon}>
									<FileText size={20} />
								</div>
								<div className={styles.cardTitleGroup}>
									<h2 className={styles.cardTitle}>Informações Adicionais</h2>
									<p className={styles.cardSubtitle}>
										{customFieldsProgress.total > 0
											? `${customFieldsProgress.completed}/${customFieldsProgress.total} preenchidos`
											: 'Campos personalizados da equipe'}
									</p>
								</div>
							</div>
							{!isEditingCustomFields && !isLoadingCustomFields && (
								<Button
									type="button"
									variant="ghost"
									size="small"
									onClick={() => setIsEditingCustomFields(true)}
								>
									Editar
								</Button>
							)}
						</div>

						<div className={styles.cardBody}>
							{isLoadingCustomFields ? (
								<div className={styles.customFieldsGrid}>
									<Skeleton height="56px" width="100%" />
									<Skeleton height="56px" width="100%" />
									<Skeleton height="56px" width="100%" />
								</div>
							) : customFields.length === 0 ? (
								<div className={styles.emptyState}>
									<p className={styles.emptyStateText}>Nenhum campo adicional configurado.</p>
								</div>
							) : (
								<div className={styles.customFieldsGrid}>
									{customFields.map((field) => renderCustomField(field))}
								</div>
							)}
						</div>

						{isEditingCustomFields && (
							<div className={styles.cardFooter}>
								<div className={styles.formActions}>
									<Button
										type="button"
										variant="ghost"
										size="small"
										onClick={handleCancelCustomFieldsEdit}
										disabled={saveCustomFieldsMutation.isPending || isUploading}
									>
										Cancelar
									</Button>
									<Button
										type="button"
										variant="primary"
										size="small"
										onClick={handleSaveCustomFields}
										loading={saveCustomFieldsMutation.isPending || isUploading}
									>
										{isUploading ? 'Enviando...' : 'Salvar'}
									</Button>
								</div>
							</div>
						)}
					</section>
				)}
			</div>
		</AdminLayout>
	)
}
