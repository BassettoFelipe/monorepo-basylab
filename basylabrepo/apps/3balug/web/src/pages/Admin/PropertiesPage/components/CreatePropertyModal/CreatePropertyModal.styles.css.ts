import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const spin = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

// Custom Header - Layout flexível que se adapta ao espaço
export const customHeader = style({
	padding: `${vars.spacing.md} ${vars.spacing.xl}`,
	borderBottom: `1px solid ${vars.color.border.primary}`,
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,

	'@media': {
		'(max-width: 768px)': {
			flexDirection: 'column',
			alignItems: 'stretch',
			gap: vars.spacing.sm,
			padding: vars.spacing.md,
			position: 'relative',
		},
	},
})

export const headerLeft = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	minWidth: '150px',
	flexShrink: 0,

	'@media': {
		'(max-width: 768px)': {
			order: 1,
			paddingRight: '48px',
			minWidth: 0,
		},
	},
})

export const headerInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const headerTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.base,
		},
	},
})

export const headerDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xs,
		},
	},
})

export const headerCenter = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flex: 1,
	minWidth: 0,
	overflow: 'hidden',

	'@media': {
		'(max-width: 768px)': {
			order: 3,
			justifyContent: 'center',
			width: '100%',
		},
	},
})

export const headerRight = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	flexShrink: 0,

	'@media': {
		'(max-width: 768px)': {
			position: 'absolute',
			top: vars.spacing.md,
			right: vars.spacing.md,
			order: 2,
		},
	},
})

export const closeButton = style({
	background: 'none',
	border: 'none',
	padding: vars.spacing.sm,
	cursor: 'pointer',
	color: vars.color.text.secondary,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: vars.borderRadius.md,
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		backgroundColor: vars.color.bg.primary,
		color: vars.color.text.primary,
	},
	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
	},
})

// Steps - usando flex-wrap para se adaptar ao espaço disponível
export const stepsContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexWrap: 'wrap',
	gap: vars.spacing.xs,
	maxWidth: '100%',

	'@media': {
		'(max-width: 768px)': {
			display: 'none',
		},
	},
})

// Mobile step indicator (shown on mobile screens)
export const mobileStepIndicator = style({
	display: 'none',

	'@media': {
		'(max-width: 768px)': {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: '8px',
			padding: `${vars.spacing.xs} 0`,
		},
	},
})

export const mobileStepDot = style({
	width: '10px',
	height: '10px',
	borderRadius: '50%',
	backgroundColor: vars.color.border.primary,
	transition: `all ${vars.transitionDuration.base}`,
	border: 'none',
	padding: 0,
	cursor: 'pointer',
	':hover': {
		transform: 'scale(1.3)',
	},
	':disabled': {
		cursor: 'not-allowed',
		transform: 'none',
	},
})

export const mobileStepDotActive = style({
	backgroundColor: vars.color.primary.dark,
	transform: 'scale(1.25)',
})

export const mobileStepDotCompleted = style({
	backgroundColor: '#16A34A',
})

export const stepItem = style({
	display: 'flex',
	alignItems: 'flex-start',
	flexShrink: 0,
})

export const stepContent = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: '4px',
	flexShrink: 0,
	background: 'none',
	border: 'none',
	padding: '4px',
	margin: 0,
	font: 'inherit',
})

export const stepContentClickable = style({
	cursor: 'pointer',
	transition: `transform ${vars.transitionDuration.base}`,
	':hover': {
		transform: 'scale(1.05)',
	},
	':disabled': {
		cursor: 'not-allowed',
		transform: 'none',
	},
})

export const stepCircle = style({
	width: '28px',
	height: '28px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	transition: `all ${vars.transitionDuration.base}`,
	flexShrink: 0,
})

export const stepCirclePending = style({
	backgroundColor: vars.color.bg.primary,
	border: `2px solid ${vars.color.border.primary}`,
	color: vars.color.text.secondary,
})

export const stepCircleActive = style({
	backgroundColor: vars.color.primary.dark,
	border: `2px solid ${vars.color.primary.dark}`,
	color: '#FFFFFF',
	boxShadow: '0 0 0 3px rgba(67, 77, 0, 0.15)',
})

export const stepCircleCompleted = style({
	backgroundColor: '#16A34A',
	border: '2px solid #16A34A',
	color: '#FFFFFF',
})

