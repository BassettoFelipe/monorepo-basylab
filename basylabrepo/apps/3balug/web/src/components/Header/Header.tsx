import { LogOut, Menu, Search, Settings, User, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar/Avatar'
import { ClickableLogo } from '@/components/ClickableLogo/ClickableLogo'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { useUser } from '@/queries/auth/useUser'
import { logout } from '@/services/auth/session/logout'
import { storage } from '@/utils/storage'
import * as styles from './Header.css'

interface NavItem {
	label: string
	path: string
}

const navItems: NavItem[] = [
	{ label: 'Dashboard', path: '/dashboard' },
	{ label: 'Imóveis', path: '/properties' },
	{ label: 'Contratos', path: '/contracts' },
	{ label: 'Proprietários', path: '/owners' },
	{ label: 'Gestão de Imóveis', path: '/property-management' },
	{ label: 'Novo Cliente', path: '/clients/new' },
	{ label: 'Clientes', path: '/clients' },
	{ label: 'Agenda', path: '/schedule' },
	{ label: 'Funil', path: '/funnel' },
	{ label: 'Consultar Serasa', path: '/serasa/consult' },
	{ label: 'Histórico de Consultas', path: '/serasa/history' },
	{ label: 'Crédito', path: '/serasa/credit' },
	{ label: 'Cadastrar Corretor/Gerente', path: '/team/new' },
	{ label: 'Equipes', path: '/team' },
	{ label: 'BI Imóveis', path: '/bi/properties' },
	{ label: 'Financeiro', path: '/finance' },
	{ label: 'Faturamento', path: '/billing' },
	{ label: 'BI Financeiro', path: '/bi/finance' },
	{ label: 'Análises de Seguros', path: '/insurance/analysis' },
	{ label: 'Imóveis Segurados', path: '/insurance' },
	{ label: 'Seja um Afiliado', path: '/affiliates' },
	{ label: 'Configurações de Clientes', path: '/settings/clients' },
	{ label: 'Perfil', path: '/profile' },
	{ label: 'Acessos', path: '/settings/access' },
	{ label: 'Configurações', path: '/settings' },
]

interface HeaderProps {
	onMenuToggle?: () => void
	hideHamburgerOnDesktop?: boolean
}

export function Header({ onMenuToggle, hideHamburgerOnDesktop = false }: HeaderProps) {
	const navigate = useNavigate()
	const { user, isLoading } = useUser()
	const [searchQuery, setSearchQuery] = useState('')
	const [showDropdown, setShowDropdown] = useState(false)
	const [isSearchExpanded, setIsSearchExpanded] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const searchRef = useRef<HTMLDivElement>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)

	// Memoize filtered results
	const filteredItems = useMemo(() => {
		if (!searchQuery.trim()) return []
		return navItems.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
	}, [searchQuery])

	const showSearchResults = searchQuery.trim().length > 0

	// Single effect for click outside handling
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node

			if (dropdownRef.current && !dropdownRef.current.contains(target)) {
				setShowDropdown(false)
			}

			if (searchRef.current && !searchRef.current.contains(target) && !isSearchExpanded) {
				setSearchQuery('')
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isSearchExpanded])

	const handleLogout = useCallback(async () => {
		try {
			await logout()
			navigate('/login')
		} catch (_error) {
			/* Erro ignorado - logout sempre redireciona */
		}
	}, [navigate])

	const handleSearchItemClick = useCallback(
		(path: string) => {
			navigate(path)
			setSearchQuery('')
			setIsSearchExpanded(false)
		},
		[navigate],
	)

	const handleSearchIconClick = useCallback(() => {
		setIsSearchExpanded(true)
		setTimeout(() => searchInputRef.current?.focus(), 100)
	}, [])

	const handleCloseSearch = useCallback(() => {
		setIsSearchExpanded(false)
		setSearchQuery('')
	}, [])

	const getUserDisplayName = useCallback(() => {
		const name = user?.name || storage.getUserName()
		if (!name) return 'Usuário'
		const names = name
			.trim()
			.split(' ')
			.filter((n: string) => n.length > 0)
		if (names.length === 1) return names[0]
		if (names.length >= 2) return `${names[0]} ${names[1]}`
		return name
	}, [user?.name])

	const userPlan = useMemo(() => {
		const role = user?.role || storage.getUserRole()
		const createdBy = user?.createdBy ?? storage.getUserCreatedBy()
		const planName = user?.subscription?.plan?.name || storage.getPlanName()

		if (createdBy) {
			if (role === 'broker') return 'Corretor'
			if (role === 'manager') return 'Gerente'
			if (role === 'insurance_analyst') return 'Analista'
			return 'Membro'
		}
		return planName || 'Sem plano'
	}, [user])

	// Só mostra skeleton se não tiver cache no localStorage
	const hasCache = storage.getUserName() !== null

	return (
		<header className={styles.header}>
			<div className={styles.container}>
				{/* Hamburger Menu */}
				{onMenuToggle && (
					<button
						type="button"
						className={`${styles.hamburgerButton} ${hideHamburgerOnDesktop ? styles.hamburgerHiddenOnDesktop : ''}`}
						onClick={onMenuToggle}
						aria-label="Menu"
					>
						<Menu size={24} />
					</button>
				)}

				{/* Logo */}
				<div className={styles.logoWrapper}>
					<ClickableLogo variant="primary" size="small" />
				</div>

				{/* Search - Desktop */}
				<div
					className={`${styles.searchWrapper} ${isSearchExpanded ? styles.searchExpanded : ''}`}
					ref={searchRef}
				>
					<div className={styles.searchInputWrapper}>
						<Search className={styles.searchIcon} size={18} />
						<input
							ref={searchInputRef}
							type="text"
							placeholder="Buscar telas..."
							className={styles.searchInput}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setIsSearchExpanded(true)}
						/>
						{isSearchExpanded && (
							<button
								type="button"
								className={styles.searchCloseButton}
								onClick={handleCloseSearch}
								aria-label="Fechar busca"
							>
								<X size={18} />
							</button>
						)}
					</div>

					{showSearchResults && filteredItems.length > 0 && (
						<div className={styles.searchResults}>
							{filteredItems.map((item) => (
								<button
									key={item.path}
									type="button"
									className={styles.searchResultItem}
									onClick={() => handleSearchItemClick(item.path)}
								>
									{item.label}
								</button>
							))}
						</div>
					)}

					{showSearchResults && filteredItems.length === 0 && (
						<div className={styles.searchResults}>
							<div className={styles.noResults}>Nenhum resultado encontrado</div>
						</div>
					)}
				</div>

				{/* Search Icon - Mobile */}
				<button
					type="button"
					className={styles.searchIconButton}
					onClick={handleSearchIconClick}
					aria-label="Buscar"
				>
					<Search size={20} />
				</button>

				{/* Profile */}
				<div className={styles.profileWrapper} ref={dropdownRef}>
					<button
						type="button"
						className={styles.profileButton}
						onClick={() => setShowDropdown(!showDropdown)}
						aria-expanded={showDropdown}
						aria-haspopup="menu"
						aria-label={`Menu do usuário ${user?.name}`}
					>
						{isLoading && !hasCache ? (
							<Skeleton width="36px" height="36px" variant="circular" />
						) : (
							<Avatar
								src={user?.avatarUrl || storage.getUserAvatarUrl() || undefined}
								name={user?.name || storage.getUserName() || 'Usuário'}
								size="small"
							/>
						)}
						<div className={styles.userInfo}>
							{isLoading && !hasCache ? (
								<>
									<Skeleton width="80px" height="16px" />
									<Skeleton width="60px" height="14px" />
								</>
							) : (
								<>
									<span className={styles.userName}>{getUserDisplayName()}</span>
									<span className={styles.userPlan}>{userPlan}</span>
								</>
							)}
						</div>
					</button>

					{showDropdown && (
						<div className={styles.dropdownMenu} role="menu">
							<Link
								to="/profile"
								className={styles.dropdownItem}
								onClick={() => setShowDropdown(false)}
								role="menuitem"
							>
								<User size={18} />
								<span>Meu Perfil</span>
							</Link>
							<Link
								to="/settings"
								className={styles.dropdownItem}
								onClick={() => setShowDropdown(false)}
								role="menuitem"
							>
								<Settings size={18} />
								<span>Configurações</span>
							</Link>
							<div className={styles.dropdownDivider} />
							<button
								type="button"
								className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
								onClick={handleLogout}
								role="menuitem"
							>
								<LogOut size={18} />
								<span>Sair</span>
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Mobile Search Overlay */}
			{isSearchExpanded && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: Overlay click-to-dismiss is a common UX pattern, keyboard users can use Escape key via close button
				<div className={styles.mobileSearchOverlay} onClick={handleCloseSearch}>
					<div
						className={styles.mobileSearchContainer}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
					>
						<div className={styles.mobileSearchHeader}>
							<Search size={20} />
							<input
								ref={searchInputRef}
								type="text"
								placeholder="Buscar telas..."
								className={styles.mobileSearchInput}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<button
								type="button"
								className={styles.mobileSearchClose}
								onClick={handleCloseSearch}
								aria-label="Fechar"
							>
								<X size={20} />
							</button>
						</div>

						{filteredItems.length > 0 && (
							<div className={styles.mobileSearchResults}>
								{filteredItems.map((item) => (
									<button
										key={item.path}
										type="button"
										className={styles.mobileSearchResultItem}
										onClick={() => handleSearchItemClick(item.path)}
									>
										{item.label}
									</button>
								))}
							</div>
						)}

						{showSearchResults && filteredItems.length === 0 && (
							<div className={styles.mobileSearchResults}>
								<div className={styles.noResults}>Nenhum resultado encontrado</div>
							</div>
						)}
					</div>
				</div>
			)}
		</header>
	)
}
