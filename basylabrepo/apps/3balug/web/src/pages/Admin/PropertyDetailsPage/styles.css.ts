import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

// ============================================
// Container & Layout
// ============================================

export const container = style({
	maxWidth: '1200px',
	margin: '0 auto',
})

export const backLink = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
	textDecoration: 'none',
	marginBottom: vars.spacing.lg,
	transition: `color ${vars.transitionDuration.base}`,

	':hover': {
		color: vars.color.text.primary,
	},
})

// ============================================
// Hero Banner (similar ao dashboard carousel)
// ============================================

export const heroBanner = style({
	position: 'relative',
	width: '100vw',
	marginLeft: '-50vw',
	left: '50%',
	marginTop: `calc(-1 * ${vars.spacing['2xl']})`,
	marginBottom: '-60px',
	height: 'clamp(350px, 45vw, 550px)',
	overflow: 'hidden',

	'@media': {
		'(max-width: 1024px)': {
			marginBottom: '-50px',
			height: 'clamp(300px, 40vw, 450px)',
		},
		'(max-width: 768px)': {
			marginTop: `calc(-1 * ${vars.spacing.lg})`,
			marginBottom: '-40px',
			height: 'clamp(280px, 50vw, 400px)',
		},
		'(max-width: 640px)': {
			marginTop: `calc(-1 * ${vars.spacing.md})`,
			marginBottom: '-30px',
			height: 'clamp(250px, 60vw, 350px)',
		},
	},
})

export const heroImage = style({
	position: 'absolute',
	top: 0,
	left: 0,
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	objectPosition: 'center',
	willChange: 'transform',
	transform: 'translateZ(0)',
	WebkitTransform: 'translateZ(0)',
})

export const heroGradient = style({
	position: 'absolute',
	bottom: 0,
	left: 0,
	right: 0,
	height: '50%',
	background:
		'linear-gradient(to top, #FAFAF9 0%, rgba(250, 250, 249, 0.9) 40%, rgba(250, 250, 249, 0.4) 70%, transparent 100%)',
	pointerEvents: 'none',
	zIndex: 2,
})

export const heroNoImage = style({
	position: 'absolute',
	top: 0,
	left: 0,
	width: '100%',
	height: '100%',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	gap: vars.spacing.md,
})

export const heroBackButton = style({
	position: 'absolute',
	top: vars.spacing.lg,
	left: vars.spacing.lg,
	zIndex: 10,
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	backgroundColor: 'rgba(255, 255, 255, 0.95)',
	backdropFilter: 'blur(8px)',
	WebkitBackdropFilter: 'blur(8px)',
	borderRadius: vars.borderRadius.full,
	color: vars.color.text.primary,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: '#FFFFFF',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	},

	'@media': {
		'(max-width: 768px)': {
			top: vars.spacing.md,
			left: vars.spacing.md,
			padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
			fontSize: vars.fontSize.xs,
		},
	},
})

export const heroEditButton = style({
	position: 'absolute',
	top: vars.spacing.lg,
	right: vars.spacing.lg,
	zIndex: 10,

	'@media': {
		'(max-width: 768px)': {
			top: vars.spacing.md,
			right: vars.spacing.md,
		},
	},
})

export const photoCount = style({
	position: 'absolute',
	bottom: vars.spacing.xl,
	right: vars.spacing.xl,
	zIndex: 10,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	backgroundColor: 'rgba(0, 0, 0, 0.7)',
	backdropFilter: 'blur(8px)',
	borderRadius: vars.borderRadius.md,
	color: '#FFFFFF',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: 'rgba(0, 0, 0, 0.85)',
	},

	'@media': {
		'(max-width: 768px)': {
			bottom: vars.spacing.lg,
			right: vars.spacing.lg,
			padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
			fontSize: vars.fontSize.xs,
		},
	},
})

// ============================================
// Property Header (sobre o banner)
// ============================================

export const propertyHeader = style({
	position: 'relative',
	zIndex: 10,
	marginBottom: vars.spacing.xl,
})

export const propertyTitle = style({
	fontSize: '2rem',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	marginBottom: vars.spacing.sm,
	lineHeight: 1.2,

	'@media': {
		'(max-width: 768px)': {
			fontSize: '1.5rem',
		},
		'(max-width: 640px)': {
			fontSize: '1.25rem',
		},
	},
})

