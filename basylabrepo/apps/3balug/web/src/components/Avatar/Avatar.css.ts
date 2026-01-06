import { style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const avatar = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
	fontWeight: vars.fontWeight.bold,
	overflow: 'hidden',
	flexShrink: 0,
})

export const small = style({
	width: '32px',
	height: '32px',
	fontSize: vars.fontSize.xs,
})

export const medium = style({
	width: '40px',
	height: '40px',
	fontSize: vars.fontSize.sm,
})

export const large = style({
	width: '96px',
	height: '96px',
	fontSize: vars.fontSize['2xl'],
})

export const image = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
})

export const initials = style({
	userSelect: 'none',
})
