import { style } from '@vanilla-extract/css'

export const logoLink = style({
	display: 'inline-flex',
	alignItems: 'center',
	textDecoration: 'none',
	cursor: 'pointer',
	transition: 'opacity 0.2s ease',
	':hover': {
		opacity: 0.8,
	},
	':focus': {
		outline: '2px solid var(--color-primary)',
		outlineOffset: '2px',
		borderRadius: '4px',
	},
})
