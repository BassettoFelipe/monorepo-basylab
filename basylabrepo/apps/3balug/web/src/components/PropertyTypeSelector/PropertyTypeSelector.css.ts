import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const label = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
})

export const required = style({
	color: vars.color.error.main,
	marginLeft: '2px',
})

export const grid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(5, 1fr)',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 768px)': {
			gridTemplateColumns: 'repeat(3, 1fr)',
		},
		'(max-width: 480px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	},
})

export const option = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.primary,
	border: `2px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	minHeight: '120px',

	':hover': {
		borderColor: vars.color.border.secondary,
		backgroundColor: vars.color.bg.secondary,
		transform: 'translateY(-2px)',
	},
})

export const optionSelected = style({
	borderColor: vars.color.primary.main,
	backgroundColor: 'rgba(230, 255, 75, 0.1)',
	boxShadow: '0 0 0 3px rgba(230, 255, 75, 0.2)',

	':hover': {
		borderColor: vars.color.primary.main,
		backgroundColor: 'rgba(230, 255, 75, 0.15)',
	},
})

export const optionDisabled = style({
	opacity: 0.5,
	cursor: 'not-allowed',
	':hover': {
		transform: 'none',
		borderColor: vars.color.border.primary,
		backgroundColor: vars.color.bg.primary,
	},
})

export const iconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	transition: `all ${vars.transitionDuration.base}`,
})

export const iconWrapperSelected = style({
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
})

export const optionLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	textAlign: 'center',
})

export const optionLabelSelected = style({
	color: vars.color.primary.dark,
	fontWeight: vars.fontWeight.bold,
})

export const errorMessage = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.error.main,
	marginTop: vars.spacing.xs,
})

// Listing Type Selector styles
export const listingTypeGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 480px)': {
			gridTemplateColumns: '1fr',
		},
	},
})

export const listingOption = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.primary,
	border: `2px solid ${vars.color.border.primary}`,
	borderRadius: vars.borderRadius.lg,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base}`,
	minHeight: '100px',

	':hover': {
		borderColor: vars.color.border.secondary,
		backgroundColor: vars.color.bg.secondary,
	},
})

export const listingOptionSelected = style({
	borderColor: vars.color.primary.main,
	backgroundColor: 'rgba(230, 255, 75, 0.1)',
	boxShadow: '0 0 0 3px rgba(230, 255, 75, 0.2)',

	':hover': {
		borderColor: vars.color.primary.main,
		backgroundColor: 'rgba(230, 255, 75, 0.15)',
	},
})

export const listingOptionDisabled = style({
	opacity: 0.5,
	cursor: 'not-allowed',
	':hover': {
		borderColor: vars.color.border.primary,
		backgroundColor: vars.color.bg.primary,
	},
})

export const listingIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '44px',
	height: '44px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	transition: `all ${vars.transitionDuration.base}`,
})

export const listingIconWrapperSelected = style({
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
})

export const listingLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	textAlign: 'center',
})

export const listingLabelSelected = style({
	color: vars.color.primary.dark,
	fontWeight: vars.fontWeight.bold,
})

export const listingDescription = style({
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	textAlign: 'center',
	lineHeight: 1.4,
})

export const listingDescriptionSelected = style({
	color: vars.color.text.primary,
})

// Rent color variant
export const rentOption = style({})

export const rentOptionSelected = style({
	borderColor: '#3B82F6',
	backgroundColor: 'rgba(59, 130, 246, 0.1)',
	boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',

	':hover': {
		borderColor: '#3B82F6',
		backgroundColor: 'rgba(59, 130, 246, 0.15)',
	},
})

export const rentIconSelected = style({
	backgroundColor: '#3B82F6',
	color: '#FFFFFF',
})

// Sale color variant
export const saleOption = style({})

export const saleOptionSelected = style({
	borderColor: '#10B981',
	backgroundColor: 'rgba(16, 185, 129, 0.1)',
	boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',

	':hover': {
		borderColor: '#10B981',
		backgroundColor: 'rgba(16, 185, 129, 0.15)',
	},
})

export const saleIconSelected = style({
	backgroundColor: '#10B981',
	color: '#FFFFFF',
})

// Both color variant
export const bothOption = style({})

export const bothOptionSelected = style({
	borderColor: '#8B5CF6',
	backgroundColor: 'rgba(139, 92, 246, 0.1)',
	boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)',

	':hover': {
		borderColor: '#8B5CF6',
		backgroundColor: 'rgba(139, 92, 246, 0.15)',
	},
})

export const bothIconSelected = style({
	backgroundColor: '#8B5CF6',
	color: '#FFFFFF',
})
