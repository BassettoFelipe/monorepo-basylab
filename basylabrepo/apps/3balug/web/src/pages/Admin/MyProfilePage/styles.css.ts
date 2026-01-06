import { keyframes, style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

const fadeIn = keyframes({
	from: { opacity: 0, transform: 'translateY(4px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

const shimmer = keyframes({
	'0%': { backgroundPosition: '-200% 0' },
	'100%': { backgroundPosition: '200% 0' },
})

// ===========================================
// Page Container
// ===========================================
export const page = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
	animation: `${fadeIn} 0.2s ease-out`,

	'@media': {
		[mediaQuery.md]: {
			gap: vars.spacing.xl,
		},
	},
})

// ===========================================
// Profile Header
// ===========================================
export const profileHeader = style({
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	borderRadius: vars.borderRadius.xl,
	overflow: 'hidden',
	border: `1px solid ${vars.color.border.primary}`,
	backgroundColor: vars.color.bg.primary,
})

export const headerGradient = style({
	height: '120px',
	background: `linear-gradient(135deg, ${vars.color.primary.dark} 0%, #1a2100 50%, ${vars.color.primary.dark} 100%)`,
	position: 'relative',

	'::before': {
		content: '""',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: `radial-gradient(ellipse at 70% 0%, ${vars.color.primary.main}30 0%, transparent 60%)`,
		pointerEvents: 'none',
	},

	'@media': {
		[mediaQuery.md]: {
			height: '140px',
		},
	},
})

export const headerContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
	padding: vars.spacing.lg,
	paddingTop: vars.spacing.lg,

	'@media': {
		[mediaQuery.sm]: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: vars.spacing.xl,
		},
		[mediaQuery.md]: {
			padding: vars.spacing.xl,
		},
	},
})

export const avatarWrapper = style({
	position: 'relative',
	alignSelf: 'center',
	flexShrink: 0,
	marginTop: '-64px',
	padding: '4px',
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.full,
	boxShadow: vars.shadow.lg,

	'@media': {
		[mediaQuery.sm]: {
			alignSelf: 'flex-start',
			marginTop: '-56px',
		},
	},
})

export const avatarOverlay = style({
	position: 'absolute',
	inset: 0,
	borderRadius: vars.borderRadius.full,
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	opacity: 0,
	transition: `opacity ${vars.transitionDuration.fast} ${vars.transitionTiming.easeOut}`,
	cursor: 'pointer',

	selectors: {
		[`${avatarWrapper}:hover &`]: {
			opacity: 1,
		},
	},
})

export const avatarBtn = style({
	width: '36px',
	height: '36px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.bg.primary,
	border: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	cursor: 'pointer',
	color: vars.color.text.primary,
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeOut}`,
	boxShadow: vars.shadow.md,

	':hover': {
		transform: 'scale(1.1)',
		backgroundColor: vars.color.bg.secondary,
	},

	':active': {
		transform: 'scale(0.95)',
	},

	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
		transform: 'none',
	},
})

export const avatarBtnDelete = style({
	':hover': {
		backgroundColor: vars.color.error.light,
		color: vars.color.error.dark,
	},
})

export const fileInput = style({
	display: 'none',
})

export const profileInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
	textAlign: 'center',
	flex: 1,

	'@media': {
		[mediaQuery.sm]: {
			textAlign: 'left',
			paddingTop: vars.spacing.sm,
		},
	},
})

export const profileNameRow = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: vars.spacing.sm,

	'@media': {
		[mediaQuery.sm]: {
			flexDirection: 'row',
			alignItems: 'center',
		},
	},
})

export const profileName = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	lineHeight: vars.lineHeight.tight,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize['2xl'],
		},
	},
})

export const roleBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
})

export const profileMeta = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	marginTop: vars.spacing.xs,

	'@media': {
		[mediaQuery.sm]: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: vars.spacing.lg,
			flexWrap: 'wrap',
		},
	},
})

export const profileMetaItem = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,

	'@media': {
		[mediaQuery.sm]: {
			justifyContent: 'flex-start',
		},
	},
})

export const profileMetaIcon = style({
	flexShrink: 0,
	color: vars.color.text.secondary,
})

export const profileStats = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: vars.spacing.lg,
	paddingTop: vars.spacing.md,
	marginTop: vars.spacing.md,
	borderTop: `1px solid ${vars.color.border.primary}`,

	'@media': {
		[mediaQuery.sm]: {
			gap: vars.spacing.xl,
		},
	},
})

export const statItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const statIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const statContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const statValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	lineHeight: vars.lineHeight.tight,
})

export const statLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

// ===========================================
// Cards Grid (50/50 no desktop)
// ===========================================
export const cardsGrid = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing.lg,

	'@media': {
		[mediaQuery.md]: {
			gridTemplateColumns: '1fr 1fr',
		},
	},
})

// ===========================================
// Card
// ===========================================
export const card = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	border: `1px solid ${vars.color.border.primary}`,
	overflow: 'hidden',
	display: 'flex',
	flexDirection: 'column',
})

export const cardHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.md,
	padding: vars.spacing.lg,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const cardHeaderLeft = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
})

export const cardIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '40px',
	height: '40px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const cardTitleGroup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const cardTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const cardSubtitle = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	margin: 0,
})

export const cardBody = style({
	padding: vars.spacing.lg,
	flex: 1,
})

export const cardFooter = style({
	padding: vars.spacing.lg,
	paddingTop: 0,
})

// ===========================================
// Info List
// ===========================================
export const infoList = style({
	display: 'flex',
	flexDirection: 'column',
})

export const infoItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.md} 0`,
	borderBottom: `1px solid ${vars.color.border.primary}`,

	':last-child': {
		borderBottom: 'none',
		paddingBottom: 0,
	},

	':first-child': {
		paddingTop: 0,
	},

	'@media': {
		[mediaQuery.sm]: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
		},
	},
})

