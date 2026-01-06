import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const statsGrid = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing.lg,
	marginBottom: vars.spacing['2xl'],

	'@media': {
		'(min-width: 640px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'(min-width: 1024px)': {
			gridTemplateColumns: 'repeat(3, 1fr)',
		},
	},
})