export const stepLabel = style({
	fontSize: '10px',
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	textAlign: 'center',
	whiteSpace: 'nowrap',
	maxWidth: '60px',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

export const stepLabelActive = style({
	color: vars.color.text.primary,
	fontWeight: vars.fontWeight.bold,
})

export const stepConnector = style({
	width: '16px',
	height: '2px',
	backgroundColor: vars.color.border.primary,
	transition: `background-color ${vars.transitionDuration.base}`,
	flexShrink: 0,
	marginLeft: vars.spacing.xs,
	marginRight: vars.spacing.xs,
	marginTop: '13px',
})

export const stepConnectorCompleted = style({
	backgroundColor: '#16A34A',
})

// Form
export const form = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
})

export const formSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.lg,
})

export const sectionTitle = style({
	marginTop: vars.spacing.md,
	paddingBottom: vars.spacing.sm,
	borderBottom: `1px solid ${vars.color.border.primary}`,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	selectors: {
		'&:first-child': {
			marginTop: 0,
		},
	},
})

export const sectionHeader = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
	marginTop: vars.spacing.md,
	paddingBottom: vars.spacing.md,
	borderBottom: `1px solid ${vars.color.border.primary}`,
	selectors: {
		'&:first-child': {
			marginTop: 0,
		},
	},
})

export const sectionHeaderIcon = style({
	color: vars.color.primary.dark,
	flexShrink: 0,
	marginTop: '2px',
})

export const sectionHeaderTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const sectionHeaderDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
	marginTop: '2px',
})

export const row2Cols = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const row2ColsInner = style({
	display: 'grid',
	gridTemplateColumns: '100px 1fr',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr 1fr',
		},
	},
})

export const row3Cols = style({
	display: 'grid',
	gridTemplateColumns: '140px 1fr 100px',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const row4Cols = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(4, 1fr)',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 768px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'(max-width: 480px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const cepWrapper = style({
	position: 'relative',
})

export const cepHint = style({
	position: 'absolute',
	bottom: '-20px',
	left: 0,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const cepAlert = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	backgroundColor: '#FEF3C7',
	border: '1px solid #F59E0B',
	borderRadius: vars.borderRadius.md,
})

export const cepAlertIcon = style({
	color: '#D97706',
	flexShrink: 0,
	marginTop: '2px',
})

export const cepAlertContent = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const cepAlertTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: '#92400E',
	margin: 0,
})

export const cepAlertText = style({
	fontSize: vars.fontSize.xs,
	color: '#A16207',
	margin: 0,
})

export const spinner = style({
	animation: `${spin} 1s linear infinite`,
	color: vars.color.primary.main,
})

// Footer
export const footer = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '100%',

	'@media': {
		'(max-width: 480px)': {
			flexDirection: 'column',
			gap: vars.spacing.md,
		},
	},
})

export const footerLeft = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 480px)': {
			width: '100%',
			justifyContent: 'center',
		},
	},
})

export const footerRight = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,

	'@media': {
		'(max-width: 480px)': {
			width: '100%',
			justifyContent: 'stretch',
		},
	},
})

export const progressText = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	fontWeight: vars.fontWeight.medium,
})

export const progressBar = style({
	width: '120px',
	height: '6px',
	backgroundColor: vars.color.border.primary,
	borderRadius: vars.borderRadius.full,
	overflow: 'hidden',

	'@media': {
		'(max-width: 640px)': {
			width: '80px',
		},
		'(max-width: 480px)': {
			flex: 1,
			width: 'auto',
		},
	},
})

export const progressBarFill = style({
	height: '100%',
	backgroundColor: vars.color.primary.main,
	borderRadius: vars.borderRadius.full,
	transition: `width ${vars.transitionDuration.base}`,
})

// Info box
export const infoBox = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: '#EFF6FF',
	border: '1px solid #BFDBFE',
	borderRadius: vars.borderRadius.md,
})

export const infoBoxIcon = style({
	color: '#2563EB',
	flexShrink: 0,
	marginTop: '2px',
})

export const infoBoxText = style({
	fontSize: vars.fontSize.sm,
	color: '#1E40AF',
	margin: 0,
	lineHeight: 1.5,
})

