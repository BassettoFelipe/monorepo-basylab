import {
	AlertCircle,
	CheckCircle2,
	ClipboardList,
	Edit,
	Plus,
	Settings2,
	Trash2,
	UserPlus,
	Users,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Select } from '@/components/Select/Select'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { Switch } from '@/components/Switch/Switch'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useUser } from '@/queries/auth/useUser'
import { useCustomFieldsQuery } from '@/queries/custom-fields/useCustomFieldsQuery'
import { useDeleteCustomFieldMutation } from '@/queries/custom-fields/useDeleteCustomFieldMutation'
import { useUpdateCustomFieldMutation } from '@/queries/custom-fields/useUpdateCustomFieldMutation'
import { useActivateUserMutation } from '@/queries/users/useActivateUserMutation'
import { useDeactivateUserMutation } from '@/queries/users/useDeactivateUserMutation'
import { useDeleteUserMutation } from '@/queries/users/useDeleteUserMutation'
import { useUsersQuery } from '@/queries/users/useUsersQuery'
import { type CustomField, FIELD_TYPES } from '@/types/custom-field.types'
import type { TeamUser } from '@/types/user.types'
import { Permissions } from '@/utils/permissions'
import { CreateCustomFieldModal } from './components/CreateCustomFieldModal/CreateCustomFieldModal'
import { CreateUserModal } from './components/CreateUserModal/CreateUserModal'
import { EditCustomFieldModal } from './components/EditCustomFieldModal/EditCustomFieldModal'
import { EditUserModal } from './components/EditUserModal/EditUserModal'
import { ViewUserFieldsModal } from './components/ViewUserFieldsModal/ViewUserFieldsModal'
import * as styles from './styles.css'

const ROLE_LABELS: Record<string, string> = {
	owner: 'Proprietário',
	broker: 'Corretor',
	manager: 'Gerente',
	insurance_analyst: 'Analista de Seguros',
}

const FIELD_TYPE_LABELS: Record<string, string> = {
	[FIELD_TYPES.TEXT]: 'Texto',
	[FIELD_TYPES.TEXTAREA]: 'Texto Multilinha',
	[FIELD_TYPES.NUMBER]: 'Número',
	[FIELD_TYPES.EMAIL]: 'Email',
	[FIELD_TYPES.PHONE]: 'Telefone',
	[FIELD_TYPES.DATE]: 'Data',
	[FIELD_TYPES.SELECT]: 'Seleção',
	[FIELD_TYPES.CHECKBOX]: 'Checkbox',
	[FIELD_TYPES.FILE]: 'Arquivo',
}