export const infoLabel = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
})

export const infoValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

export const infoIcon = style({
	color: vars.color.text.secondary,
	flexShrink: 0,
})

// ===========================================
// ===========================================
export const statusBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
})

export const statusActive = style({
	backgroundColor: vars.color.success.light,
	color: vars.color.success.dark,
})

export const statusPending = style({
	backgroundColor: vars.color.warning.light,
	color: vars.color.warning.dark,
})

export const statusInactive = style({
	backgroundColor: vars.color.error.light,
	color: vars.color.error.dark,
})

// ===========================================
// Form
// ===========================================
export const form = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const formActions = style({
	display: 'flex',
	gap: vars.spacing.sm,
	justifyContent: 'flex-end',
	marginTop: vars.spacing.xs,
})

// ===========================================
// Info Box
// ===========================================
export const infoBox = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	marginTop: vars.spacing.md,
})

export const infoBoxIcon = style({
	color: vars.color.text.secondary,
	flexShrink: 0,
	marginTop: '2px',
})

export const infoBoxText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
	lineHeight: vars.lineHeight.relaxed,
})

// ===========================================
// Empty State
// ===========================================
export const emptyState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.xl,
	textAlign: 'center',
})

export const emptyStateText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
})

// ===========================================
// Error State
// ===========================================
export const errorState = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing['3xl'],
	color: vars.color.text.secondary,
})

// ===========================================
// Skeleton
// ===========================================
export const skeleton = style({
	backgroundColor: vars.color.bg.secondary,
	background: `linear-gradient(90deg, ${vars.color.bg.secondary} 25%, ${vars.color.neutral.grayLight} 50%, ${vars.color.bg.secondary} 75%)`,
	backgroundSize: '200% 100%',
	animation: `${shimmer} 1.5s infinite`,
	borderRadius: vars.borderRadius.md,
})

export const skeletonText = style({
	marginBottom: vars.spacing.sm,
})

// ===========================================
// Custom Fields
// ===========================================
export const customFieldsGrid = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
})

export const customFieldWrapper = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const customFieldLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const customFieldTextarea = style({
	width: '100%',
	minHeight: '100px',
	padding: vars.spacing.md,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	resize: 'vertical',
	fontFamily: 'inherit',
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeOut}`,

	'::placeholder': {
		color: vars.color.text.secondary,
	},

	':focus': {
		outline: 'none',
		borderColor: vars.color.primary.main,
		boxShadow: `0 0 0 3px ${vars.color.primary.main}20`,
	},

	':disabled': {
		backgroundColor: vars.color.bg.secondary,
		cursor: 'not-allowed',
		opacity: 0.7,
	},
})

export const checkboxWrapper = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	cursor: 'pointer',
})

export const checkboxGroupOptions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	padding: vars.spacing.sm,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	transition: `border-color ${vars.transitionDuration.base}`,
})

export const checkboxGroupOptionsError = style({
	borderColor: vars.color.error.main,
})

export const checkboxWrapperError = style({
	padding: vars.spacing.sm,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
})

export const checkboxInput = style({
	width: '18px',
	height: '18px',
	accentColor: vars.color.primary.main,
	cursor: 'pointer',

	':disabled': {
		cursor: 'not-allowed',
		opacity: 0.7,
	},
})

export const checkboxLabel = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
})
