import { keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const spin = keyframes({
	'0%': { transform: 'rotate(0deg)' },
	'100%': { transform: 'rotate(360deg)' },
})

export const mapWrapper = style({
	position: 'relative',
	width: '100%',
	height: '250px',
	borderRadius: vars.borderRadius.lg,
	overflow: 'hidden',
	marginTop: vars.spacing.md,

	'@media': {
		'(max-width: 640px)': {
			height: '200px',
		},
	},
})

export const mapContainer = style({
	width: '100%',
	height: '100%',
})

export const loadingContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	height: '200px',
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.lg,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
	marginTop: vars.spacing.md,
})

export const spinner = style({
	animation: `${spin} 1s linear infinite`,
})

export const errorContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	height: '100px',
	backgroundColor: '#FEF2F2',
	borderRadius: vars.borderRadius.lg,
	color: '#991B1B',
	fontSize: vars.fontSize.sm,
	marginTop: vars.spacing.md,
	padding: vars.spacing.md,
	textAlign: 'center',
})

export const popupContent = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	color: vars.color.text.primary,
})

export const mapOverlayLoading = style({
	position: 'absolute',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.sm,
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.lg,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
	zIndex: 10,
})