export const propertyLocation = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	margin: 0,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	marginBottom: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const badgesRow = style({
	display: 'flex',
	gap: vars.spacing.sm,
	flexWrap: 'wrap',
})

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const badgeHouse = style({ backgroundColor: '#DBEAFE', color: '#1E40AF' })
export const badgeApartment = style({ backgroundColor: '#E0E7FF', color: '#4338CA' })
export const badgeLand = style({ backgroundColor: '#FEF3C7', color: '#92400E' })
export const badgeCommercial = style({ backgroundColor: '#D1FAE5', color: '#065F46' })
export const badgeRural = style({ backgroundColor: '#ECFCCB', color: '#3F6212' })

export const badgeRent = style({ backgroundColor: '#DBEAFE', color: '#1E40AF' })
export const badgeSale = style({ backgroundColor: '#D1FAE5', color: '#065F46' })
export const badgeBoth = style({ backgroundColor: '#E0E7FF', color: '#4338CA' })

export const badgeAvailable = style({ backgroundColor: '#D1FAE5', color: '#065F46' })
export const badgeRented = style({ backgroundColor: '#DBEAFE', color: '#1E40AF' })
export const badgeSold = style({ backgroundColor: '#FEE2E2', color: '#991B1B' })
export const badgeMaintenance = style({ backgroundColor: '#FEF3C7', color: '#92400E' })
export const badgeUnavailable = style({ backgroundColor: '#F3F4F6', color: '#6B7280' })

// ============================================
// Main Content Layout
// ============================================

export const content = style({
	display: 'grid',
	gridTemplateColumns: '1fr 380px',
	gap: vars.spacing.xl,

	'@media': {
		'(max-width: 1024px)': {
			gridTemplateColumns: '1fr 340px',
		},
		'(max-width: 900px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const mainColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xl,
})

export const sideColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 900px)': {
			order: -1,
		},
	},
})

// ============================================
// Price Card (destaque)
// ============================================

export const priceCardSticky = style({
	position: 'sticky',
	top: vars.spacing.lg,
})

export const priceCard = style({
	backgroundColor: '#FFFFFF',
	borderRadius: vars.borderRadius.xl,
	border: '1px solid #E7E5E4',
	padding: vars.spacing.xl,
	boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
})

export const priceMain = style({
	marginBottom: vars.spacing.lg,
	paddingBottom: vars.spacing.lg,
	borderBottom: '1px solid #F5F5F4',
})

export const priceLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	marginBottom: vars.spacing.xs,
})

export const priceValue = style({
	fontSize: '1.75rem',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	lineHeight: 1.2,

	'@media': {
		'(max-width: 640px)': {
			fontSize: '1.5rem',
		},
	},
})

export const pricePerMonth = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	fontWeight: vars.fontWeight.regular,
})

export const priceDivider = style({
	marginTop: vars.spacing.md,
	paddingTop: vars.spacing.md,
	borderTop: '1px dashed #E7E5E4',
})

export const priceSecondary = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.xs,

	':last-child': {
		marginBottom: 0,
	},
})

export const priceSecondaryValue = style({
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// ============================================
// Characteristics Grid
// ============================================

export const characteristicsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(4, 1fr)',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const characteristicItem = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	padding: vars.spacing.md,
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.lg,
	gap: vars.spacing.xs,
})

export const characteristicIcon = style({
	width: '40px',
	height: '40px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: '#F7FCE8',
	color: '#5E6C02',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
})

export const characteristicValue = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const characteristicLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

// ============================================
// Cards
// ============================================

export const card = style({
	backgroundColor: '#FFFFFF',
	borderRadius: vars.borderRadius.xl,
	border: '1px solid #E7E5E4',
	padding: vars.spacing.xl,
	boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',

	'@media': {
		'(max-width: 640px)': {
			padding: vars.spacing.lg,
			borderRadius: vars.borderRadius.lg,
		},
	},
})

export const cardTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	marginBottom: vars.spacing.lg,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const cardTitleIcon = style({
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: '#F7FCE8',
	color: '#5E6C02',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
})

// ============================================
// Description
// ============================================

export const description = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
	lineHeight: 1.7,
	whiteSpace: 'pre-wrap',
	margin: 0,
})

export const noDescription = style({
	color: vars.color.text.secondary,
	fontStyle: 'italic',
})

