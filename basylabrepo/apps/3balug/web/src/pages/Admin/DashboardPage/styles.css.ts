import { globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

// Animação de entrada do overlay
const fadeInUp = keyframes({
	'0%': {
		opacity: 0,
		transform: 'translateY(12px)',
	},
	'100%': {
		opacity: 1,
		transform: 'translateY(0)',
	},
})

export const dashboardLayout = style({
	display: 'flex',
	minHeight: '100vh',
	backgroundColor: '#FAFAF9',
})

export const dashboardMain = style({
	marginLeft: '72px',
	flex: 1,
	minHeight: '100vh',

	'@media': {
		'(max-width: 1024px)': {
			marginLeft: 0,
			paddingTop: '64px',
		},
	},
})

export const dashboardContent = style({
	padding: vars.spacing['2xl'],
	maxWidth: '1600px',
	margin: '0 auto',

	'@media': {
		'(max-width: 768px)': {
			padding: vars.spacing.lg,
		},
		'(max-width: 640px)': {
			padding: vars.spacing.md,
		},
	},
})

// ============================================
// Banner / Carousel Styles - Full Width com Degradê
// ============================================

export const bannerWrapper = style({
	position: 'relative',
	// Expande para ocupar a largura total
	width: '100vw',
	marginLeft: '-50vw',
	left: '50%',
	// Compensa o padding do contentWrapper (2xl = 2.5rem = 40px)
	marginTop: `calc(-1 * ${vars.spacing['2xl']})`,
	// Margem negativa para os cards subirem sobre o banner
	marginBottom: '-80px',
	/**
	 * Safari fix: Use height instead of aspectRatio + maxHeight
	 * Safari has issues with aspectRatio when combined with maxHeight
	 * and absolute positioned children
	 */
	height: 'clamp(320px, 40vw, 500px)',
	// Clip overflow to prevent image from leaking
	overflow: 'hidden',

	'@media': {
		'(max-width: 1024px)': {
			marginBottom: '-70px',
			height: 'clamp(280px, 35vw, 400px)',
		},
		'(max-width: 768px)': {
			// contentWrapper tem padding lg
			marginTop: `calc(-1 * ${vars.spacing.lg})`,
			marginBottom: '-60px',
			height: 'clamp(300px, 50vw, 450px)',
		},
		'(max-width: 640px)': {
			// contentWrapper tem padding md
			marginTop: `calc(-1 * ${vars.spacing.md})`,
			marginBottom: '-50px',
			height: 'clamp(280px, 60vw, 380px)',
		},
		'(max-width: 400px)': {
			// contentWrapper tem padding sm
			marginTop: `calc(-1 * ${vars.spacing.sm})`,
			height: 'clamp(250px, 70vw, 320px)',
		},
	},
})

export const swiper = style({
	width: '100%',
	height: '100%',
	vars: {
		'--swiper-pagination-bottom': '120px',
		'--swiper-pagination-bullet-inactive-color': '#FFFFFF',
		'--swiper-pagination-bullet-inactive-opacity': '0.6',
		'--swiper-pagination-bullet-size': '10px',
		'--swiper-pagination-bullet-horizontal-gap': '6px',
		'--swiper-pagination-color': '#C7E356',
		'--swiper-pagination-bullet-width': '10px',
		'--swiper-pagination-bullet-height': '10px',
	},

	'@media': {
		'(max-width: 768px)': {
			vars: {
				'--swiper-pagination-bottom': '100px',
				'--swiper-pagination-bullet-size': '8px',
				'--swiper-pagination-bullet-horizontal-gap': '5px',
			},
		},
		'(max-width: 480px)': {
			vars: {
				'--swiper-pagination-bottom': '80px',
				'--swiper-pagination-bullet-size': '7px',
				'--swiper-pagination-bullet-horizontal-gap': '4px',
			},
		},
	},
})

export const swiperSlide = style({
	position: 'relative',
	width: '100%',
	height: '100%',
	// Safari fix: ensure slide respects parent height
	overflow: 'hidden',
})

// Navigation Buttons - Ocultos em mobile, swipe é mais natural
export const navButton = style({
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
	zIndex: 20,
	width: '48px',
	height: '48px',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: 'rgba(255, 255, 255, 0.92)',
	backdropFilter: 'blur(8px)',
	WebkitBackdropFilter: 'blur(8px)',
	border: 'none',
	borderRadius: vars.borderRadius.full,
	cursor: 'pointer',
	color: '#292524',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeOut}`,
	// Melhora touch target para acessibilidade
	touchAction: 'manipulation',

	':hover': {
		backgroundColor: '#FFFFFF',
		color: '#5E6C02',
		boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
		transform: 'translateY(-50%) scale(1.05)',
	},

	':focus-visible': {
		outline: '2px solid #C7E356',
		outlineOffset: '2px',
	},

	':active': {
		transform: 'translateY(-50%) scale(0.96)',
	},

	'@media': {
		'(max-width: 1024px)': {
			width: '42px',
			height: '42px',
		},
		'(max-width: 768px)': {
			width: '38px',
			height: '38px',
		},
		// Ocultar botões em mobile - swipe é mais intuitivo
		'(max-width: 640px)': {
			display: 'none',
		},
	},
})

export const navButtonPrev = style({
	left: vars.spacing.md,

	'@media': {
		'(max-width: 768px)': {
			left: vars.spacing.sm,
		},
	},
})

export const navButtonNext = style({
	right: vars.spacing.md,

	'@media': {
		'(max-width: 768px)': {
			right: vars.spacing.sm,
		},
	},
})

// Pagination Bullets - Scoped global styles

globalStyle(`${swiper} .swiper-pagination-bullet`, {
	width: '8px',
	height: '8px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.5)',
	border: '1.5px solid rgba(255, 255, 255, 0.8)',
	boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
	transition: `all ${vars.transitionDuration.fast} ease`,
	cursor: 'pointer',
	opacity: 1,
})

globalStyle(`${swiper} .swiper-pagination-bullet-active`, {
	backgroundColor: '#C7E356',
	borderColor: '#C7E356',
	width: '24px',
	borderRadius: '4px',
	boxShadow: '0 2px 8px rgba(199, 227, 86, 0.5)',
})

// Responsividade dos bullets
globalStyle('@media (max-width: 480px)', {})

export const bannerImage = style({
	position: 'absolute',
	top: 0,
	left: 0,
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	objectPosition: 'top center',
	// Melhora performance de renderização
	willChange: 'transform',
	/**
	 * Safari fix: Ensure image doesn't overflow container
	 * and force GPU layer for proper clipping
	 */
	transform: 'translateZ(0)',
	WebkitTransform: 'translateZ(0)',
})

// Degradê branco na parte inferior - fixo no bannerWrapper (não se move com o Swiper)
export const bannerGradient = style({
	position: 'absolute',
	bottom: 0,
	left: 0,
	right: 0,
	height: '38%',
	background:
		'linear-gradient(to top, #FAFAF9 0%, rgba(250, 250, 249, 0.85) 45%, transparent 100%)',
	pointerEvents: 'none',
	zIndex: 2,
})

export const bannerOverlay = style({
	position: 'absolute',
	bottom: vars.spacing.lg,
	left: vars.spacing.lg,
	zIndex: 2,
	backgroundColor: 'rgba(255, 255, 255, 0.95)',
	backdropFilter: 'blur(12px)',
	WebkitBackdropFilter: 'blur(12px)',
	padding: `${vars.spacing.md} ${vars.spacing.lg}`,
	borderRadius: vars.borderRadius.lg,
	maxWidth: '420px',
	boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.15)',
	// Animação sutil de entrada
	animation: `${fadeInUp} 0.5s ease-out`,

	'@media': {
		// Tablets
		'(max-width: 1024px)': {
			maxWidth: '360px',
			padding: `${vars.spacing.sm} ${vars.spacing.md}`,
		},
		// Mobile landscape
		'(max-width: 768px)': {
			bottom: '40px', // Acima das bolinhas de paginação
			left: vars.spacing.md,
			right: vars.spacing.md,
			maxWidth: 'none',
			width: 'auto',
			padding: `${vars.spacing.sm} ${vars.spacing.md}`,
		},
		// Mobile portrait - overlay acima das bolinhas
		'(max-width: 480px)': {
			bottom: '36px',
			left: vars.spacing.sm,
			right: vars.spacing.sm,
			padding: vars.spacing.sm,
			borderRadius: vars.borderRadius.md,
		},
		// Mobile muito pequeno
		'(max-width: 360px)': {
			bottom: '32px',
			left: vars.spacing.xs,
			right: vars.spacing.xs,
			padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
		},
	},
})

export const bannerTitle = style({
	fontSize: '1.375rem',
	fontWeight: vars.fontWeight.bold,
	color: '#1C1917',
	marginBottom: vars.spacing.xs,
	lineHeight: 1.25,
	// Limitar a 2 linhas com ellipsis
	display: '-webkit-box',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden',

	'@media': {
		'(max-width: 1024px)': {
			fontSize: '1.25rem',
		},
		'(max-width: 768px)': {
			fontSize: '1.125rem',
			marginBottom: '2px',
		},
		'(max-width: 480px)': {
			fontSize: '1rem',
			WebkitLineClamp: 1,
		},
		'(max-width: 360px)': {
			fontSize: '0.9375rem',
		},
	},
})

export const bannerDescription = style({
	fontSize: vars.fontSize.sm,
	color: '#57534E',
	lineHeight: 1.45,
	margin: 0,
	// Limitar a 2 linhas com ellipsis
	display: '-webkit-box',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden',

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xs,
			WebkitLineClamp: 1,
		},
		'(max-width: 480px)': {
			fontSize: '0.75rem',
		},
		// Ocultar descrição em telas muito pequenas
		'(max-width: 360px)': {
			display: 'none',
		},
	},
})

// ============================================
// Stats Grid
// ============================================

export const statsGrid = style({
	position: 'relative',
	zIndex: 10,
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing.lg,
	marginBottom: vars.spacing['2xl'],

	'@media': {
		'(min-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'(min-width: 1024px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'(min-width: 1400px)': {
			gridTemplateColumns: 'repeat(4, 1fr)',
		},
	},
})

// ============================================
// Content Grid & Cards
// ============================================

export const contentGrid = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing.lg,
	marginBottom: vars.spacing['2xl'],

	'@media': {
		'(min-width: 768px)': {
			gridTemplateColumns: '1fr',
		},
		'(min-width: 1200px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const card = style({
	backgroundColor: '#FFFFFF',
	borderRadius: vars.borderRadius.lg,
	boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
	border: '1px solid #F5F5F4',
	overflow: 'hidden',
})

export const cardHeader = style({
	padding: vars.spacing.lg,
	borderBottom: '1px solid #F5F5F4',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	backgroundColor: '#FAFAF9',

	'@media': {
		'(max-width: 640px)': {
			padding: vars.spacing.md,
		},
	},
})

export const cardHeaderContent = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	color: '#44403C',

	'@media': {
		'(max-width: 640px)': {
			gap: vars.spacing.sm,
		},
	},
})

export const cardTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: '#292524',

	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.base,
		},
	},
})

export const cardBody = style({
	padding: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			padding: vars.spacing.md,
		},
	},
})

// ============================================
// Activity Items
// ============================================

export const activityItem = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
	paddingBottom: vars.spacing.lg,
	marginBottom: vars.spacing.lg,
	borderBottom: '1px solid #F5F5F4',

	':last-child': {
		marginBottom: 0,
		paddingBottom: 0,
		borderBottom: 'none',
	},

	'@media': {
		'(max-width: 640px)': {
			gap: vars.spacing.sm,
			paddingBottom: vars.spacing.md,
			marginBottom: vars.spacing.md,
		},
	},
})

export const activityIcon = style({
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,

	'@media': {
		'(max-width: 640px)': {
			width: '28px',
			height: '28px',
		},
	},
})

export const activityIconColor = styleVariants({
	primary: {
		backgroundColor: '#F7FCE8',
		color: '#5E6C02',
	},
	success: {
		backgroundColor: '#D1FAE5',
		color: '#047857',
	},
	warning: {
		backgroundColor: '#FEF3C7',
		color: '#B45309',
	},
	error: {
		backgroundColor: '#FEE2E2',
		color: '#B91C1C',
	},
})

export const activityContent = style({
	flex: 1,
	minWidth: 0,
})

export const activityTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.bold,
	color: '#292524',
	marginBottom: vars.spacing.xs,

	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const activityDescription = style({
	fontSize: vars.fontSize.sm,
	color: '#78716C',

	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.xs,
		},
	},
})

export const activityTime = style({
	fontSize: vars.fontSize.xs,
	color: '#A8A29E',
	flexShrink: 0,
	fontWeight: vars.fontWeight.medium,

	'@media': {
		'(max-width: 640px)': {
			display: 'none',
		},
	},
})

// ============================================
// Task Items
// ============================================

export const taskItem = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
	paddingBottom: vars.spacing.lg,
	marginBottom: vars.spacing.lg,
	borderBottom: '1px solid #F5F5F4',

	':last-child': {
		marginBottom: 0,
		paddingBottom: 0,
		borderBottom: 'none',
	},

	'@media': {
		'(max-width: 640px)': {
			gap: vars.spacing.sm,
			paddingBottom: vars.spacing.md,
			marginBottom: vars.spacing.md,
		},
	},
})

export const taskIconWrapper = style({
	width: '40px',
	height: '40px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: '#F7FCE8',
	color: '#5E6C02',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,

	'@media': {
		'(max-width: 640px)': {
			width: '32px',
			height: '32px',
		},
	},
})

export const taskContent = style({
	flex: 1,
	minWidth: 0,
})

export const taskTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.bold,
	color: '#292524',
	marginBottom: vars.spacing.xs,

	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const taskDescription = style({
	fontSize: vars.fontSize.sm,
	color: '#78716C',

	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.xs,
		},
	},
})

export const taskPriority = style({
	fontSize: '0.65rem',
	padding: '4px 10px',
	borderRadius: vars.borderRadius.sm,
	fontWeight: vars.fontWeight.bold,
	flexShrink: 0,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',

	'@media': {
		'(max-width: 640px)': {
			padding: '3px 8px',
			fontSize: '0.6rem',
		},
	},
})

export const taskPriorityColor = styleVariants({
	high: {
		backgroundColor: '#FEE2E2',
		color: '#B91C1C',
	},
	medium: {
		backgroundColor: '#FEF3C7',
		color: '#B45309',
	},
	low: {
		backgroundColor: '#DBEAFE',
		color: '#1E40AF',
	},
})

// ============================================
// Quick Actions
// ============================================

export const quickActions = style({
	marginTop: vars.spacing['2xl'],

	'@media': {
		'(max-width: 640px)': {
			marginTop: vars.spacing.xl,
		},
	},
})

export const quickActionsTitle = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	color: '#292524',
	marginBottom: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.lg,
			marginBottom: vars.spacing.md,
		},
	},
})

export const quickActionsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			gap: vars.spacing.md,
		},
		'(min-width: 768px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'(min-width: 1024px)': {
			gridTemplateColumns: 'repeat(4, 1fr)',
		},
	},
})

export const quickActionCard = style({
	backgroundColor: '#FFFFFF',
	border: '2px solid #F5F5F4',
	borderRadius: vars.borderRadius.lg,
	padding: vars.spacing.xl,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: vars.spacing.md,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
	color: '#44403C',
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.bold,
	position: 'relative',

	':hover': {
		borderColor: '#C7E356',
		boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
		transform: 'translateY(-2px)',
		backgroundColor: '#F7FCE8',
		color: '#434D00',
	},

	'@media': {
		'(max-width: 640px)': {
			padding: vars.spacing.md,
			fontSize: vars.fontSize.sm,
			gap: vars.spacing.sm,
		},
	},
})

export const comingSoonBadge = style({
	position: 'absolute',
	top: vars.spacing.sm,
	right: vars.spacing.sm,
	fontSize: '0.65rem',
	padding: '3px 8px',
	borderRadius: vars.borderRadius.sm,
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',

	'@media': {
		'(max-width: 640px)': {
			fontSize: '0.6rem',
			padding: '2px 6px',
		},
	},
})

// ============================================
// Error Banner
// ============================================

export const errorBanner = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: '#FEE2E2',
	border: '1px solid #FECACA',
	borderRadius: vars.borderRadius.md,
	color: '#B91C1C',
	marginBottom: vars.spacing.lg,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
})

// ============================================
// Loading & Empty States
// ============================================

export const loadingState = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.xl,
	color: '#78716C',
	fontSize: vars.fontSize.sm,
})

const spin = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

export const spinner = style({
	animation: `${spin} 1s linear infinite`,
})

export const emptyState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.xl,
	color: '#78716C',
	fontSize: vars.fontSize.sm,
	textAlign: 'center',
})

export const emptyStateIcon = style({
	color: '#22C55E',
})

// ============================================
// Expiring Contracts
// ============================================

export const expiringContractItem = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.md,
	paddingBottom: vars.spacing.md,
	marginBottom: vars.spacing.md,
	borderBottom: '1px solid #F5F5F4',

	':last-child': {
		marginBottom: 0,
		paddingBottom: 0,
		borderBottom: 'none',
	},

	'@media': {
		'(max-width: 640px)': {
			flexDirection: 'column',
			alignItems: 'flex-start',
			gap: vars.spacing.sm,
		},
	},
})

export const expiringContractInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
	flex: 1,
	minWidth: 0,
})

export const expiringContractHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	color: '#44403C',
})

export const expiringContractId = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: '#292524',
})

export const expiringContractDetails = style({
	fontSize: vars.fontSize.xs,
	color: '#78716C',
	margin: 0,
})

export const expiringContractRight = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	flexShrink: 0,

	'@media': {
		'(max-width: 640px)': {
			width: '100%',
			justifyContent: 'space-between',
		},
	},
})

export const expiringContractValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: '#292524',
})

export const expiringContractBadge = style({
	fontSize: '0.65rem',
	padding: '3px 8px',
	borderRadius: vars.borderRadius.sm,
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const badgeUrgent = style({
	backgroundColor: '#FEE2E2',
	color: '#B91C1C',
})

export const badgeWarning = style({
	backgroundColor: '#FEF3C7',
	color: '#B45309',
})

// ============================================
// Skeleton Styles
// ============================================

export const statCardSkeleton = style({
	backgroundColor: '#FFFFFF',
	borderRadius: vars.borderRadius.lg,
	padding: vars.spacing.xl,
	boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
	border: '1px solid #F5F5F4',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			padding: vars.spacing.lg,
			gap: vars.spacing.md,
		},
	},
})

export const statCardSkeletonHeader = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'flex-start',
})
