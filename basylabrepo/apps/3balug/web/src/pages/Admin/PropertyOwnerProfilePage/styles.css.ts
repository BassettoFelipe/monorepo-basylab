import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

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

export const header = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'flex-start',
	marginBottom: vars.spacing.xl,
	gap: vars.spacing.xl,
	flexWrap: 'wrap',

	'@media': {
		'(max-width: 768px)': {
			flexDirection: 'column',
		},
	},
})

export const headerMain = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xl,
	flex: 1,

	'@media': {
		'(max-width: 640px)': {
			flexDirection: 'column',
			alignItems: 'flex-start',
			gap: vars.spacing.lg,
		},
	},
})

export const avatarContainer = style({
	position: 'relative',
	flexShrink: 0,
})

export const avatar = style({
	width: '120px',
	height: '120px',
	borderRadius: vars.borderRadius.full,
	objectFit: 'cover',
	border: `4px solid ${vars.color.bg.primary}`,
	boxShadow: vars.shadow.lg,

	'@media': {
		'(max-width: 640px)': {
			width: '100px',
			height: '100px',
		},
	},
})

export const avatarFallback = style({
	width: '120px',
	height: '120px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: '40px',
	fontWeight: vars.fontWeight.bold,
	border: `4px solid ${vars.color.bg.primary}`,
	boxShadow: vars.shadow.lg,

	'@media': {
		'(max-width: 640px)': {
			width: '100px',
			height: '100px',
			fontSize: '32px',
		},
	},
})

export const statusIndicator = style({
	position: 'absolute',
	bottom: '8px',
	right: '8px',
	width: '24px',
	height: '24px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: '#22C55E',
	border: `3px solid ${vars.color.bg.primary}`,
})

export const headerInfo = style({
	flex: 1,
	minWidth: 0,
})

export const nameRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	flexWrap: 'wrap',
	marginBottom: vars.spacing.sm,
})

export const name = style({
	fontSize: '28px',
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
	lineHeight: 1.2,

	'@media': {
		'(max-width: 640px)': {
			fontSize: '24px',
		},
	},
})

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
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
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	fontFamily: vars.fontFamily.mono,
	marginBottom: vars.spacing.md,
})

export const quickStats = style({
	display: 'flex',
	gap: vars.spacing.xl,
	flexWrap: 'wrap',
})

export const statItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
})

export const statIcon = style({
	color: vars.color.text.secondary,
})

export const statValue = style({
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const headerActions = style({
	display: 'flex',
	gap: vars.spacing.sm,
	flexShrink: 0,

	'@media': {
		'(max-width: 768px)': {
			width: '100%',
		},
	},
})

export const content = style({
	display: 'grid',
	gridTemplateColumns: '1fr 380px',
	gap: vars.spacing.xl,

	'@media': {
		'(max-width: 968px)': {
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
})

export const card = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	border: `1px solid ${vars.color.border.primary}`,
	padding: vars.spacing.xl,
	boxShadow: vars.shadow.sm,
})

export const cardHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginBottom: vars.spacing.lg,
	paddingBottom: vars.spacing.md,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const cardTitle = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const cardTitleIcon = style({
	color: vars.color.primary.dark,
})

export const cardCount = style({
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
})

// Contact Info Styles
export const contactGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const contactItem = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: '#f0fdf4',
	},
})

export const contactItemClickable = style({
	cursor: 'pointer',
	textDecoration: 'none',
	color: 'inherit',

	':hover': {
		backgroundColor: '#f0fdf4',
	},
})

export const contactIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '44px',
	height: '44px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.primary.dark,
	flexShrink: 0,
	boxShadow: vars.shadow.xs,
})

export const contactInfo = style({
	flex: 1,
	minWidth: 0,
})

export const contactLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	marginBottom: vars.spacing.xs,
})

export const contactValue = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	wordBreak: 'break-word',
})

export const contactValueMuted = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	fontStyle: 'italic',
})

// Address Card Styles
export const addressContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
})

export const addressMain = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
})

export const addressIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: '#FEF3C7',
	color: '#92400E',
	flexShrink: 0,
})