// ============================================
// Features/Amenities
// ============================================

export const featuresList = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
	gap: vars.spacing.sm,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const featureTag = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.sm,
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
})

export const featureIcon = style({
	width: '24px',
	height: '24px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: '#D1FAE5',
	color: '#047857',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
})

// ============================================
// Address
// ============================================

export const addressText = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
	lineHeight: 1.6,
	margin: 0,
})

// ============================================
// Owner/Broker Cards
// ============================================

export const ownerCard = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.lg,
})

export const ownerAvatar = style({
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: '#F7FCE8',
	color: '#5E6C02',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
})

export const ownerInfo = style({
	flex: 1,
	minWidth: 0,
})

export const ownerName = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const ownerRole = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
})

// ============================================
// Photo Gallery Modal
// ============================================

export const galleryModal = style({
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundColor: 'rgba(0, 0, 0, 0.95)',
	zIndex: 1000,
	display: 'flex',
	flexDirection: 'column',
})

export const galleryHeader = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: vars.spacing.lg,
	color: '#FFFFFF',
})

export const galleryTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.medium,
})

export const galleryClose = style({
	width: '40px',
	height: '40px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.1)',
	border: 'none',
	color: '#FFFFFF',
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
})

export const galleryMain = style({
	flex: 1,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.lg,
	position: 'relative',
	overflow: 'auto',
	minHeight: 0,
})

export const galleryImage = style({
	maxWidth: '90vw',
	maxHeight: 'calc(100vh - 180px)',
	objectFit: 'contain',
	borderRadius: vars.borderRadius.md,

	'@media': {
		'(max-width: 768px)': {
			maxWidth: '95vw',
			maxHeight: 'calc(100vh - 160px)',
		},
	},
})

export const galleryNav = style({
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.1)',
	border: 'none',
	color: '#FFFFFF',
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},

	':disabled': {
		opacity: 0.3,
		cursor: 'not-allowed',
	},
})

export const galleryNavPrev = style({
	left: vars.spacing.lg,
})

export const galleryNavNext = style({
	right: vars.spacing.lg,
})

export const galleryThumbnails = style({
	display: 'flex',
	gap: vars.spacing.sm,
	padding: vars.spacing.lg,
	overflowX: 'auto',
	justifyContent: 'center',
})

export const galleryThumbnail = style({
	width: '80px',
	height: '60px',
	borderRadius: vars.borderRadius.md,
	overflow: 'hidden',
	cursor: 'pointer',
	border: '2px solid transparent',
	opacity: 0.6,
	transition: `all ${vars.transitionDuration.base}`,
	flexShrink: 0,

	':hover': {
		opacity: 0.9,
	},
})

export const galleryThumbnailActive = style({
	borderColor: '#C7E356',
	opacity: 1,
})

export const galleryThumbnailImage = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
})

// ============================================
// Loading & Error States
// ============================================

export const loadingContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
})

export const errorContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
	gap: vars.spacing.md,
	color: vars.color.text.secondary,
})

// ============================================
// Skeleton Loading
// ============================================

export const skeletonBanner = style({
	position: 'relative',
	width: '100vw',
	marginLeft: '-50vw',
	left: '50%',
	marginTop: `calc(-1 * ${vars.spacing['2xl']})`,
	marginBottom: '-60px',
	height: 'clamp(350px, 45vw, 550px)',
	backgroundColor: vars.color.bg.secondary,

	'@media': {
		'(max-width: 768px)': {
			marginTop: `calc(-1 * ${vars.spacing.lg})`,
			height: 'clamp(280px, 50vw, 400px)',
		},
	},
})

// ============================================
// Info Grid (legacy support)
// ============================================

export const infoGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.md,
})

export const infoItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const infoLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	display: 'flex',
	alignItems: 'center',
})

export const infoValue = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// ============================================
// Property Meta (code, marketplace badge)
// ============================================

export const propertyMeta = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	marginBottom: vars.spacing.sm,
	flexWrap: 'wrap',
})

export const propertyCode = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: '#F5F5F4',
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	border: 'none',
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	position: 'relative',

	':hover': {
		backgroundColor: '#E7E5E4',
		color: vars.color.text.primary,
	},
})

export const copyIcon = style({
	opacity: 0.5,
	transition: `opacity ${vars.transitionDuration.base}`,

	selectors: {
		[`${propertyCode}:hover &`]: {
			opacity: 1,
		},
	},
})