export function TeamPage() {
	const { user } = useUser()
	const [searchParams, setSearchParams] = useSearchParams()

	const limit = 20

	// Extrair estados da URL
	const activeTab: 'members' | 'fields' =
		searchParams.get('tab') === 'fields' ? 'fields' : 'members'
	const roleFilter = searchParams.get('role') || 'all'
	const statusFilter = searchParams.get('status') || 'all'
	const page = Number(searchParams.get('page')) || 1

	// Modais de usuário
	const userModalAction = searchParams.get('userModal')
	const userModalId = searchParams.get('userId')
	const isCreateModalOpen = userModalAction === 'create'
	const isEditModalOpen = userModalAction === 'edit' && !!userModalId
	const isDeleteDialogOpen = userModalAction === 'delete' && !!userModalId

	// Modais de campos customizados
	const fieldModalAction = searchParams.get('fieldModal')
	const fieldModalId = searchParams.get('fieldId')
	const isCreateFieldModalOpen = fieldModalAction === 'create'
	const isEditFieldModalOpen = fieldModalAction === 'edit' && !!fieldModalId
	const isDeleteFieldDialogOpen = fieldModalAction === 'delete' && !!fieldModalId

	// View user fields modal
	const viewFieldsUserId = searchParams.get('viewFields')
	const isViewFieldsModalOpen = !!viewFieldsUserId

	// Permissões
	const canCreate = Permissions.canCreateUser(user ? user.role : undefined)
	const canEdit = Permissions.canUpdateUser(user ? user.role : undefined)
	const canDelete = Permissions.canDeleteUser(user ? user.role : undefined)
	const canToggleStatus = Permissions.canDeactivateUser(user ? user.role : undefined)

	// Query com filtros
	const { data, isLoading, error } = useUsersQuery({
		role:
			roleFilter === 'all' ? undefined : (roleFilter as 'broker' | 'manager' | 'insurance_analyst'),
		isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
		page,
		limit,
	})

	// Custom fields query
	const {
		data: customFieldsData,
		isLoading: isLoadingFields,
		error: errorFields,
	} = useCustomFieldsQuery({ includeInactive: true })

	const deactivateUserMutation = useDeactivateUserMutation()
	const activateUserMutation = useActivateUserMutation()
	const deleteUserMutation = useDeleteUserMutation()
	const updateFieldMutation = useUpdateCustomFieldMutation()
	const deleteFieldMutation = useDeleteCustomFieldMutation()

	// Derivar dados selecionados da query ao invés de useState
	const selectedUser = data?.users.find((u) => u.id === userModalId)
	const fields = customFieldsData?.data ?? []
	const selectedField = fields.find((f) => f.id === fieldModalId)
	const hasFeature = customFieldsData?.hasFeature ?? false
	const activeFieldsCount = fields.filter((f) => f.isActive).length

	const updateSearchParams = (updates: Record<string, string>) => {
		const newParams = new URLSearchParams(searchParams)
		for (const [key, value] of Object.entries(updates)) {
			if (value) {
				newParams.set(key, value)
			} else {
				newParams.delete(key)
			}
		}
		setSearchParams(newParams)
	}

	const setActiveTab = (tab: 'members' | 'fields') => {
		updateSearchParams({ tab, viewFields: '' })
	}

	const handleEdit = (user: TeamUser) => {
		updateSearchParams({ userModal: 'edit', userId: user.id })
	}

	const handleViewFields = (user: TeamUser) => {
		updateSearchParams({ viewFields: user.id })
	}

	const handleDelete = (user: TeamUser) => {
		updateSearchParams({ userModal: 'delete', userId: user.id })
	}

	const handleConfirmDelete = async () => {
		if (!userModalId) return

		try {
			await deleteUserMutation.mutateAsync(userModalId)
			closeUserModal()
		} catch {
			// Error handled by mutation
		}
	}

	const handleToggleStatus = (user: TeamUser) => {
		if (user.isActive) {
			deactivateUserMutation.mutate(user.id)
		} else {
			activateUserMutation.mutate(user.id)
		}
	}

	const closeUserModal = () => {
		const newParams = new URLSearchParams(searchParams)
		newParams.delete('userModal')
		newParams.delete('userId')
		setSearchParams(newParams)
	}

	const closeFieldModal = () => {
		const newParams = new URLSearchParams(searchParams)
		newParams.delete('fieldModal')
		newParams.delete('fieldId')
		setSearchParams(newParams)
	}

	const closeViewFieldsModal = () => {
		const newParams = new URLSearchParams(searchParams)
		newParams.delete('viewFields')
		setSearchParams(newParams)
	}

	const getRoleBadgeClass = (role: string) => {
		switch (role) {
			case 'owner':
				return styles.roleOwner
			case 'broker':
				return styles.roleBroker
			case 'manager':
				return styles.roleManager
			case 'insurance_analyst':
				return styles.roleAnalyst
			default:
				return styles.roleBroker
		}
	}

	// Custom fields handlers
	const handleEditField = (field: CustomField) => {
		updateSearchParams({ fieldModal: 'edit', fieldId: field.id })
	}

	const handleDeleteField = (field: CustomField) => {
		updateSearchParams({ fieldModal: 'delete', fieldId: field.id })
	}

	const handleConfirmDeleteField = async () => {
		if (!fieldModalId) return

		try {
			await deleteFieldMutation.mutateAsync(fieldModalId)
			closeFieldModal()
		} catch {
			// Error handled by mutation
		}
	}

	const handleToggleFieldActive = (field: CustomField) => {
		updateFieldMutation.mutate({
			fieldId: field.id,
			payload: { isActive: !field.isActive },
		})
	}

	return (
		<AdminLayout>
			{/* Tabs Compactas */}
			<div className={styles.tabsCompact}>
				<button
					type="button"
					className={`${styles.tabCompact} ${activeTab === 'members' ? styles.tabCompactActive : ''}`}
					onClick={() => setActiveTab('members')}
				>
					<Users size={18} />
					<span className={styles.tabCompactLabel}>Membros</span>
					{isLoading ? (
						<Skeleton width="24px" height="20px" borderRadius="9999px" />
					) : (
						<span
							className={`${styles.tabCompactBadge} ${activeTab === 'members' ? styles.tabCompactBadgeActive : ''}`}
						>
							{data?.total || 0}
						</span>
					)}
				</button>

				<button
					type="button"
					className={`${styles.tabCompact} ${activeTab === 'fields' ? styles.tabCompactActive : ''}`}
					onClick={() => setActiveTab('fields')}
				>
					<Settings2 size={18} />
					<span className={styles.tabCompactLabel}>Campos Customizados</span>
					{isLoadingFields ? (
						<Skeleton width="24px" height="20px" borderRadius="9999px" />
					) : (
						<span
							className={`${styles.tabCompactBadge} ${activeTab === 'fields' ? styles.tabCompactBadgeActive : ''}`}
						>
							{fields.length}
						</span>
					)}
				</button>
			</div>

			{/* Tab: Membros */}
			{activeTab === 'members' && (
				<>
					{/* Section Header */}
					<div className={styles.sectionHeader}>
						<div className={styles.sectionTitleWrapper}>
							<h2 className={styles.sectionTitle}>Gerenciar Membros</h2>
							<p className={styles.sectionDescription}>
								{data?.total || 0}{' '}
								{data?.total === 1 ? 'usuário cadastrado' : 'usuários cadastrados'} na sua equipe
							</p>
						</div>
						{canCreate && (
							<Button onClick={() => updateSearchParams({ userModal: 'create' })} variant="primary">
								<UserPlus size={20} />
								Adicionar Membro
							</Button>
						)}
					</div>

					{/* Filters Card */}
					<div className={styles.filtersCard}>
						<div className={styles.filterRow}>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel}>Filtrar por função</label>
								<Select
									value={roleFilter}
									onChange={(e) => {
										updateSearchParams({ role: e.target.value, page: '1' })
									}}
									options={[
										{ value: 'all', label: 'Todas as funções' },
										{ value: 'broker', label: 'Corretor' },
										{ value: 'manager', label: 'Gerente' },
										{
											value: 'insurance_analyst',
											label: 'Analista de Seguros',
										},
									]}
								/>
							</div>

							<div className={styles.filterItem}>
								<label className={styles.filterLabel}>Filtrar por status</label>
								<Select
									value={statusFilter}
									onChange={(e) => {
										updateSearchParams({ status: e.target.value, page: '1' })
									}}
									options={[
										{ value: 'all', label: 'Todos os status' },
										{ value: 'active', label: 'Apenas ativos' },
										{ value: 'inactive', label: 'Apenas inativos' },
									]}
								/>
							</div>
						</div>
					</div>

					{/* Loading State */}
					{isLoading && (
						<div>
							<div style={{ marginBottom: '8px' }}>
								<Skeleton width="100%" height="60px" />
							</div>
							<div style={{ marginBottom: '8px' }}>
								<Skeleton width="100%" height="60px" />
							</div>
							<Skeleton width="100%" height="60px" />
						</div>
					)}

					{/* Error State */}
					{error && (
						<EmptyState
							icon={Users}
							title="Erro ao carregar equipe"
							description="Não foi possível carregar os membros da equipe. Tente novamente."
						/>
					)}

					{/* Empty State */}
					{!isLoading && !error && data && data.users.length === 0 && (
						<EmptyState
							icon={Users}
							title="Nenhum membro cadastrado"
							description="Adicione membros à sua equipe para começar a colaborar."
							action={{
								label: 'Adicionar Primeiro Membro',
								onClick: () => updateSearchParams({ userModal: 'create' }),
							}}
						/>
					)}

					{/* Table */}
					{!isLoading && !error && data && data.users.length > 0 && (
						<>
							<div className={styles.tableWrapper}>
								<table className={styles.table}>
									<thead className={styles.tableHeader}>
										<tr>
											<th className={styles.tableHeaderCell}>Usuário</th>
											<th className={styles.tableHeaderCell}>Função</th>
											<th className={styles.tableHeaderCell}>Celular</th>
											<th className={styles.tableHeaderCell}>Status</th>
											{hasFeature && <th className={styles.tableHeaderCell}>Formulário</th>}
											<th className={styles.tableHeaderCell}>Data de Cadastro</th>
											<th className={styles.tableHeaderCell}>Ações</th>
										</tr>
									</thead>
									<tbody>
										{data.users.map((user) => (
											<tr key={user.id} className={styles.tableRow}>
												<td className={styles.tableCell}>
													<div className={styles.userInfo}>
														<span className={styles.userName}>{user.name}</span>
														<span className={styles.userEmail}>{user.email}</span>
													</div>
												</td>
												<td className={styles.tableCell}>
													<span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
														{ROLE_LABELS[user.role] || user.role}
													</span>
												</td>
												<td className={styles.tableCell}>
													<span
														style={{
															color: user.phone ? '#111827' : '#9CA3AF',
														}}
													>
														{user.phone || '-'}
													</span>
												</td>
												<td className={styles.tableCell}>
													<span
														className={`${styles.badge} ${
															user.isActive ? styles.badgeActive : styles.badgeInactive
														}`}
													>
														{user.isActive ? 'Ativo' : 'Inativo'}
													</span>
												</td>
												{hasFeature && (
													<td className={styles.tableCell}>
														{user.hasPendingCustomFields ? (
															<span
																className={`${styles.badge} ${styles.badgePending}`}
																style={{
																	display: 'inline-flex',
																	alignItems: 'center',
																	gap: '4px',
																}}
															>
																<AlertCircle size={12} />
																Pendente
															</span>
														) : (
															<span
																className={`${styles.badge} ${styles.badgeFilled}`}
																style={{
																	display: 'inline-flex',
																	alignItems: 'center',
																	gap: '4px',
																}}
															>
																<CheckCircle2 size={12} />
																Preenchido
															</span>
														)}
													</td>
												)}
												<td className={styles.tableCell}>
													{new Date(user.createdAt).toLocaleDateString('pt-BR')}
												</td>
												<td className={styles.tableCell}>
													<div className={styles.actions}>
														{hasFeature && (
															<button
																type="button"
																className={styles.iconButton}
																onClick={() => handleViewFields(user)}
																title="Ver campos preenchidos"
															>
																<ClipboardList size={18} />
															</button>
														)}
														{canEdit && (
															<button
																type="button"
																className={styles.iconButton}
																onClick={() => handleEdit(user)}
																title="Editar usuário"
															>
																<Edit size={18} />
															</button>
														)}
														{canToggleStatus && (
															<div className={styles.switchWrapper}>
																<span className={styles.switchLabel} data-active={user.isActive}>
																	{user.isActive ? 'Ativo' : 'Inativo'}
																</span>
																<Switch
																	checked={user.isActive}
																	onChange={() => handleToggleStatus(user)}
																	size="sm"
																/>
															</div>
														)}
														{canDelete && (
															<button
																type="button"
																className={`${styles.iconButton} ${styles.iconButtonDanger}`}
																onClick={() => handleDelete(user)}
																title="Excluir usuário"
															>
																<Trash2 size={18} />
															</button>
														)}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Pagination */}
							{data.totalPages > 1 && (
								<div className={styles.pagination}>
									<div className={styles.paginationInfo}>
										Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, data.total)} de{' '}
										{data.total} membros
									</div>
									<div className={styles.paginationButtons}>
										<Button
											variant="outline"
											size="small"
											onClick={() =>
												updateSearchParams({
													page: String(Math.max(1, page - 1)),
												})
											}
											disabled={page === 1}
										>
											Anterior
										</Button>
										<Button
											variant="outline"
											size="small"
											onClick={() =>
												updateSearchParams({
													page: String(Math.min(data.totalPages, page + 1)),
												})
											}
											disabled={page === data.totalPages}
										>
											Próxima
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</>
			)}

			{/* Tab: Campos Customizados */}
			{activeTab === 'fields' && (
				<>
					{/* Feature bloqueada */}
					{!isLoadingFields && !hasFeature && (
						<div
							className={styles.contentCard}
							style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'flex-start',
									gap: '16px',
								}}
							>
								<div
									style={{
										width: '48px',
										height: '48px',
										borderRadius: '12px',
										background: '#FEF3C7',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
									}}
								>
									<Settings2 size={24} style={{ color: '#D97706' }} />
								</div>
								<div>
									<h3
										style={{
											fontSize: '16px',
											fontWeight: 600,
											color: '#92400E',
											margin: 0,
											marginBottom: '8px',
										}}
									>
										Recurso Premium
									</h3>
									<p
										style={{
											fontSize: '14px',
											color: '#78350F',
											lineHeight: '1.5',
											margin: 0,
										}}
									>
										Campos personalizados estão disponíveis apenas no plano House. Faça upgrade para
										criar campos customizados no cadastro de usuários.
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Error State */}
					{errorFields && (
						<EmptyState
							icon={Settings2}
							title="Erro ao carregar campos"
							description="Não foi possível carregar os campos customizados. Tente novamente."
						/>
					)}

					{/* Feature disponível */}
					{!errorFields && hasFeature && (
						<>
							{/* Section Header */}
							<div className={styles.sectionHeader}>
								<div className={styles.sectionTitleWrapper}>
									<h2 className={styles.sectionTitle}>Gerenciar Campos</h2>
									<p className={styles.sectionDescription}>
										{isLoadingFields ? (
											<Skeleton width="200px" height="16px" />
										) : fields.length === 0 ? (
											'Nenhum campo criado ainda'
										) : (
											`${fields.length} ${fields.length === 1 ? 'campo criado' : 'campos criados'} • ${activeFieldsCount} ${activeFieldsCount === 1 ? 'ativo' : 'ativos'}`
										)}
									</p>
								</div>
								<Button
									onClick={() => updateSearchParams({ fieldModal: 'create' })}
									variant="primary"
								>
									<Plus size={20} />
									Adicionar Campo
								</Button>
							</div>

							{/* Info Card */}
							<div className={styles.filtersCard} style={{ marginBottom: '24px' }}>
								<p
									style={{
										fontSize: '14px',
										color: '#6B7280',
										margin: 0,
										lineHeight: '1.6',
									}}
								>
									<strong>Como funciona:</strong> Os campos que você criar aqui aparecerão
									automaticamente no formulário de cadastro de novos membros. Campos inativos não
									serão exibidos no formulário.
								</p>
							</div>

							{/* Loading State - Skeletons */}
							{isLoadingFields && (
								<div>
									<div style={{ marginBottom: '8px' }}>
										<Skeleton width="100%" height="60px" />
									</div>
									<div style={{ marginBottom: '8px' }}>
										<Skeleton width="100%" height="60px" />
									</div>
									<Skeleton width="100%" height="60px" />
								</div>
							)}

							{/* Empty State */}
							{!isLoadingFields && fields.length === 0 && (
								<EmptyState
									icon={Settings2}
									title="Nenhum campo customizado"
									description="Adicione campos personalizados para coletar informações específicas no cadastro de usuários."
									action={{
										label: 'Criar Primeiro Campo',
										onClick: () => updateSearchParams({ fieldModal: 'create' }),
									}}
								/>
							)}

							{/* Table */}
							{!isLoadingFields && fields.length > 0 && (
								<div className={styles.tableWrapper}>
									<table className={styles.table}>
										<thead className={styles.tableHeader}>
											<tr>
												<th className={styles.tableHeaderCell}>Campo</th>
												<th className={styles.tableHeaderCell}>Tipo</th>
												<th className={styles.tableHeaderCell}>Obrigatório</th>
												<th className={styles.tableHeaderCell}>Status</th>
												<th className={styles.tableHeaderCell}>Ações</th>
											</tr>
										</thead>
										<tbody>
											{fields.map((field) => (
												<tr key={field.id} className={styles.tableRow}>
													<td className={styles.tableCell}>
														<div>
															<p style={{ fontWeight: 500, marginBottom: '2px' }}>{field.label}</p>
															{field.helpText && (
																<p style={{ fontSize: '12px', color: '#6B7280' }}>
																	{field.helpText}
																</p>
															)}
														</div>
													</td>
													<td className={styles.tableCell}>
														<span className={styles.badge}>
															{FIELD_TYPE_LABELS[field.type] || field.type}
														</span>
													</td>
													<td className={styles.tableCell}>
														<span
															className={`${styles.badge} ${
																field.isRequired ? styles.badgeRequired : styles.badgeOptional
															}`}
														>
															{field.isRequired ? 'Sim' : 'Não'}
														</span>
													</td>
													<td className={styles.tableCell}>
														<div
															style={{
																display: 'flex',
																alignItems: 'center',
																gap: '8px',
															}}
														>
															<Switch
																checked={field.isActive}
																onChange={() => handleToggleFieldActive(field)}
																size="sm"
															/>
															<span style={{ fontSize: '14px', color: '#6B7280' }}>
																{field.isActive ? 'Ativo' : 'Inativo'}
															</span>
														</div>
													</td>
													<td className={styles.tableCell}>
														<div className={styles.actions}>
															<button
																type="button"
																className={styles.iconButton}
																onClick={() => handleEditField(field)}
																title="Editar campo"
															>
																<Edit size={18} />
															</button>
															<button
																type="button"
																className={`${styles.iconButton} ${styles.iconButtonDanger}`}
																onClick={() => handleDeleteField(field)}
																title="Excluir campo"
															>
																<Trash2 size={18} />
															</button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</>
					)}
				</>
			)}

			{/* User Modals */}
			<CreateUserModal isOpen={isCreateModalOpen} onClose={closeUserModal} />

			<EditUserModal
				isOpen={isEditModalOpen}
				onClose={closeUserModal}
				user={selectedUser || null}
			/>

			<ConfirmDialog
				isOpen={isDeleteDialogOpen}
				onClose={closeUserModal}
				onConfirm={handleConfirmDelete}
				title="Excluir Usuário Permanentemente"
				description={`Tem certeza que deseja excluir <strong>${selectedUser?.name || ''}</strong>? Esta ação é IRREVERSÍVEL e o usuário será deletado permanentemente do sistema.`}
				confirmText="Excluir Permanentemente"
				cancelText="Cancelar"
				isLoading={deleteUserMutation.isPending}
				variant="danger"
				requireConfirmation={true}
				confirmationText="EXCLUIR"
			/>

			{/* Custom Fields Modals */}
			<CreateCustomFieldModal isOpen={isCreateFieldModalOpen} onClose={closeFieldModal} />

			<EditCustomFieldModal
				isOpen={isEditFieldModalOpen}
				onClose={closeFieldModal}
				field={selectedField || null}
			/>

			<ConfirmDialog
				isOpen={isDeleteFieldDialogOpen}
				onClose={closeFieldModal}
				onConfirm={handleConfirmDeleteField}
				title="Excluir Campo Customizado"
				description={`Tem certeza que deseja excluir o campo <strong>${selectedField?.label || ''}</strong>? Esta ação não pode ser desfeita.`}
				confirmText="Excluir"
				cancelText="Cancelar"
				isLoading={deleteFieldMutation.isPending}
				variant="danger"
			/>

			{/* View User Fields Modal */}
			<ViewUserFieldsModal
				isOpen={isViewFieldsModalOpen}
				onClose={closeViewFieldsModal}
				userId={viewFieldsUserId || ''}
			/>
		</AdminLayout>
	)
}
