import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const spin = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

// Custom Header - Layout em 3 colunas com grid
export const customHeader = style({
	padding: `${vars.spacing.lg} ${vars.spacing.xl}`,
	borderBottom: `1px solid ${vars.color.border.primary}`,
	display: 'grid',
	gridTemplateColumns: '1fr auto 1fr',
	alignItems: 'center',
	gap: vars.spacing.lg,
	backgroundColor: vars.color.bg.secondary,

	'@media': {
		'(max-width: 768px)': {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'stretch',
			gap: vars.spacing.md,
			padding: vars.spacing.lg,
			position: 'relative',
		},
	},
})

export const headerLeft = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	minWidth: 0,
	justifySelf: 'start',

	'@media': {
		'(max-width: 768px)': {
			order: 1,
			paddingRight: '48px',
		},
	},
})

export const headerInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
})

export const headerTitle = style({
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const headerDescription = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
	margin: 0,
})

export const headerCenter = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	justifySelf: 'center',

	'@media': {
		'(max-width: 768px)': {
			order: 3,
			justifyContent: 'flex-start',
			overflowX: 'auto',
			width: '100%',
		},
	},
})

export const headerRight = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	justifySelf: 'end',

	'@media': {
		'(max-width: 768px)': {
			position: 'absolute',
			top: vars.spacing.lg,
			right: vars.spacing.lg,
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
	flexShrink: 0,
	':hover': {
		backgroundColor: vars.color.bg.primary,
		color: vars.color.text.primary,
	},
	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
	},
})

// Steps
export const stepsContainer = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.xs,
})

export const stepItem = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.xs,
})

export const stepContent = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: vars.spacing.xs,
})

export const stepCircle = style({
	width: '40px',
	height: '40px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	transition: `all ${vars.transitionDuration.base}`,
	flexShrink: 0,

	'@media': {
		'(max-width: 480px)': {
			width: '36px',
			height: '36px',
		},
	},
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
	boxShadow: '0 0 0 4px rgba(67, 77, 0, 0.2)',
})

export const stepCircleCompleted = style({
	backgroundColor: '#16A34A',
	border: '2px solid #16A34A',
	color: '#FFFFFF',
})

export const stepLabel = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	textAlign: 'center',
	whiteSpace: 'nowrap',

	'@media': {
		'(max-width: 480px)': {
			display: 'none',
		},
	},
})

export const stepLabelActive = style({
	color: vars.color.text.primary,
	fontWeight: vars.fontWeight.bold,
})

export const stepConnector = style({
	width: '48px',
	height: '2px',
	backgroundColor: vars.color.border.primary,
	transition: `background-color ${vars.transitionDuration.base}`,
	marginTop: '19px',

	'@media': {
		'(max-width: 768px)': {
			width: '32px',
		},
		'(max-width: 480px)': {
			width: '20px',
			marginTop: '17px',
		},
	},
})

export const stepConnectorCompleted = style({
	backgroundColor: '#16A34A',
})

// Photo Upload Card
export const photoUploadCard = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: vars.spacing.lg,
	border: `2px dashed ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	minHeight: '120px',

	':hover': {
		borderColor: vars.color.primary.main,
		backgroundColor: 'rgba(154, 169, 51, 0.05)',
	},

	':focus': {
		outline: 'none',
		borderColor: vars.color.primary.main,
		boxShadow: `0 0 0 3px rgba(154, 169, 51, 0.2)`,
	},
})

export const photoUploadCardFilled = style({
	borderStyle: 'solid',
	borderColor: vars.color.success.main,
	backgroundColor: 'rgba(34, 197, 94, 0.05)',
	cursor: 'default',

	':hover': {
		borderColor: vars.color.success.main,
		backgroundColor: 'rgba(34, 197, 94, 0.08)',
	},
})

export const photoUploadCardDragging = style({
	borderColor: vars.color.primary.main,
	backgroundColor: 'rgba(154, 169, 51, 0.1)',
	transform: 'scale(1.01)',
})

export const photoUploadCardDisabled = style({
	opacity: 0.6,
	cursor: 'not-allowed',
	pointerEvents: 'none',
})

export const photoUploadContent = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,
})

export const photoUploadIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '64px',
	height: '64px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const photoUploadText = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
})

export const photoUploadTitle = style({
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const photoUploadHint = style({
	fontSize: vars.fontSize.sm,
	color: vars.color.text.secondary,
})

export const photoUploadFormats = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.tertiary,
})

export const photoPreviewContent = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,
	width: '100%',
})

export const photoPreviewImage = style({
	width: '80px',
	height: '80px',
	borderRadius: vars.borderRadius.lg,
	overflow: 'hidden',
	flexShrink: 0,
	border: `2px solid ${vars.color.border.primary}`,
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
	backgroundColor: vars.color.bg.tertiary,
})

export const photoPreviewImg = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	display: 'block',
})

export const photoPreviewInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
	flex: 1,
	minWidth: 0,
})

export const photoPreviewName = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const photoPreviewSize = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const photoPreviewActions = style({
	display: 'flex',
	gap: vars.spacing.xs,
	flexShrink: 0,
})

export const photoActionBtn = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.border.primary}`,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		borderColor: vars.color.primary.main,
		backgroundColor: vars.color.primary.main,
		color: '#FFFFFF',
	},

	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
	},
})

