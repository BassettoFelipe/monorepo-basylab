import { style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

export const cardWrapper = style({
	marginBottom: vars.spacing.sm,
	display: 'flex',
	justifyContent: 'center',
	transform: 'scale(0.88)',
	transformOrigin: 'center top',

	'@media': {
		[mediaQuery.lg]: {
			transform: 'scale(0.92)',
		},
	},
})
