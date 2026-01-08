import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

// Custom Header
export const customHeader = style({
	padding: `${vars.spacing.md} ${vars.spacing.xl}`,
	borderBottom: `1px solid ${vars.color.border.primary}`,
	display: 'grid',
	gridTemplateColumns: '200px 1fr 48px',
	alignItems: 'center',
	gap: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,

	'@media': {
		'(max-width: 1100px)': {
			gridTemplateColumns: '180px 1fr 48px',
			padding: `${vars.spacing.md} ${vars.spacing.lg}`,
		},
		'(max-width: 900px)': {
			gridTemplateColumns: '150px 1fr 48px',
			gap: vars.spacing.sm,
		},
		'(max-width: 768px)': {
			display: 'flex',
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
	minWidth: 0,

	'@media': {
		'(max-width: 768px)': {
			order: 1,
			paddingRight: '48px',
		},
	},
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
	minWidth: 0,
	overflow: 'visible',

	'@media': {
		'(max-width: 900px)': {
			overflow: 'hidden',
		},
		'(max-width: 768px)': {
			order: 3,
			justifyContent: 'center',
			width: '100%',
			overflowX: 'auto',
			paddingBottom: vars.spacing.xs,
			scrollbarWidth: 'none',
			msOverflowStyle: 'none',
			selectors: {
				'&::-webkit-scrollbar': {
					display: 'none',
				},
			},
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

// Steps
export const stepsContainer = style({
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'center',
	flexShrink: 0,

	'@media': {
		'(max-width: 768px)': {
			display: 'none',
		},
	},
})

// Mobile step indicator (shown on tablet and smaller screens)
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
})

export const stepCircle = style({
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.full,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	transition: `all ${vars.transitionDuration.base}`,
	flexShrink: 0,

	'@media': {
		'(max-width: 1100px)': {
			width: '28px',
			height: '28px',
		},
		'(max-width: 900px)': {
			width: '24px',
			height: '24px',
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
	boxShadow: '0 0 0 3px rgba(67, 77, 0, 0.15)',
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
		'(max-width: 1100px)': {
			display: 'none',
		},
	},
})

export const stepLabelActive = style({
	color: vars.color.text.primary,
	fontWeight: vars.fontWeight.bold,
})

export const stepConnector = style({
	width: '24px',
	height: '2px',
	backgroundColor: vars.color.border.primary,
	transition: `background-color ${vars.transitionDuration.base}`,
	marginTop: '15px',
	marginLeft: '6px',
	marginRight: '6px',
	flexShrink: 0,

	'@media': {
		'(max-width: 1100px)': {
			width: '20px',
			marginTop: '13px',
			marginLeft: '4px',
			marginRight: '4px',
		},
		'(max-width: 900px)': {
			width: '12px',
			marginTop: '11px',
			marginLeft: '3px',
			marginRight: '3px',
		},
	},
})

export const stepConnectorCompleted = style({
	backgroundColor: '#16A34A',
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
