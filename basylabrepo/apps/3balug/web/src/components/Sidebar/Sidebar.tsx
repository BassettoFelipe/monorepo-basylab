import {
	BarChart3,
	Building2,
	Calendar,
	ChevronDown,
	DollarSign,
	FileText,
	Home,
	KeyRound,
	LogOut,
	Settings,
	Shield,
	User,
	UserCheck,
	Users,
	UsersRound,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar/Avatar'
import { ClickableLogo } from '@/components/ClickableLogo/ClickableLogo'
import { Skeleton } from '@/components/Skeleton/Skeleton'
import { useACL } from '@/hooks/useACL'
import { useUser } from '@/queries/auth/useUser'
import { logout } from '@/services/auth/session/logout'
import { storage } from '@/utils/storage'
import * as styles from './Sidebar.css'

interface NavItem {
	icon: React.ElementType
	label: string
	path: string
	requiredRoles?: string[]
}

const navItems: NavItem[] = [
	{ icon: Home, label: 'Dashboard', path: '/dashboard' },
	{ icon: Building2, label: 'Imóveis', path: '/properties' },
	{ icon: KeyRound, label: 'Proprietários', path: '/property-owners' },
	{ icon: UserCheck, label: 'Inquilinos', path: '/tenants' },
	{ icon: Users, label: 'Clientes', path: '/clients' },
	{ icon: FileText, label: 'Contratos', path: '/contracts' },
	{ icon: Calendar, label: 'Agenda', path: '/schedule' },
	{ icon: DollarSign, label: 'Financeiro', path: '/finance' },
	{ icon: Shield, label: 'Seguros', path: '/insurance' },
	{ icon: BarChart3, label: 'BI', path: '/bi/properties' },
	{
		icon: UsersRound,
		label: 'Equipe',
		path: '/team',
		requiredRoles: ['owner', 'manager', 'admin'],
	},
]

const isRouteActive = (currentPath: string, itemPath: string): boolean => {
	const cleanPath = currentPath.split('?')[0].split('#')[0]
	return cleanPath.startsWith(itemPath)
}

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
	showOnDesktop?: boolean
}

export function Sidebar({ isOpen, onClose, showOnDesktop = false }: SidebarProps) {
	const { userRole } = useACL()
	const { user, isLoading } = useUser()
	const location = useLocation()
	const navigate = useNavigate()
	const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
	const prevPathnameRef = useRef(location.pathname)

	// Single effect for keyboard and body overflow
	useEffect(() => {
		if (!isOpen) return

		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
		document.addEventListener('keydown', handleEscapeKey)
		document.body.style.overflow = 'hidden'
		document.body.style.paddingRight = `${scrollbarWidth}px`

		return () => {
			document.removeEventListener('keydown', handleEscapeKey)
			document.body.style.overflow = ''
			document.body.style.paddingRight = ''
		}
	}, [isOpen, onClose])

	// Close sidebar on route change
	useEffect(() => {
		if (prevPathnameRef.current !== location.pathname) {
			prevPathnameRef.current = location.pathname
			if (isOpen) {
				onClose()
			}
		}
	}, [location.pathname, isOpen, onClose])

	const handleLogout = useCallback(async () => {
		try {
			await logout()
			navigate('/login')
		} catch (_error) {
			/* Erro ignorado - logout sempre redireciona */
		}
	}, [navigate])

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

	const userPlan = useMemo(
		() => user?.subscription?.plan?.name || storage.getPlanName() || 'Sem plano',
		[user?.subscription?.plan?.name],
	)

	// Só mostra skeleton se não tiver cache no localStorage
	const hasCache = storage.getUserName() !== null

	return (
		<>
			{/* Mobile Overlay */}
			{isOpen && <div className={styles.mobileOverlay} onClick={onClose} aria-hidden="true" />}

			{/* Sidebar */}
			<aside
				className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${!showOnDesktop ? styles.sidebarHiddenOnDesktop : ''}`}
				aria-label="Menu lateral"
			>
				{/* Mobile Header */}
				<div className={styles.sidebarHeader}>
					<ClickableLogo variant="primary" size="small" className={styles.logo} />
					<button
						type="button"
						className={styles.closeButton}
						onClick={onClose}
						aria-label="Fechar menu"
					>
						<X size={20} />
					</button>
				</div>

				<nav className={styles.nav} aria-label="Navegação rápida">
					{navItems.map((item) => {
						// Usa cache de role para decisão instantânea
						const cachedRole = storage.getUserRole()
						const effectiveRole = userRole || cachedRole

						// Só esconde se tiver role e não tiver permissão
						if (
							item.requiredRoles &&
							effectiveRole &&
							!item.requiredRoles.includes(effectiveRole)
						) {
							return null
						}

						const Icon = item.icon
						const isActive = isRouteActive(location.pathname, item.path)

						return (
							<Link
								key={item.path}
								to={item.path}
								className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
								aria-current={isActive ? 'page' : undefined}
							>
								<Icon size={20} className={styles.navItemIcon} />
								<span className={styles.navItemLabel}>{item.label}</span>
								<span className={styles.tooltip}>{item.label}</span>
							</Link>
						)
					})}
				</nav>

				{/* Mobile Footer with Profile */}
				<div className={styles.sidebarFooter}>
					{isLoading && !hasCache ? (
						<div className={styles.profileSection}>
							<Skeleton width="40px" height="40px" variant="circular" />
							<div className={styles.profileInfo}>
								<Skeleton width="100px" height="14px" variant="rounded" />
								<Skeleton width="80px" height="12px" variant="rounded" />
							</div>
						</div>
					) : (
						<>
							<button
								type="button"
								className={styles.profileSection}
								onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
								aria-expanded={isProfileDropdownOpen}
							>
								<Avatar
									src={user?.avatarUrl || storage.getUserAvatarUrl() || undefined}
									name={user?.name || storage.getUserName() || 'Usuário'}
									size="small"
								/>
								<div className={styles.profileInfo}>
									<span className={styles.userName}>{getUserDisplayName()}</span>
									<span className={styles.userPlan}>{userPlan}</span>
								</div>
								<ChevronDown
									size={16}
									className={`${styles.chevronIcon} ${isProfileDropdownOpen ? styles.chevronOpen : ''}`}
								/>
							</button>

							{isProfileDropdownOpen && (
								<div className={styles.profileActions}>
									<Link to="/profile" className={styles.profileActionItem} onClick={onClose}>
										<User size={18} />
										<span>Meu Perfil</span>
									</Link>
									<Link to="/settings" className={styles.profileActionItem} onClick={onClose}>
										<Settings size={18} />
										<span>Configurações</span>
									</Link>
									<button
										type="button"
										className={`${styles.profileActionItem} ${styles.profileActionDanger}`}
										onClick={handleLogout}
									>
										<LogOut size={18} />
										<span>Sair</span>
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</aside>
		</>
	)
}
