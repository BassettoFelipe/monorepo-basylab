import {
	ArrowDownAZ,
	ArrowUpAZ,
	Building2,
	Calendar,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Edit,
	Eye,
	Filter,
	Mail,
	MapPin,
	Phone,
	Plus,
	RotateCcw,
	Trash2,
	Users,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Input } from '@/components/Input/Input'
import { Select } from '@/components/Select/Select'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { useDeletePropertyOwnerMutation } from '@/queries/property-owners/useDeletePropertyOwnerMutation'
import { usePropertyOwnerQuery } from '@/queries/property-owners/usePropertyOwnerQuery'
import { usePropertyOwnersQuery } from '@/queries/property-owners/usePropertyOwnersQuery'
import type {
	DocumentType,
	PropertyOwner,
	PropertyOwnerSortBy,
	PropertyOwnerSortOrder,
} from '@/types/property-owner.types'
import { BRAZILIAN_STATES } from '@/types/property-owner.types'
import { getAvatarColor, getInitials } from '@/utils/avatar'
import { formatDate, formatDocument, formatPhone } from '@/utils/format'
import { getPaginationPages } from '@/utils/pagination'
import { CreatePropertyOwnerModal } from './components/CreatePropertyOwnerModal/CreatePropertyOwnerModal'
import { EditPropertyOwnerModal } from './components/EditPropertyOwnerModal/EditPropertyOwnerModal'
import * as styles from './styles.css'

