import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const skeletonCard = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	padding: vars.spacing.lg,
	boxShadow: vars.shadow.sm,
	border: '2px solid transparent',
	display: 'flex',
	flexDirection: 'column',

	'@media': {
		'(max-width: 768px)': {
			padding: vars.spacing.md,
		},
	},
})

export const skeletonContent = style({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
})

export const skeletonHeader = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	marginBottom: vars.spacing.md,

	'@media': {
		'(max-width: 768px)': {
			marginBottom: vars.spacing.sm,
		},
	},
})

export const skeletonPricing = style({
	marginBottom: vars.spacing.md,
	paddingBottom: vars.spacing.md,
	borderBottom: `1px solid ${vars.color.neutral.grayLight}`,

	'@media': {
		'(max-width: 768px)': {
			marginBottom: vars.spacing.sm,
			paddingBottom: vars.spacing.sm,
		},
	},
})

export const skeletonFeatures = style({
	listStyle: 'none',
	marginBottom: vars.spacing.md,
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,

	'@media': {
		'(max-width: 768px)': {
			marginBottom: vars.spacing.sm,
			gap: vars.spacing['2xs'],
		},
	},
})

export const skeletonFeature = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,

	'@media': {
		'(max-width: 768px)': {
			gap: vars.spacing['2xs'],
		},
	},
})

export const skeletonButton = style({
	marginTop: 'auto',

	'@media': {
		'(max-width: 768px)': {
			height: '40px',
		},
	},
})
