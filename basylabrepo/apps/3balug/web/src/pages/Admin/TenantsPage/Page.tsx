import { Edit, Eye, Plus, Trash2, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useDeleteTenantMutation } from '@/queries/tenants/useDeleteTenantMutation'
import { useTenantQuery } from '@/queries/tenants/useTenantQuery'
import { useTenantsQuery } from '@/queries/tenants/useTenantsQuery'
import type { Tenant } from '@/types/tenant.types'
import { CreateTenantModal } from './components/CreateTenantModal/CreateTenantModal'
import { EditTenantModal } from './components/EditTenantModal/EditTenantModal'
import { ViewTenantModal } from './components/ViewTenantModal/ViewTenantModal'
import * as styles from './styles.css'

export function TenantsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

	const limit = 20

	// Extrair estados da URL
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1

	const modalAction = searchParams.get('modal')
	const editId = searchParams.get('id')

	const isCreateModalOpen = modalAction === 'create'
	const isViewModalOpen = modalAction === 'view' && !!editId
	const isEditModalOpen = modalAction === 'edit' && !!editId
	const isDeleteDialogOpen = modalAction === 'delete' && !!editId

	const { data, isLoading, error } = useTenantsQuery({
		search: search || undefined,
		page,
		limit,
	})

	const { data: editTenantData, isLoading: isLoadingTenant } = useTenantQuery(editId || '', {
		enabled: isViewModalOpen || isEditModalOpen,
	})

	const deleteMutation = useDeleteTenantMutation()

	// Derivar tenantToDelete dos dados
	const tenantToDelete = data?.data.find((t) => t.id === editId)

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

	const openCreateModal = () => {
		updateSearchParams({ modal: 'create' })
	}

	const openViewModal = (tenant: Tenant) => {
		updateSearchParams({ modal: 'view', id: tenant.id })
	}

	const openEditModal = (tenant: Tenant) => {
		updateSearchParams({ modal: 'edit', id: tenant.id })
	}

	const openEditFromView = () => {
		if (editId) {
			updateSearchParams({ modal: 'edit', id: editId })
		}
	}

	const openDeleteDialog = (tenant: Tenant) => {
		updateSearchParams({ modal: 'delete', id: tenant.id })
	}

	const closeModal = () => {
		const newParams = new URLSearchParams(searchParams)
		newParams.delete('modal')
		newParams.delete('id')
		setSearchParams(newParams)
	}

	const handleConfirmDelete = async () => {
		if (!editId) return

		try {
			await deleteMutation.mutateAsync(editId)
			closeModal()
		} catch {
			// Error is handled by the mutation
		}
	}

	const formatCpf = (cpf: string) => {
		const digits = cpf.replace(/\D/g, '')
		if (digits.length === 11) {
			return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
		}
		return cpf
	}

	const formatCurrency = (value: number | null) => {
		if (value === null) return '-'
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value)
	}

	return (
		<AdminLayout>
			<div className={styles.sectionHeader}>
				<div className={styles.sectionTitleWrapper}>
					<h2 className={styles.sectionTitle}>Inquilinos</h2>
					<p className={styles.sectionDescription}>
						{data?.total || 0}{' '}
						{data?.total === 1 ? 'inquilino cadastrado' : 'inquilinos cadastrados'}
					</p>
				</div>
				<Button onClick={openCreateModal} variant="primary">
					<Plus size={20} />
					Adicionar Inquilino
				</Button>
			</div>

			<div className={styles.filtersCard}>
				<div className={styles.filterRow}>
					<div className={styles.filterItem}>
						<label htmlFor="tenant-search" className={styles.filterLabel}>
							Buscar
						</label>
						<Input
							id="tenant-search"
							value={search}
							onChange={(e) => {
								updateSearchParams({ search: e.target.value, page: '1' })
							}}
							placeholder="Buscar por nome, CPF ou email..."
							fullWidth
						/>
					</div>
				</div>
			</div>

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

			{error && (
				<EmptyState
					icon={Users}
					title="Erro ao carregar inquilinos"
					description="Nao foi possivel carregar os inquilinos. Tente novamente."
				/>
			)}

			{!isLoading && !error && data && data.data.length === 0 && (
				<EmptyState
					icon={Users}
					title="Nenhum inquilino cadastrado"
					description="Adicione inquilinos para gerenciar seus contratos."
					action={{
						label: 'Adicionar Primeiro Inquilino',
						onClick: openCreateModal,
					}}
				/>
			)}

			{!isLoading && !error && data && data.data.length > 0 && (
				<>
					<div className={styles.tableWrapper}>
						<table className={styles.table}>
							<thead className={styles.tableHeader}>
								<tr>
									<th className={styles.tableHeaderCell}>Inquilino</th>
									<th className={styles.tableHeaderCell}>Contato</th>
									<th className={styles.tableHeaderCell}>Cidade/UF</th>
									<th className={styles.tableHeaderCell}>Renda Mensal</th>
									<th className={styles.tableHeaderCell}>Data de Cadastro</th>
									<th className={styles.tableHeaderCell}>Acoes</th>
								</tr>
							</thead>
							<tbody>
								{data.data.map((tenant) => (
									<tr key={tenant.id} className={styles.tableRow}>
										<td className={styles.tableCell}>
											<div className={styles.tenantInfo}>
												<span className={styles.tenantName}>{tenant.name}</span>
												<span className={styles.tenantCpf}>{formatCpf(tenant.cpf)}</span>
											</div>
										</td>
										<td className={styles.tableCell}>
											<div className={styles.tenantInfo}>
												<span
													style={{
														color: tenant.email ? '#111827' : '#9CA3AF',
													}}
												>
													{tenant.email || '-'}
												</span>
												<span
													style={{
														fontSize: '13px',
														color: tenant.phone ? '#6B7280' : '#9CA3AF',
													}}
												>
													{tenant.phone || '-'}
												</span>
											</div>
										</td>
										<td className={styles.tableCell}>
											<span style={{ color: tenant.city ? '#111827' : '#9CA3AF' }}>
												{tenant.city && tenant.state
													? `${tenant.city}/${tenant.state}`
													: tenant.city || tenant.state || '-'}
											</span>
										</td>
										<td className={styles.tableCell}>
											<span
												style={{
													color: tenant.monthlyIncome ? '#111827' : '#9CA3AF',
												}}
											>
												{formatCurrency(tenant.monthlyIncome)}
											</span>
										</td>
										<td className={styles.tableCell}>
											{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
										</td>
										<td className={styles.tableCell}>
											<div className={styles.actions}>
												<button
													type="button"
													className={styles.iconButton}
													onClick={() => openViewModal(tenant)}
													title="Visualizar inquilino"
												>
													<Eye size={18} />
												</button>
												<button
													type="button"
													className={styles.iconButton}
													onClick={() => openEditModal(tenant)}
													title="Editar inquilino"
												>
													<Edit size={18} />
												</button>
												<button
													type="button"
													className={`${styles.iconButton} ${styles.iconButtonDanger}`}
													onClick={() => openDeleteDialog(tenant)}
													title="Excluir inquilino"
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

					{data.totalPages > 1 && (
						<div className={styles.pagination}>
							<div className={styles.paginationInfo}>
								Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, data.total)} de{' '}
								{data.total} inquilinos
							</div>
							<div className={styles.paginationButtons}>
								<Button
									variant="outline"
									size="small"
									onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
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
									Proxima
								</Button>
							</div>
						</div>
					)}
				</>
			)}

			<CreateTenantModal isOpen={isCreateModalOpen} onClose={closeModal} />

			<ViewTenantModal
				isOpen={isViewModalOpen}
				onClose={closeModal}
				tenant={editTenantData || null}
				onEdit={openEditFromView}
				isLoading={isLoadingTenant}
			/>

			<EditTenantModal
				isOpen={isEditModalOpen}
				onClose={closeModal}
				tenant={editTenantData || null}
			/>

			<ConfirmDialog
				isOpen={isDeleteDialogOpen && !!tenantToDelete}
				onClose={closeModal}
				onConfirm={handleConfirmDelete}
				title="Excluir Inquilino"
				description={`Tem certeza que deseja excluir <strong>${tenantToDelete?.name || ''}</strong>? Esta acao nao pode ser desfeita.`}
				confirmText="Excluir"
				cancelText="Cancelar"
				isLoading={deleteMutation.isPending}
				variant="danger"
			/>
		</AdminLayout>
	)
}
