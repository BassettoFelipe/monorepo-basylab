import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	Edit,
	Eye,
	Mail,
	MapPin,
	Phone,
	Plus,
	RotateCcw,
	SearchX,
	Trash2,
	Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useDeleteTenantMutation } from '@/queries/tenants/useDeleteTenantMutation'
import { useTenantQuery } from '@/queries/tenants/useTenantQuery'
import { useTenantsQuery } from '@/queries/tenants/useTenantsQuery'
import type { Tenant } from '@/types/tenant.types'
import { getAvatarColor, getInitials } from '@/utils/avatar'
import { formatDate, formatDocument, formatPhone } from '@/utils/format'
import { getPaginationPages } from '@/utils/pagination'
import { CreateTenantModal } from './components/CreateTenantModal/CreateTenantModal'
import { EditTenantModal } from './components/EditTenantModal/EditTenantModal'
import { ViewTenantModal } from './components/ViewTenantModal/ViewTenantModal'
import * as styles from './styles.css'

const formatCurrency = (value: number | null) => {
	if (value === null || value === undefined) return null
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value)
}

export function TenantsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)

	const limit = 20

	// Helper function to update URL search params
	const updateSearchParams = useCallback(
		(updates: Record<string, string>) => {
			setSearchParams((prevParams) => {
				const newParams = new URLSearchParams(prevParams)
				for (const [key, value] of Object.entries(updates)) {
					if (value) {
						newParams.set(key, value)
					} else {
						newParams.delete(key)
					}
				}
				return newParams
			})
		},
		[setSearchParams],
	)

	// Extrair estados da URL
	const searchFromUrl = searchParams.get('search') || ''
	const [searchInput, setSearchInput] = useState(searchFromUrl)
	const debouncedSearch = useDebouncedValue(searchInput, 300)

	// Sincronizar URL com valor debounced
	useEffect(() => {
		if (debouncedSearch !== searchFromUrl) {
			updateSearchParams({ search: debouncedSearch, page: '1' })
		}
	}, [debouncedSearch, searchFromUrl, updateSearchParams])

	// Sincronizar input com URL (quando URL muda externamente)
	useEffect(() => {
		if (searchFromUrl !== searchInput && searchFromUrl !== debouncedSearch) {
			setSearchInput(searchFromUrl)
		}
	}, [searchFromUrl, debouncedSearch, searchInput])

	const search = searchFromUrl
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

	const clearAllFilters = () => {
		const newParams = new URLSearchParams()
		if (searchParams.get('modal')) {
			newParams.set('modal', searchParams.get('modal')!)
		}
		if (searchParams.get('id')) {
			newParams.set('id', searchParams.get('id')!)
		}
		setSearchParams(newParams)
		setSearchInput('')
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
		setTenantToDelete(tenant)
		updateSearchParams({ modal: 'delete', id: tenant.id })
	}

	const closeModal = useCallback(() => {
		setSearchParams((prevParams) => {
			const newParams = new URLSearchParams(prevParams)
			newParams.delete('modal')
			newParams.delete('id')
			return newParams
		})
		setTenantToDelete(null)
	}, [setSearchParams])

	const handleConfirmDelete = useCallback(async () => {
		if (!tenantToDelete?.id) return

		try {
			await deleteMutation.mutateAsync(tenantToDelete.id)
			closeModal()
		} catch {
			// Error is handled by the mutation
		}
	}, [tenantToDelete?.id, deleteMutation, closeModal])

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
					<div className={styles.filterItem} style={{ flex: 2 }}>
						<label className={styles.filterLabel} htmlFor="search-filter">
							Buscar
						</label>
						<Input
							id="search-filter"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Buscar por nome, CPF, email ou telefone..."
							fullWidth
						/>
					</div>
					<div className={styles.filterActions}>
						{search && (
							<Button
								variant="outline"
								size="small"
								onClick={clearAllFilters}
								title="Limpar filtros"
							>
								<RotateCcw size={16} />
								Resetar
							</Button>
						)}
					</div>
				</div>
			</div>

			{isLoading && (
				<div className={styles.tableWrapper}>
					<table className={styles.table}>
						<thead className={styles.tableHeader}>
							<tr>
								<th className={`${styles.tableHeaderCell} ${styles.colTenant}`}>Inquilino</th>
								<th className={`${styles.tableHeaderCell} ${styles.colContact}`}>Contato</th>
								<th className={`${styles.tableHeaderCell} ${styles.colLocation}`}>Localizacao</th>
								<th className={`${styles.tableHeaderCell} ${styles.colIncome}`}>Renda</th>
								<th className={`${styles.tableHeaderCell} ${styles.colDate}`}>Cadastro</th>
								<th className={`${styles.tableHeaderCell} ${styles.colActions}`}>Acoes</th>
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: 5 }).map((_, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list with fixed order
								<tr key={index} className={styles.tableRow}>
									<td className={`${styles.tableCell} ${styles.colTenant}`}>
										<div className={styles.tenantMainInfo}>
											<Skeleton width={40} height={40} variant="circular" />
											<div className={styles.tenantInfo}>
												<Skeleton width={140} height={14} variant="rounded" />
												<div className={styles.tenantMeta}>
													<Skeleton width={32} height={16} variant="rounded" />
													<Skeleton width={100} height={12} variant="rounded" />
												</div>
											</div>
										</div>
									</td>
									<td className={`${styles.tableCell} ${styles.colContact}`}>
										<div className={styles.contactInfo}>
											<div className={styles.contactRow}>
												<Skeleton width={14} height={14} variant="rounded" />
												<Skeleton width={130} height={13} variant="rounded" />
											</div>
											<div className={styles.contactRow}>
												<Skeleton width={14} height={14} variant="rounded" />
												<Skeleton width={100} height={13} variant="rounded" />
											</div>
										</div>
									</td>
									<td className={`${styles.tableCell} ${styles.colLocation}`}>
										<div className={styles.contactRow}>
											<Skeleton width={14} height={14} variant="rounded" />
											<Skeleton width={90} height={13} variant="rounded" />
										</div>
									</td>
									<td className={`${styles.tableCell} ${styles.colIncome}`}>
										<div className={styles.incomeValue}>
											<Skeleton width={14} height={14} variant="rounded" />
											<Skeleton width={80} height={13} variant="rounded" />
										</div>
									</td>
									<td className={`${styles.tableCell} ${styles.colDate}`}>
										<div className={styles.contactRow}>
											<Skeleton width={14} height={14} variant="rounded" />
											<Skeleton width={70} height={13} variant="rounded" />
										</div>
									</td>
									<td className={`${styles.tableCell} ${styles.colActions}`}>
										<div className={styles.actions}>
											<Skeleton width={30} height={30} variant="rounded" />
											<Skeleton width={30} height={30} variant="rounded" />
											<Skeleton width={30} height={30} variant="rounded" />
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
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
					icon={search ? SearchX : Users}
					title={search ? 'Nenhum inquilino encontrado' : 'Nenhum inquilino cadastrado'}
					description={
						search
							? 'Nenhum inquilino corresponde aos filtros aplicados. Tente ajustar os criterios de busca.'
							: 'Adicione inquilinos para gerenciar seus contratos.'
					}
					action={
						search
							? {
									label: 'Limpar Filtros',
									onClick: clearAllFilters,
								}
							: {
									label: 'Adicionar Primeiro Inquilino',
									onClick: openCreateModal,
								}
					}
				/>
			)}

			{!isLoading && !error && data && data.data.length > 0 && (
				<>
					<div className={styles.tableWrapper}>
						<table className={styles.table}>
							<thead className={styles.tableHeader}>
								<tr>
									<th className={`${styles.tableHeaderCell} ${styles.colTenant}`}>Inquilino</th>
									<th className={`${styles.tableHeaderCell} ${styles.colContact}`}>Contato</th>
									<th className={`${styles.tableHeaderCell} ${styles.colLocation}`}>Localizacao</th>
									<th className={`${styles.tableHeaderCell} ${styles.colIncome}`}>Renda</th>
									<th className={`${styles.tableHeaderCell} ${styles.colDate}`}>Cadastro</th>
									<th className={`${styles.tableHeaderCell} ${styles.colActions}`}>Acoes</th>
								</tr>
							</thead>
							<tbody>
								{data.data.map((tenant) => {
									const avatarColor = getAvatarColor(tenant.name)
									const formattedIncome = formatCurrency(tenant.monthlyIncome)

									return (
										<tr key={tenant.id} className={styles.tableRow}>
											<td className={`${styles.tableCell} ${styles.colTenant}`}>
												<div className={styles.tenantMainInfo}>
													{tenant.photoUrl ? (
														<img
															src={tenant.photoUrl}
															alt={tenant.name}
															className={styles.avatar}
														/>
													) : (
														<div
															className={styles.avatarFallback}
															style={{
																backgroundColor: avatarColor.bg,
																color: avatarColor.text,
															}}
														>
															{getInitials(tenant.name)}
														</div>
													)}
													<div className={styles.tenantInfo}>
														<span className={styles.tenantName}>{tenant.name}</span>
														<div className={styles.tenantMeta}>
															<span className={`${styles.badge} ${styles.badgeCpf}`}>CPF</span>
															<span className={styles.tenantCpf}>
																{formatDocument(tenant.cpf, 'cpf')}
															</span>
														</div>
													</div>
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colContact}`}>
												<div className={styles.contactInfo}>
													{tenant.email ? (
														<div className={styles.contactRow}>
															<Mail size={14} className={styles.contactIcon} />
															<span className={styles.contactText}>{tenant.email}</span>
														</div>
													) : (
														<div className={styles.contactRow}>
															<Mail size={14} className={styles.contactIconMuted} />
															<span className={styles.contactTextMuted}>-</span>
														</div>
													)}
													{tenant.phone ? (
														<div className={styles.contactRow}>
															<Phone size={14} className={styles.contactIcon} />
															<span className={styles.contactText}>
																{formatPhone(tenant.phone)}
															</span>
														</div>
													) : (
														<div className={styles.contactRow}>
															<Phone size={14} className={styles.contactIconMuted} />
															<span className={styles.contactTextMuted}>-</span>
														</div>
													)}
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colLocation}`}>
												{tenant.city || tenant.state ? (
													<div className={styles.contactRow}>
														<MapPin size={14} className={styles.contactIcon} />
														<span className={styles.contactText}>
															{tenant.city && tenant.state
																? `${tenant.city}/${tenant.state}`
																: tenant.city || tenant.state}
														</span>
													</div>
												) : (
													<div className={styles.contactRow}>
														<MapPin size={14} className={styles.contactIconMuted} />
														<span className={styles.contactTextMuted}>-</span>
													</div>
												)}
											</td>
											<td className={`${styles.tableCell} ${styles.colIncome}`}>
												<div className={styles.incomeValue}>
													{formattedIncome ? (
														<>
															<DollarSign size={14} className={styles.incomeIcon} />
															<span className={styles.incomeText}>{formattedIncome}</span>
														</>
													) : (
														<>
															<DollarSign size={14} className={styles.incomeIconMuted} />
															<span className={styles.incomeTextMuted}>-</span>
														</>
													)}
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colDate}`}>
												<div className={styles.contactRow}>
													<Calendar size={14} className={styles.contactIcon} />
													<span className={styles.contactText}>
														{formatDate(tenant.createdAt)}
													</span>
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colActions}`}>
												<div className={styles.actions}>
													<button
														type="button"
														className={styles.iconButton}
														onClick={() => openViewModal(tenant)}
														title="Visualizar inquilino"
														aria-label={`Visualizar inquilino ${tenant.name}`}
													>
														<Eye size={16} />
													</button>
													<button
														type="button"
														className={styles.iconButton}
														onClick={() => openEditModal(tenant)}
														title="Editar inquilino"
														aria-label={`Editar inquilino ${tenant.name}`}
													>
														<Edit size={16} />
													</button>
													<button
														type="button"
														className={`${styles.iconButton} ${styles.iconButtonDanger}`}
														onClick={() => openDeleteDialog(tenant)}
														title="Excluir inquilino"
														aria-label={`Excluir inquilino ${tenant.name}`}
													>
														<Trash2 size={16} />
													</button>
												</div>
											</td>
										</tr>
									)
								})}
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
								<button
									type="button"
									className={styles.paginationButton}
									onClick={() => updateSearchParams({ page: String(Math.max(1, page - 1)) })}
									disabled={page === 1}
									title="Pagina anterior"
								>
									<ChevronLeft size={16} />
								</button>

								{getPaginationPages(page, data.totalPages).map((pageNum, index) =>
									pageNum === 'ellipsis' ? (
										// biome-ignore lint/suspicious/noArrayIndexKey: Ellipsis items have no unique identifier
										<span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>
											...
										</span>
									) : (
										<button
											key={pageNum}
											type="button"
											className={`${styles.paginationButton} ${
												page === pageNum ? styles.paginationButtonActive : ''
											}`}
											onClick={() => updateSearchParams({ page: String(pageNum) })}
										>
											{pageNum}
										</button>
									),
								)}

								<button
									type="button"
									className={styles.paginationButton}
									onClick={() =>
										updateSearchParams({ page: String(Math.min(data.totalPages, page + 1)) })
									}
									disabled={page === data.totalPages}
									title="Proxima pagina"
								>
									<ChevronRight size={16} />
								</button>
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