export const copiedTooltip = style({
	position: 'absolute',
	top: '-32px',
	left: '50%',
	transform: 'translateX(-50%)',
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: '#292524',
	color: '#FFFFFF',
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	whiteSpace: 'nowrap',
	zIndex: 10,

	'::after': {
		content: '""',
		position: 'absolute',
		bottom: '-4px',
		left: '50%',
		transform: 'translateX(-50%)',
		width: 0,
		height: 0,
		borderLeft: '4px solid transparent',
		borderRight: '4px solid transparent',
		borderTop: '4px solid #292524',
	},
})

export const marketplaceBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
})

// ============================================
// Details Grid (suites, floor, year, areas)
// ============================================

export const detailsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr 1fr',
		},
	},
})

export const detailItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	padding: vars.spacing.md,
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.md,
})

export const detailLabel = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const detailValue = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

// ============================================
// Notes
// ============================================

export const notesText = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
	lineHeight: 1.7,
	whiteSpace: 'pre-wrap',
	margin: 0,
	padding: vars.spacing.md,
	backgroundColor: '#FFFBEB',
	borderRadius: vars.borderRadius.md,
	borderLeft: '3px solid #F59E0B',
})

// ============================================
// Commission Section
// ============================================

export const commissionSection = style({
	marginTop: vars.spacing.lg,
	paddingTop: vars.spacing.lg,
	borderTop: '1px solid #F5F5F4',
})

export const commissionHeader = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: vars.spacing.sm,
})

export const commissionTitle = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	margin: 0,
})

// ============================================
// Registration Info
// ============================================

export const registrationInfo = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	padding: vars.spacing.md,
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.md,
	justifyContent: 'center',
})

// ============================================
// Admin Only Badges
// ============================================

export const cardTitleRow = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	gap: vars.spacing.md,
	marginBottom: vars.spacing.lg,
	flexWrap: 'wrap',
})

// Override cardTitle margin when inside cardTitleRow
export const cardTitleNoMargin = style({
	marginBottom: 0,
})

export const adminOnlyBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: '#FEF3C7',
	color: '#92400E',
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	flexShrink: 0,

	'@media': {
		'(max-width: 640px)': {
			fontSize: '0.65rem',
			padding: `3px ${vars.spacing.xs}`,
		},
	},
})

export const adminOnlyBadgeSmall = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: '3px',
	padding: '3px 8px',
	backgroundColor: '#F3F4F6',
	color: '#6B7280',
	borderRadius: vars.borderRadius.sm,
	fontSize: '0.65rem',
	fontWeight: vars.fontWeight.medium,
	textTransform: 'uppercase',
	letterSpacing: '0.3px',
	flexShrink: 0,
})

// ============================================
// Photo Gallery Section (Grid on page)
// ============================================

export const photoGallerySection = style({
	maxWidth: '1200px',
	margin: '0 auto',
	marginBottom: vars.spacing.xl,
})

export const photoCountBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: '#F5F5F4',
	color: vars.color.text.secondary,
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
})

export const photoGalleryGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: vars.spacing.sm,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const photoGalleryItem = style({
	position: 'relative',
	overflow: 'hidden',
	cursor: 'pointer',
	border: 'none',
	padding: 0,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	aspectRatio: '4 / 3',

	':hover': {
		opacity: 0.9,
	},

	':focus-visible': {
		outline: `2px solid #C7E356`,
		outlineOffset: '2px',
	},
})

export const photoGalleryItemMain = style({})

export const photoGalleryImage = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	transition: `transform ${vars.transitionDuration.base}`,

	selectors: {
		[`${photoGalleryItem}:hover &`]: {
			transform: 'scale(1.05)',
		},
	},
})

export const photoGalleryOverlay = style({
	position: 'absolute',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundColor: 'rgba(0, 0, 0, 0.6)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
})

export const photoGalleryMore = style({
	color: '#FFFFFF',
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
})

// Legacy exports for compatibility
export const header = style({})
export const headerInfo = style({})
export const title = style({})
export const subtitle = style({})
export const headerActions = style({})
export const galleryContainer = style({})
export const mainImage = style({})
export const thumbnailsRow = style({})
export const thumbnailButton = style({})
export const thumbnail = style({})
export const thumbnailActive = style({})
export const noPhotos = style({})