export function PropertyOwnersPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
	const [ownerToDelete, setOwnerToDelete] = useState<PropertyOwner | null>(null)
	const navigate = useNavigate()

	const limit = 20

	// Extrair estados da URL
	const search = searchParams.get('search') || ''
	const page = Number(searchParams.get('page')) || 1
	const documentType = (searchParams.get('documentType') as DocumentType) || undefined
	const state = searchParams.get('state') || undefined
	const city = searchParams.get('city') || undefined
	const hasProperties = searchParams.get('hasProperties')
	const hasEmail = searchParams.get('hasEmail')
	const hasPhone = searchParams.get('hasPhone')
	const createdAtStart = searchParams.get('createdAtStart') || undefined
	const createdAtEnd = searchParams.get('createdAtEnd') || undefined
	const sortBy = (searchParams.get('sortBy') as PropertyOwnerSortBy) || 'name'
	const sortOrder = (searchParams.get('sortOrder') as PropertyOwnerSortOrder) || 'asc'

	const modalAction = searchParams.get('modal')
	const editId = searchParams.get('id')

	const isCreateModalOpen = modalAction === 'create'
	const isEditModalOpen = modalAction === 'edit' && !!editId
	const isDeleteDialogOpen = modalAction === 'delete' && !!editId

	// Conta quantos filtros avancados estao ativos
	const activeFiltersCount = [
		documentType,
		state,
		city,
		hasProperties,
		hasEmail,
		hasPhone,
		createdAtStart,
		createdAtEnd,
	].filter(Boolean).length

	const { data, isLoading, error } = usePropertyOwnersQuery({
		search: search || undefined,
		documentType,
		state,
		city,
		hasProperties: hasProperties === 'true' ? true : hasProperties === 'false' ? false : undefined,
		hasEmail: hasEmail === 'true' ? true : hasEmail === 'false' ? false : undefined,
		hasPhone: hasPhone === 'true' ? true : hasPhone === 'false' ? false : undefined,
		createdAtStart,
		createdAtEnd,
		sortBy,
		sortOrder,
		page,
		limit,
	})

	const { data: editOwnerData, isLoading: isLoadingOwner } = usePropertyOwnerQuery(editId || '', {
		enabled: isEditModalOpen,
	})

	const deleteMutation = useDeletePropertyOwnerMutation()

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

	const clearAllFilters = () => {
		const newParams = new URLSearchParams()
		if (searchParams.get('modal')) {
			newParams.set('modal', searchParams.get('modal')!)
		}
		if (searchParams.get('id')) {
			newParams.set('id', searchParams.get('id')!)
		}
		setSearchParams(newParams)
	}

	const handleSort = (field: PropertyOwnerSortBy) => {
		if (sortBy === field) {
			updateSearchParams({
				sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
				page: '1',
			})
		} else {
			updateSearchParams({
				sortBy: field,
				sortOrder: 'asc',
				page: '1',
			})
		}
	}

	const getSortIcon = (field: PropertyOwnerSortBy) => {
		const isActive = sortBy === field
		if (isActive) {
			return sortOrder === 'asc' ? (
				<ArrowUpAZ size={14} className={styles.sortIconActive} />
			) : (
				<ArrowDownAZ size={14} className={styles.sortIconActive} />
			)
		}
		return <ArrowUpAZ size={14} className={styles.sortIcon} />
	}

	const openCreateModal = () => {
		updateSearchParams({ modal: 'create' })
	}

	const viewOwnerProfile = (owner: PropertyOwner) => {
		navigate(`/property-owners/${owner.id}`)
	}

	const openEditModal = (owner: PropertyOwner) => {
		updateSearchParams({ modal: 'edit', id: owner.id })
	}

	const openDeleteDialog = (owner: PropertyOwner) => {
		setOwnerToDelete(owner)
		updateSearchParams({ modal: 'delete', id: owner.id })
	}

	const closeModal = useCallback(() => {
		setSearchParams((prevParams) => {
			const newParams = new URLSearchParams(prevParams)
			newParams.delete('modal')
			newParams.delete('id')
			return newParams
		})
		setOwnerToDelete(null)
	}, [setSearchParams])

	const handleConfirmDelete = useCallback(async () => {
		if (!ownerToDelete?.id) return

		try {
			await deleteMutation.mutateAsync(ownerToDelete.id)
			closeModal()
		} catch {
			// Error is handled by the mutation
		}
	}, [ownerToDelete?.id, deleteMutation, closeModal])

	return (
		<AdminLayout>
			<div className={styles.sectionHeader}>
				<div className={styles.sectionTitleWrapper}>
					<h2 className={styles.sectionTitle}>Proprietarios</h2>
					<p className={styles.sectionDescription}>
						{data?.total || 0}{' '}
						{data?.total === 1 ? 'proprietario cadastrado' : 'proprietarios cadastrados'}
					</p>
				</div>
				<Button onClick={openCreateModal} variant="primary">
					<Plus size={20} />
					Adicionar Proprietario
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
							value={search}
							onChange={(e) => {
								updateSearchParams({ search: e.target.value, page: '1' })
							}}
							placeholder="Buscar por nome, documento, email, telefone ou cidade..."
							fullWidth
						/>
					</div>
					<div className={styles.filterItem}>
						<label className={styles.filterLabel} htmlFor="documentType-filter">
							Tipo de Documento
						</label>
						<Select
							id="documentType-filter"
							value={documentType || ''}
							onChange={(e) => {
								updateSearchParams({ documentType: e.target.value, page: '1' })
							}}
							options={[
								{ value: '', label: 'Todos' },
								{ value: 'cpf', label: 'CPF' },
								{ value: 'cnpj', label: 'CNPJ' },
							]}
							fullWidth
						/>
					</div>
					<div className={styles.filterItem}>
						<label className={styles.filterLabel} htmlFor="state-filter">
							Estado
						</label>
						<Select
							id="state-filter"
							value={state || ''}
							onChange={(e) => {
								updateSearchParams({ state: e.target.value, page: '1' })
							}}
							options={[
								{ value: '', label: 'Todos' },
								...BRAZILIAN_STATES.map((s) => ({ value: s.value, label: s.label })),
							]}
							fullWidth
						/>
					</div>
					<div className={styles.filterActions}>
						<Button
							variant="outline"
							size="small"
							onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
							title={
								showAdvancedFilters ? 'Ocultar filtros avancados' : 'Mostrar filtros avancados'
							}
						>
							<Filter size={16} />
							Filtros
							{activeFiltersCount > 0 && (
								<span className={styles.filterBadge}>{activeFiltersCount}</span>
							)}
							{showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
						</Button>
						{(search || activeFiltersCount > 0 || sortBy !== 'name' || sortOrder !== 'asc') && (
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

				{showAdvancedFilters && (
					<>
						<div className={styles.filterDivider} />
						<div className={styles.filterRow}>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="city-filter">
									Cidade
								</label>
								<Input
									id="city-filter"
									value={city || ''}
									onChange={(e) => {
										updateSearchParams({ city: e.target.value, page: '1' })
									}}
									placeholder="Filtrar por cidade..."
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="hasEmail-filter">
									Email
								</label>
								<Select
									id="hasEmail-filter"
									value={hasEmail || ''}
									onChange={(e) => {
										updateSearchParams({ hasEmail: e.target.value, page: '1' })
									}}
									options={[
										{ value: '', label: 'Todos' },
										{ value: 'true', label: 'Com email' },
										{ value: 'false', label: 'Sem email' },
									]}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="hasPhone-filter">
									Telefone
								</label>
								<Select
									id="hasPhone-filter"
									value={hasPhone || ''}
									onChange={(e) => {
										updateSearchParams({ hasPhone: e.target.value, page: '1' })
									}}
									options={[
										{ value: '', label: 'Todos' },
										{ value: 'true', label: 'Com telefone' },
										{ value: 'false', label: 'Sem telefone' },
									]}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="hasProperties-filter">
									Imoveis
								</label>
								<Select
									id="hasProperties-filter"
									value={hasProperties || ''}
									onChange={(e) => {
										updateSearchParams({ hasProperties: e.target.value, page: '1' })
									}}
									options={[
										{ value: '', label: 'Todos' },
										{ value: 'true', label: 'Com imoveis' },
										{ value: 'false', label: 'Sem imoveis' },
									]}
									fullWidth
								/>
							</div>
						</div>
						<div className={styles.filterRow} style={{ marginTop: '16px' }}>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="createdAtStart-filter">
									Cadastrado a partir de
								</label>
								<Input
									id="createdAtStart-filter"
									type="date"
									value={createdAtStart || ''}
									onChange={(e) => {
										updateSearchParams({
											createdAtStart: e.target.value ? new Date(e.target.value).toISOString() : '',
											page: '1',
										})
									}}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="createdAtEnd-filter">
									Cadastrado ate
								</label>
								<Input
									id="createdAtEnd-filter"
									type="date"
									value={createdAtEnd ? createdAtEnd.split('T')[0] : ''}
									onChange={(e) => {
										updateSearchParams({
											createdAtEnd: e.target.value ? new Date(e.target.value).toISOString() : '',
											page: '1',
										})
									}}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="sortBy-filter">
									Ordenar por
								</label>
								<Select
									id="sortBy-filter"
									value={sortBy}
									onChange={(e) => {
										updateSearchParams({ sortBy: e.target.value, page: '1' })
									}}
									options={[
										{ value: 'name', label: 'Nome' },
										{ value: 'createdAt', label: 'Data de cadastro' },
										{ value: 'propertiesCount', label: 'Quantidade de imoveis' },
										{ value: 'city', label: 'Cidade' },
										{ value: 'state', label: 'Estado' },
									]}
									fullWidth
								/>
							</div>
							<div className={styles.filterItem}>
								<label className={styles.filterLabel} htmlFor="sortOrder-filter">
									Ordem
								</label>
								<Select
									id="sortOrder-filter"
									value={sortOrder}
									onChange={(e) => {
										updateSearchParams({ sortOrder: e.target.value, page: '1' })
									}}
									options={[
										{ value: 'asc', label: 'Crescente' },
										{ value: 'desc', label: 'Decrescente' },
									]}
									fullWidth
								/>
							</div>
						</div>
					</>
				)}
			</div>

			{isLoading && (
				<div className={styles.tableWrapper}>
					<table className={styles.table}>
						<thead className={styles.tableHeader}>
							<tr>
								<th className={`${styles.tableHeaderCell} ${styles.colOwner}`}>Proprietario</th>
								<th className={`${styles.tableHeaderCell} ${styles.colContact}`}>Contato</th>
								<th className={`${styles.tableHeaderCell} ${styles.colLocation}`}>Localizacao</th>
								<th className={`${styles.tableHeaderCell} ${styles.colProperties}`}>Imoveis</th>
								<th className={`${styles.tableHeaderCell} ${styles.colDate}`}>Cadastro</th>
								<th className={`${styles.tableHeaderCell} ${styles.colActions}`}>Acoes</th>
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: 5 }).map((_, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list with fixed order
								<tr key={index} className={styles.tableRow}>
									<td className={`${styles.tableCell} ${styles.colOwner}`}>
										<div className={styles.ownerMainInfo}>
											<Skeleton width={40} height={40} variant="circular" />
											<div className={styles.ownerInfo}>
												<Skeleton width={140} height={14} variant="rounded" />
												<div className={styles.ownerMeta}>
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
									<td className={`${styles.tableCell} ${styles.colProperties}`}>
										<div className={styles.propertiesCount}>
											<Skeleton width={14} height={14} variant="rounded" />
											<Skeleton width={20} height={14} variant="rounded" />
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
					title="Erro ao carregar proprietarios"
					description="Nao foi possivel carregar os proprietarios. Tente novamente."
				/>
			)}

			{!isLoading && !error && data && data.data.length === 0 && (
				<EmptyState
					icon={Users}
					title={
						search || activeFiltersCount > 0
							? 'Nenhum proprietario encontrado'
							: 'Nenhum proprietario cadastrado'
					}
					description={
						search || activeFiltersCount > 0
							? 'Nenhum proprietario corresponde aos filtros aplicados. Tente ajustar os criterios de busca.'
							: 'Adicione proprietarios para gerenciar seus imoveis.'
					}
					action={
						search || activeFiltersCount > 0
							? {
									label: 'Limpar Filtros',
									onClick: clearAllFilters,
								}
							: {
									label: 'Adicionar Primeiro Proprietario',
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
									<th
										className={`${styles.tableHeaderCell} ${styles.colOwner} ${styles.sortableHeader}`}
									>
										<button
											type="button"
											className={styles.sortableHeaderContent}
											onClick={() => handleSort('name')}
										>
											Proprietario {getSortIcon('name')}
										</button>
									</th>
									<th className={`${styles.tableHeaderCell} ${styles.colContact}`}>Contato</th>
									<th
										className={`${styles.tableHeaderCell} ${styles.colLocation} ${styles.sortableHeader}`}
									>
										<button
											type="button"
											className={styles.sortableHeaderContent}
											onClick={() => handleSort('city')}
										>
											Localizacao {getSortIcon('city')}
										</button>
									</th>
									<th
										className={`${styles.tableHeaderCell} ${styles.colProperties} ${styles.sortableHeader}`}
									>
										<button
											type="button"
											className={styles.sortableHeaderContent}
											onClick={() => handleSort('propertiesCount')}
										>
											Imoveis {getSortIcon('propertiesCount')}
										</button>
									</th>
									<th
										className={`${styles.tableHeaderCell} ${styles.colDate} ${styles.sortableHeader}`}
									>
										<button
											type="button"
											className={styles.sortableHeaderContent}
											onClick={() => handleSort('createdAt')}
										>
											Cadastro {getSortIcon('createdAt')}
										</button>
									</th>
									<th className={`${styles.tableHeaderCell} ${styles.colActions}`}>Acoes</th>
								</tr>
							</thead>
							<tbody>
								{data.data.map((owner) => {
									const avatarColor = getAvatarColor(owner.name)
									return (
										<tr key={owner.id} className={styles.tableRow}>
											<td className={`${styles.tableCell} ${styles.colOwner}`}>
												<div className={styles.ownerMainInfo}>
													{owner.photoUrl ? (
														<img src={owner.photoUrl} alt={owner.name} className={styles.avatar} />
													) : (
														<div
															className={styles.avatarFallback}
															style={{
																backgroundColor: avatarColor.bg,
																color: avatarColor.text,
															}}
														>
															{getInitials(owner.name)}
														</div>
													)}
													<div className={styles.ownerInfo}>
														<span className={styles.ownerName}>{owner.name}</span>
														<div className={styles.ownerMeta}>
															<span
																className={`${styles.badge} ${
																	owner.documentType === 'cpf' ? styles.badgeCpf : styles.badgeCnpj
																}`}
															>
																{owner.documentType.toUpperCase()}
															</span>
															<span className={styles.ownerDocument}>
																{formatDocument(owner.document, owner.documentType)}
															</span>
														</div>
													</div>
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colContact}`}>
												<div className={styles.contactInfo}>
													{owner.email ? (
														<div className={styles.contactRow}>
															<Mail size={14} className={styles.contactIcon} />
															<span className={styles.contactText}>{owner.email}</span>
														</div>
													) : (
														<div className={styles.contactRow}>
															<Mail size={14} className={styles.contactIconMuted} />
															<span className={styles.contactTextMuted}>-</span>
														</div>
													)}
													{owner.phone ? (
														<div className={styles.contactRow}>
															<Phone size={14} className={styles.contactIcon} />
															<span className={styles.contactText}>{formatPhone(owner.phone)}</span>
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
												{owner.city || owner.state ? (
													<div className={styles.contactRow}>
														<MapPin size={14} className={styles.contactIcon} />
														<span className={styles.contactText}>
															{owner.city && owner.state
																? `${owner.city}/${owner.state}`
																: owner.city || owner.state}
														</span>
													</div>
												) : (
													<div className={styles.contactRow}>
														<MapPin size={14} className={styles.contactIconMuted} />
														<span className={styles.contactTextMuted}>-</span>
													</div>
												)}
											</td>
											<td className={`${styles.tableCell} ${styles.colProperties}`}>
												<div className={styles.propertiesCount}>
													<Building2 size={14} className={styles.contactIcon} />
													<span className={styles.propertiesCountText}>
														{owner.propertiesCount ?? 0}
													</span>
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colDate}`}>
												<div className={styles.contactInfo}>
													<div className={styles.contactRow}>
														<Calendar size={14} className={styles.contactIcon} />
														<span className={styles.contactText}>
															{formatDate(owner.createdAt)}
														</span>
													</div>
												</div>
											</td>
											<td className={`${styles.tableCell} ${styles.colActions}`}>
												<div className={styles.actions}>
													<button
														type="button"
														className={styles.iconButton}
														onClick={() => viewOwnerProfile(owner)}
														title="Visualizar proprietario"
													>
														<Eye size={16} />
													</button>
													<button
														type="button"
														className={styles.iconButton}
														onClick={() => openEditModal(owner)}
														title="Editar proprietario"
													>
														<Edit size={16} />
													</button>
													<button
														type="button"
														className={`${styles.iconButton} ${styles.iconButtonDanger}`}
														onClick={() => openDeleteDialog(owner)}
														title="Excluir proprietario"
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
								{data.total} proprietarios
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

			<CreatePropertyOwnerModal isOpen={isCreateModalOpen} onClose={closeModal} />

			<EditPropertyOwnerModal
				isOpen={isEditModalOpen}
				onClose={closeModal}
				propertyOwner={editOwnerData || null}
				isLoading={isLoadingOwner}
			/>

			<ConfirmDialog
				isOpen={isDeleteDialogOpen && !!ownerToDelete}
				onClose={closeModal}
				onConfirm={handleConfirmDelete}
				title="Excluir Proprietario"
				description={`Tem certeza que deseja excluir <strong>${ownerToDelete?.name || ''}</strong>? Esta acao nao pode ser desfeita.`}
				confirmText="Excluir"
				cancelText="Cancelar"
				isLoading={deleteMutation.isPending}
				variant="danger"
				requireConfirmation
				confirmationText="EXCLUIR"
			/>
		</AdminLayout>
	)
}
