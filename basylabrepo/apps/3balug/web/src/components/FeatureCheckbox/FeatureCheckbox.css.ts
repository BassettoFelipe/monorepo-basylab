import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const featuresGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(4, 1fr)',
	gap: vars.spacing.md,
	border: 'none',
	padding: 0,
	margin: 0,

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
	':focus-within': {
		outline: `2px solid ${vars.color.primary.main}`,
		outlineOffset: '2px',
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
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
})

export const featureLabel = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	cursor: 'pointer',
})