// Features grid
export const featuresGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(4, 1fr)',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 900px)': {
			gridTemplateColumns: 'repeat(3, 1fr)',
		},
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const featureCheckbox = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	cursor: 'pointer',
	padding: vars.spacing.lg,
	borderRadius: vars.borderRadius.lg,
	border: `2px solid ${vars.color.border.primary}`,
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.base}`,
	minHeight: '120px',
	textAlign: 'center',
	position: 'relative',
	':hover': {
		borderColor: vars.color.primary.main,
		backgroundColor: vars.color.bg.secondary,
		transform: 'translateY(-2px)',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
	},
})

export const featureCheckboxChecked = style({
	borderColor: vars.color.primary.main,
	backgroundColor: 'rgba(154, 169, 51, 0.08)',
})

export const checkbox = style({
	position: 'absolute',
	top: vars.spacing.sm,
	right: vars.spacing.sm,
	width: '20px',
	height: '20px',
	cursor: 'pointer',
	accentColor: vars.color.primary.main,
})

export const featureIcon = style({
	color: vars.color.primary.dark,
	flexShrink: 0,
	marginBottom: vars.spacing.xs,
})

export const featureLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	cursor: 'pointer',
})

// Marketplace card
export const marketplaceCard = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.secondary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	gap: vars.spacing.lg,
})

export const marketplaceHeader = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
})

export const marketplaceIcon = style({
	color: vars.color.primary.main,
	flexShrink: 0,
})

export const marketplaceInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const marketplaceTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const marketplaceDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
	lineHeight: 1.5,
})

export const marketplaceToggle = style({
	position: 'relative',
	display: 'inline-block',
	width: '52px',
	height: '28px',
	flexShrink: 0,
})

export const toggleInput = style({
	opacity: 0,
	width: 0,
	height: 0,
})

export const toggleSlider = style({
	position: 'absolute',
	cursor: 'pointer',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundColor: vars.color.border.primary,
	transition: `all ${vars.transitionDuration.base}`,
	borderRadius: '28px',
	'::before': {
		position: 'absolute',
		content: '""',
		height: '22px',
		width: '22px',
		left: '3px',
		bottom: '3px',
		backgroundColor: '#FFFFFF',
		transition: `all ${vars.transitionDuration.base}`,
		borderRadius: '50%',
		boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
	},
})

// Global styles for toggle input states
globalStyle(`${toggleInput}:checked + ${toggleSlider}`, {
	backgroundColor: '#16A34A',
})

globalStyle(`${toggleInput}:checked + ${toggleSlider}::before`, {
	transform: 'translateX(24px)',
})

globalStyle(`${toggleInput}:focus + ${toggleSlider}`, {
	boxShadow: '0 0 0 3px rgba(154, 169, 51, 0.3)',
})

globalStyle(`${toggleInput}:disabled + ${toggleSlider}`, {
	opacity: 0.5,
	cursor: 'not-allowed',
})

// Summary card
export const summaryCard = style({
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
})

export const summaryTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
	marginBottom: vars.spacing.sm,
})

export const summaryGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.sm,

	'@media': {
		'(max-width: 480px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const summaryItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const summaryLabel = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const summaryValue = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

// Photos step styles
export const photosHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingBottom: vars.spacing.md,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const photosHeaderContent = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
})

export const photosHeaderIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.primary.dark,
	borderRadius: vars.borderRadius.md,
})

export const photosHeaderText = style({
	display: 'flex',
	flexDirection: 'column',
})

export const photosHeaderTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const photosHeaderDescription = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	margin: 0,
})

export const photosCounter = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
})

export const photosTips = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.spacing.md,
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
})

export const photosTipItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const photosTipIcon = style({
	color: vars.color.success.main,
	flexShrink: 0,
})

export const photosEmptyState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.lg,
	textAlign: 'center',
})

export const photosEmptyIcon = style({
	color: vars.color.text.tertiary,
	marginBottom: vars.spacing.sm,
})

export const photosEmptyTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	margin: 0,
	marginBottom: vars.spacing.xs,
})

export const photosEmptyText = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.tertiary,
	margin: 0,
})

// Publish step styles
export const publishHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	paddingBottom: vars.spacing.md,
	borderBottom: `1px solid ${vars.color.border.primary}`,
})

export const publishHeaderIcon = style({
	color: vars.color.primary.dark,
})

export const publishHeaderTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const publishHeaderDescription = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	margin: 0,
})

export const visibilityCard = style({
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
})

export const visibilityOption = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
})

export const visibilityOptionIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.primary.dark,
	borderRadius: vars.borderRadius.md,
	flexShrink: 0,
})

export const visibilityOptionContent = style({
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
})

export const visibilityOptionTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const visibilityOptionDescription = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	margin: 0,
})

export const notesSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const notesSectionHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const summaryHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	marginBottom: vars.spacing.sm,
})

export const summaryHeaderIcon = style({
	color: vars.color.primary.dark,
})

export const summaryItemIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '28px',
	height: '28px',
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	borderRadius: vars.borderRadius.sm,
	flexShrink: 0,
})

export const summaryItemContent = style({
	display: 'flex',
	flexDirection: 'column',
})

// Photo upload dropzone styles
export const photoDropzone = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.xl,
	border: `2px dashed ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.primary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		borderColor: vars.color.primary.main,
		backgroundColor: vars.color.bg.secondary,
	},
})