export const photoActionBtnDelete = style({
	':hover': {
		borderColor: '#EF4444',
		backgroundColor: '#EF4444',
		color: '#FFFFFF',
	},
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

// Documents info
export const documentsInfo = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: '#EFF6FF',
	border: '1px solid #BFDBFE',
	borderRadius: vars.borderRadius.md,
	marginBottom: vars.spacing.md,
})

export const documentsInfoIcon = style({
	color: '#2563EB',
	flexShrink: 0,
	marginTop: '2px',
})

export const documentsInfoText = style({
	fontSize: vars.fontSize.sm,
	color: '#1E40AF',
	margin: 0,
	lineHeight: 1.5,
})

// Document upload cards grid
export const documentsGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const documentUploadCard = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	border: `1px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.base}`,

	':hover': {
		borderColor: vars.color.primary.dark,
	},
})

export const documentUploadCardFilled = style({
	borderColor: vars.color.success.main,
	backgroundColor: 'rgba(34, 197, 94, 0.05)',
})

export const documentCardHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.sm,
})

export const documentCardTitle = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
})

export const documentCardOptional = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
})

export const documentDropZone = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.md,
	border: `2px dashed ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	minHeight: '80px',

	':hover': {
		borderColor: vars.color.primary.dark,
		backgroundColor: 'rgba(67, 77, 0, 0.05)',
	},
})

export const documentDropZoneDragging = style({
	borderColor: vars.color.primary.dark,
	backgroundColor: 'rgba(67, 77, 0, 0.1)',
})

export const documentDropZoneDisabled = style({
	opacity: 0.5,
	cursor: 'not-allowed',
	':hover': {
		borderColor: vars.color.border.primary,
		backgroundColor: vars.color.bg.secondary,
	},
})

export const documentDropZoneCompact = style({
	minHeight: '48px',
	padding: vars.spacing.sm,
	flexDirection: 'row',
	gap: vars.spacing.sm,
})

export const documentDropZoneIcon = style({
	color: vars.color.text.secondary,
})

export const documentDropZoneText = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textAlign: 'center',
})

export const documentFilesList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const documentFilePreview = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
})

export const documentFileIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.secondary,
	flexShrink: 0,
})

export const documentFileIconImage = style({
	overflow: 'hidden',
})

export const documentFileThumbnail = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	borderRadius: vars.borderRadius.md,
})

export const documentFileInfo = style({
	flex: 1,
	minWidth: 0,
})

export const documentFileName = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	margin: 0,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
})

export const documentFileSize = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	margin: 0,
})

export const documentRemoveButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '28px',
	height: '28px',
	border: 'none',
	borderRadius: vars.borderRadius.md,
	backgroundColor: 'transparent',
	color: vars.color.text.secondary,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	flexShrink: 0,

	':hover': {
		backgroundColor: 'rgba(239, 68, 68, 0.1)',
		color: '#EF4444',
	},

	':disabled': {
		opacity: 0.5,
		cursor: 'not-allowed',
	},
})
