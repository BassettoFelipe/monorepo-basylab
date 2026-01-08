import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const container = style({
	maxWidth: '1000px',
	margin: '0 auto',
})

// Page Header
export const pageHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: vars.spacing.lg,
	gap: vars.spacing.md,
})

export const pageHeaderLeft = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const backButton = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	border: 'none',
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.fast}`,
	textDecoration: 'none',

	':hover': {
		backgroundColor: vars.color.bg.tertiary,
		color: vars.color.text.primary,
	},
})

export const pageTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const pageHeaderRight = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

// Profile Card
export const profileCard = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	border: `1px solid ${vars.color.border.primary}`,
	padding: vars.spacing.lg,
	marginBottom: vars.spacing.lg,
	boxShadow: vars.shadow.sm,
})

export const profileHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			flexDirection: 'column',
			alignItems: 'flex-start',
		},
	},
})

export const avatarContainer = style({
	position: 'relative',
	flexShrink: 0,
})

export const avatar = style({
	width: '80px',
	height: '80px',
	borderRadius: vars.borderRadius.full,
	objectFit: 'cover',
	border: `3px solid ${vars.color.bg.primary}`,
	boxShadow: vars.shadow.md,
})

export const avatarFallback = style({
	width: '80px',
	height: '80px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: '28px',
	fontWeight: vars.fontWeight.bold,
	border: `3px solid ${vars.color.bg.primary}`,
	boxShadow: vars.shadow.md,
})

export const statusIndicator = style({
	position: 'absolute',
	bottom: '2px',
	right: '2px',
	width: '18px',
	height: '18px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: '#22C55E',
	border: `2px solid ${vars.color.bg.primary}`,
})

export const profileInfo = style({
	flex: 1,
	minWidth: 0,
})

export const nameRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	marginBottom: vars.spacing.xs,
})

export const name = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `2px ${vars.spacing.xs}`,
	borderRadius: vars.borderRadius.sm,
	fontSize: '10px',
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const badgeCpf = style({
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
})

export const badgeCnpj = style({
	backgroundColor: '#FEF3C7',
	color: '#92400E',
})

export const document = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	fontFamily: vars.fontFamily.mono,
	marginBottom: vars.spacing.sm,
})

export const quickStats = style({
	display: 'flex',
	gap: vars.spacing.lg,
	flexWrap: 'wrap',
})

export const statItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
})

export const statIcon = style({
	color: vars.color.primary.dark,
})

export const statValue = style({
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

// Content Layout
export const content = style({
	display: 'grid',
	gridTemplateColumns: '1fr 300px',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 900px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const mainColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const sideColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

// Card
export const card = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	border: `1px solid ${vars.color.border.primary}`,
	padding: vars.spacing.md,
	boxShadow: vars.shadow.sm,
})

export const cardHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: vars.spacing.md,
	paddingBottom: vars.spacing.sm,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const cardTitle = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const cardTitleIcon = style({
	color: vars.color.primary.dark,
})

export const cardCount = style({
	fontSize: '11px',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	backgroundColor: vars.color.primary.main,
	padding: `2px 8px`,
	borderRadius: vars.borderRadius.full,
})

// Contact Grid
export const contactGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 500px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const contactItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	border: `1px solid ${vars.color.border.primary}`,
	transition: `all ${vars.transitionDuration.fast}`,

	':hover': {
		borderColor: vars.color.primary.main,
		boxShadow: vars.shadow.sm,
	},
})

export const contactIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '44px',
	height: '44px',
	borderRadius: vars.borderRadius.xl,
	flexShrink: 0,
})

export const contactIconPhone = style({
	backgroundColor: '#ECFDF5',
	color: '#059669',
})

export const contactIconEmail = style({
	backgroundColor: '#EFF6FF',
	color: '#2563EB',
})

export const contactInfo = style({
	flex: 1,
	minWidth: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
})

export const contactLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	fontWeight: vars.fontWeight.medium,
	display: 'block',
})

export const contactValue = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	textDecoration: 'none',
	display: 'block',

	':hover': {
		color: vars.color.primary.dark,
	},
})

export const contactValueMuted = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.disabled,
	fontStyle: 'italic',
})

// Info Grid
export const infoGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: vars.spacing.sm,

	'@media': {
		'(max-width: 500px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const infoItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
})

export const infoLabel = style({
	fontSize: '10px',
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.3px',
})

export const infoValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const infoValueMuted = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.disabled,
})

// Address
export const addressMain = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	marginBottom: vars.spacing.sm,
})

export const addressIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: '#FEF3C7',
	color: '#92400E',
	flexShrink: 0,
})

export const addressInfo = style({
	flex: 1,
})

export const addressLine = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	lineHeight: 1.4,
	margin: 0,
})

export const addressSecondary = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	marginTop: '2px',
})

// Documents
export const documentsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
	gap: vars.spacing.sm,
})

export const documentCard = style({
	display: 'flex',
	flexDirection: 'column',
	borderRadius: vars.borderRadius.lg,
	border: `1px solid ${vars.color.border.primary}`,
	overflow: 'hidden',
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.fast}`,

	':hover': {
		borderColor: vars.color.primary.main,
		boxShadow: vars.shadow.md,
		transform: 'translateY(-2px)',
	},
})