export const addressInfo = style({
	flex: 1,
})

export const addressLine = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
	lineHeight: 1.6,
	margin: 0,
})

export const addressSecondary = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	marginTop: vars.spacing.xs,
})

export const addressGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: vars.spacing.md,
	paddingTop: vars.spacing.md,
	borderTop: `1px solid ${vars.color.border.primary}`,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const addressGridItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const addressGridLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const addressGridValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// Personal Info Styles (for CPF only)
export const personalGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const personalItem = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
})

export const personalLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const personalValue = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// Documents Grid Styles
export const documentsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
	gap: vars.spacing.md,
})

export const documentCard = style({
	display: 'flex',
	flexDirection: 'column',
	borderRadius: vars.borderRadius.lg,
	border: `1px solid ${vars.color.border.primary}`,
	overflow: 'hidden',
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		borderColor: vars.color.primary.main,
		boxShadow: vars.shadow.md,
		transform: 'translateY(-2px)',
	},
})

export const documentPreview = style({
	position: 'relative',
	width: '100%',
	height: '140px',
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
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	opacity: 0,
	transition: `opacity ${vars.transitionDuration.base}`,

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
	width: '40px',
	height: '40px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.primary,
	border: 'none',
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	textDecoration: 'none',

	':hover': {
		backgroundColor: vars.color.primary.main,
		color: vars.color.primary.dark,
		transform: 'scale(1.1)',
	},
})

export const documentInfo = style({
	padding: vars.spacing.md,
	borderTop: `1px solid ${vars.color.border.primary}`,
})

export const documentName = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.xs,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

export const documentType = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const emptyDocuments = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing['2xl'],
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	color: vars.color.text.secondary,
	gap: vars.spacing.md,
	textAlign: 'center',
})

export const emptyDocumentsIcon = style({
	color: vars.color.text.disabled,
})

export const emptyDocumentsText = style({
	fontSize: vars.fontSize.sm,
	margin: 0,
})

// Notes Card Styles
export const notesContent = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.primary,
	lineHeight: 1.7,
	whiteSpace: 'pre-wrap',
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	borderLeft: `4px solid ${vars.color.primary.main}`,
})

export const emptyNotes = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	fontStyle: 'italic',
	textAlign: 'center',
	padding: vars.spacing.xl,
})

// Properties Card Styles
export const propertiesList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const propertyItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	textDecoration: 'none',
	color: 'inherit',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: '#f0fdf4',
		transform: 'translateX(4px)',
	},
})

export const propertyImage = style({
	width: '60px',
	height: '60px',
	borderRadius: vars.borderRadius.md,
	objectFit: 'cover',
	flexShrink: 0,
})

export const propertyImageFallback = style({
	width: '60px',
	height: '60px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.tertiary,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const propertyInfo = style({
	flex: 1,
	minWidth: 0,
})

export const propertyTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.xs,
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

export const propertyAddress = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const propertyArrow = style({
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const emptyProperties = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.xl,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	color: vars.color.text.secondary,
	gap: vars.spacing.sm,
	textAlign: 'center',
})

export const viewAllLink = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.md,
	marginTop: vars.spacing.md,
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.primary.dark,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		backgroundColor: '#f0fdf4',
	},
})

// Metadata Styles
export const metadataCard = style({
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.lg,
	padding: vars.spacing.lg,
	border: `1px solid ${vars.color.border.primary}`,
})

export const metadataGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 400px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const metadataItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const metadataIcon = style({
	color: vars.color.text.secondary,
})

export const metadataInfo = style({
	display: 'flex',
	flexDirection: 'column',
})

export const metadataLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const metadataValue = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// Error/Loading States
export const loadingContainer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xl,
})

export const errorContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
	gap: vars.spacing.lg,
	color: vars.color.text.secondary,
	textAlign: 'center',
})

export const errorIcon = style({
	color: vars.color.error.main,
})

export const errorTitle = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const errorDescription = style({
	fontSize: vars.fontSize.base,
	color: vars.color.text.secondary,
	margin: 0,
	maxWidth: '400px',
})
