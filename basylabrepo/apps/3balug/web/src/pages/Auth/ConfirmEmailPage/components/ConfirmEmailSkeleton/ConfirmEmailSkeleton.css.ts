import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const codeInputContainer = style({
	display: 'flex',
	gap: vars.spacing.sm,
	justifyContent: 'center',
	position: 'relative',
})