export const documentPreview = style({
	position: 'relative',
	width: '100%',
	height: '70px',
	backgroundColor: vars.color.bg.secondary,
	overflow: 'hidden',
})

export const documentImage = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
})

export const documentIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	height: '100%',
	backgroundColor: '#FEE2E2',
	color: '#DC2626',
})

export const documentOverlay = style({
	position: 'absolute',
	inset: 0,
	backgroundColor: 'rgba(0, 0, 0, 0.6)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	opacity: 0,
	transition: `opacity ${vars.transitionDuration.fast}`,

	selectors: {
		[`${documentCard}:hover &`]: {
			opacity: 1,
		},
	},
})

export const documentAction = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '28px',
	height: '28px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.primary,
	border: 'none',
	cursor: 'pointer',
	transition: `transform ${vars.transitionDuration.fast}`,
	textDecoration: 'none',

	':hover': {
		transform: 'scale(1.1)',
	},
})

export const documentInfo = style({
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
})

export const documentName = style({
	fontSize: '11px',
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	marginBottom: '1px',
})

export const documentType = style({
	fontSize: '10px',
	color: vars.color.text.secondary,
})

export const emptyState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	color: vars.color.text.disabled,
	gap: vars.spacing.xs,
})

export const emptyStateText = style({
	fontSize: vars.fontSize.xs,
	margin: 0,
})

// Notes
export const notesContent = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	lineHeight: 1.5,
	whiteSpace: 'pre-wrap',
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	borderLeft: `3px solid ${vars.color.primary.main}`,
})

// Properties Card
export const propertiesContent = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	gap: vars.spacing.xs,
})

export const propertiesIcon = style({
	color: vars.color.primary.dark,
})

export const propertiesCount = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const propertiesLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const viewAllLink = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.sm,
	marginTop: vars.spacing.sm,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.bold,
	textDecoration: 'none',
	transition: `all ${vars.transitionDuration.fast}`,

	':hover': {
		filter: 'brightness(0.95)',
	},
})

// Metadata Card
export const metadataList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const metadataItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.xs,
})

export const metadataIcon = style({
	color: vars.color.text.disabled,
	flexShrink: 0,
})

export const metadataInfo = style({
	flex: 1,
})

export const metadataLabel = style({
	fontSize: '10px',
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.3px',
})

export const metadataValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// Error/Loading
export const loadingContainer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const errorContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '300px',
	gap: vars.spacing.md,
	textAlign: 'center',
})

export const errorIcon = style({
	color: vars.color.error.main,
})

export const errorTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const errorDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
})
