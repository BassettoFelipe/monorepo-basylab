import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const features = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
	textAlign: 'left',
})

export const featureItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.md,
	backgroundColor: `rgba(255, 255, 255, ${vars.opacity[10]})`,
	borderRadius: vars.borderRadius.lg,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&:hover': {
			backgroundColor: `rgba(230, 255, 75, ${vars.opacity[20]})`,
			transform: 'translateX(6px)',
		},
	},
})

export const featureIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '32px',
	height: '32px',
	minWidth: '32px',
	color: vars.color.primary.main,
})