export const photoDropzoneDragging = style({
	borderColor: vars.color.primary.dark,
	backgroundColor: 'rgba(154, 169, 51, 0.08)',
	boxShadow: '0 0 0 4px rgba(154, 169, 51, 0.15)',
})

export const photoDropzoneDisabled = style({
	opacity: 0.5,
	cursor: 'not-allowed',
	':hover': {
		borderColor: vars.color.border.primary,
		backgroundColor: vars.color.bg.primary,
	},
})

export const photoDropzoneIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '64px',
	height: '64px',
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.full,
	color: vars.color.text.tertiary,
	transition: `all ${vars.transitionDuration.base}`,
})

export const photoDropzoneTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
	textAlign: 'center',
})

export const photoDropzoneSubtitle = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.tertiary,
	margin: 0,
	textAlign: 'center',
})

// Photo grid styles
export const photosGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(5, 1fr)',
	gap: vars.spacing.md,
	marginTop: vars.spacing.lg,

	'@media': {
		'(max-width: 900px)': {
			gridTemplateColumns: 'repeat(4, 1fr)',
		},
		'(max-width: 640px)': {
			gridTemplateColumns: 'repeat(3, 1fr)',
		},
		'(max-width: 480px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const photoCard = style({
	position: 'relative',
	aspectRatio: '1',
	borderRadius: vars.borderRadius.md,
	overflow: 'hidden',
	border: `1px solid ${vars.color.border.primary}`,
	backgroundColor: vars.color.bg.secondary,
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
	},
})

export const photoCardPrimary = style({
	border: `2px solid ${vars.color.primary.dark}`,
	boxShadow: '0 0 0 2px rgba(154, 169, 51, 0.2)',
})

export const photoCardDeleted = style({
	opacity: 0.6,
	border: '2px dashed #EF4444',
})

export const photoImage = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
})

export const photoOverlay = style({
	position: 'absolute',
	inset: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	opacity: 0,
	transition: `opacity ${vars.transitionDuration.base}`,
	selectors: {
		[`${photoCard}:hover &`]: {
			opacity: 1,
		},
	},
})

export const photoActions = style({
	display: 'flex',
	gap: vars.spacing.xs,
})

export const photoActionButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '32px',
	height: '32px',
	padding: 0,
	border: 'none',
	borderRadius: vars.borderRadius.md,
	backgroundColor: 'rgba(255, 255, 255, 0.95)',
	color: vars.color.text.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	':hover': {
		backgroundColor: '#FFFFFF',
		color: vars.color.text.primary,
		transform: 'scale(1.1)',
	},
	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
		transform: 'none',
	},
})

export const photoActionButtonDanger = style({
	':hover': {
		backgroundColor: '#FEE2E2',
		color: '#DC2626',
	},
})

export const photoActionButtonSuccess = style({
	':hover': {
		backgroundColor: '#DCFCE7',
		color: '#16A34A',
	},
})

export const photoBadge = style({
	position: 'absolute',
	display: 'flex',
	alignItems: 'center',
	gap: '3px',
	padding: '3px 8px',
	fontSize: '10px',
	fontWeight: 600,
	borderRadius: vars.borderRadius.sm,
	zIndex: 1,
})

export const photoBadgePrimary = style({
	top: vars.spacing.xs,
	left: vars.spacing.xs,
	color: '#FFFFFF',
	backgroundColor: vars.color.primary.dark,
})

export const photoBadgeNew = style({
	bottom: vars.spacing.xs,
	left: vars.spacing.xs,
	color: '#FFFFFF',
	backgroundColor: '#22C55E',
})

export const photoBadgeDeleted = style({
	top: vars.spacing.xs,
	right: vars.spacing.xs,
	color: '#FFFFFF',
	backgroundColor: '#EF4444',
})

// Error state styles
export const errorState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing['2xl'],
	textAlign: 'center',
	gap: vars.spacing.md,
	minHeight: '200px',
})

export const errorIcon = style({
	color: vars.color.text.tertiary,
})

export const errorTitle = style({
	fontSize: vars.fontSize.lg,
	fontWeight: 600,
	color: vars.color.text.primary,
	margin: 0,
})

export const errorDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
	maxWidth: '300px',
})
