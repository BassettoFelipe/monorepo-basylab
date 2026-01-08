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
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: 'transparent',
	color: vars.color.text.secondary,
	border: 'none',
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.fast}`,
	textDecoration: 'none',

	':hover': {
		backgroundColor: vars.color.bg.secondary,
		color: vars.color.text.primary,
	},
})

export const pageTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	margin: 0,
})

export const pageHeaderRight = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

// Profile Header
export const profileHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,
	marginBottom: vars.spacing.xl,
	paddingBottom: vars.spacing.lg,
	borderBottom: `1px solid ${vars.color.border.primary}`,

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
	width: '72px',
	height: '72px',
	borderRadius: vars.borderRadius.full,
	objectFit: 'cover',
})

export const avatarFallback = style({
	width: '72px',
	height: '72px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: '24px',
	fontWeight: vars.fontWeight.bold,
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

export const profileMeta = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
})

export const metaItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

export const metaIcon = style({
	color: vars.color.text.disabled,
})

// Content Layout
export const content = style({
	display: 'grid',
	gridTemplateColumns: '1fr 320px',
	gap: vars.spacing.xl,

	'@media': {
		'(max-width: 900px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const mainColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
})

export const sideColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
})

// Section
export const section = style({
	marginBottom: vars.spacing.xs,
})

export const sectionTitle = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	marginBottom: vars.spacing.sm,
})

// Info Grid
export const infoGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.sm,

	'@media': {
		'(max-width: 500px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const infoGridThree = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: vars.spacing.sm,

	'@media': {
		'(max-width: 500px)': {
			gridTemplateColumns: '1fr',
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

export const infoItemClickable = style({
	cursor: 'pointer',
	transition: `background-color ${vars.transitionDuration.fast}`,

	':hover': {
		backgroundColor: vars.color.bg.tertiary,
	},
})

export const infoLabel = style({
	fontSize: '11px',
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

export const infoValueLink = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	textDecoration: 'none',

	':hover': {
		color: vars.color.primary.dark,
	},
})

// Card
export const card = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.lg,
	border: `1px solid ${vars.color.border.primary}`,
	padding: vars.spacing.md,
})

export const cardHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: vars.spacing.sm,
})

export const cardTitle = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	margin: 0,
})

export const cardCount = style({
	fontSize: '11px',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.secondary,
	backgroundColor: vars.color.bg.secondary,
	padding: `2px 6px`,
	borderRadius: vars.borderRadius.sm,
})

// Documents
export const documentsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
	gap: vars.spacing.sm,
})

export const documentCard = style({
	display: 'flex',
	flexDirection: 'column',
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
	overflow: 'hidden',
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.fast}`,

	':hover': {
		borderColor: vars.color.primary.main,
		boxShadow: vars.shadow.sm,
	},
})

export const documentPreview = style({
	position: 'relative',
	width: '100%',
	height: '80px',
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
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.disabled,
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
	padding: vars.spacing.xs,
})

export const documentName = style({
	fontSize: '11px',
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
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
	color: vars.color.text.disabled,
	gap: vars.spacing.xs,
	textAlign: 'center',
})

export const emptyStateText = style({
	fontSize: vars.fontSize.xs,
	margin: 0,
})

// Notes
export const notesContent = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
	lineHeight: 1.6,
	whiteSpace: 'pre-wrap',
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
})

// Properties
export const propertiesEmpty = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
	gap: vars.spacing.sm,
})

export const viewAllLink = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.sm,
	marginTop: vars.spacing.sm,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.primary.dark,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
	transition: `background-color ${vars.transitionDuration.fast}`,

	':hover': {
		backgroundColor: vars.color.bg.tertiary,
	},
})

// Metadata
export const metadataList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const metadataItem = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const metadataValue = style({
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// Error/Loading States
export const loadingContainer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
})

export const errorContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '300px',
	gap: vars.spacing.md,
	color: vars.color.text.secondary,
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
