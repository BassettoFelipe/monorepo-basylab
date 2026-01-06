import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

export const topBar = style({
	position: 'fixed',
	top: '64px',
	left: 0,
	right: 0,
	width: '100%',
	height: '56px',
	backgroundColor: '#434D00',
	display: 'flex',
	alignItems: 'center',
	padding: `0 ${vars.spacing.lg}`,
	zIndex: 90,
	boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',

	'@media': {
		'(max-width: 1024px)': {
			top: '56px',
			height: '52px',
			padding: `0 ${vars.spacing.md}`,
		},
		'(max-width: 768px)': {
			padding: `0 ${vars.spacing.sm}`,
			height: '48px',
		},
	},
})

export const navContainer = style({
	display: 'flex',
	alignItems: 'center',
	width: '100%',
	height: '100%',
	justifyContent: 'stretch',
})

export const navGroupWrapper = style({
	position: 'relative',
	height: '100%',
	display: 'flex',
	alignItems: 'center',
	flex: 1,
})

export const navGroup = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	height: '100%',
	width: '100%',
	padding: `0 ${vars.spacing.sm}`,
	color: 'rgba(255, 255, 255, 0.85)',
	textDecoration: 'none',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	transition: 'all 0.2s ease',
	whiteSpace: 'nowrap',
	borderBottom: '3px solid transparent',
	backgroundColor: 'transparent',
	border: 'none',
	cursor: 'pointer',
	fontFamily: 'inherit',
	flex: 1,

	':hover': {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		color: '#FFFFFF',
	},

	':focus-visible': {
		outline: '2px solid #E6FF4B',
		outlineOffset: '-2px',
	},

	'@media': {
		'(max-width: 1024px)': {
			padding: `0 ${vars.spacing.xs}`,
			fontSize: vars.fontSize.xs,
		},
		'(max-width: 768px)': {
			padding: '0 4px',
			gap: '3px',
		},
	},
})

export const navGroupActive = style({
	backgroundColor: 'rgba(230, 255, 75, 0.15)',
	color: '#E6FF4B',
	borderBottomColor: '#E6FF4B',

	':hover': {
		backgroundColor: 'rgba(230, 255, 75, 0.2)',
		color: '#E6FF4B',
	},
})

export const navGroupLabel = style({
	overflow: 'hidden',
	textOverflow: 'ellipsis',

	'@media': {
		'(max-width: 640px)': {
			display: 'none',
		},
	},
})

export const chevron = style({
	flexShrink: 0,
	transition: 'transform 0.2s ease',
	opacity: 0.7,

	'@media': {
		'(max-width: 640px)': {
			display: 'none',
		},
	},
})

export const chevronOpen = style({
	transform: 'rotate(180deg)',
	opacity: 1,
})

export const dropdown = style({
	position: 'absolute',
	top: '100%',
	left: 0,
	width: 'max-content',
	minWidth: '200px',
	maxWidth: 'calc(100vw - 32px)',
	backgroundColor: '#FFFFFF',
	borderRadius: vars.borderRadius.lg,
	boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.3)',
	border: '1px solid #E7E5E4',
	padding: vars.spacing.sm,
	zIndex: 1100,
	marginTop: '4px',
	opacity: 0,
	visibility: 'hidden',
	transform: 'translateY(-4px)',
	transition: 'opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease',

	'@media': {
		'(max-width: 768px)': {
			minWidth: '180px',
			padding: vars.spacing.xs,
		},
	},
})

// Mostrar dropdown no hover do wrapper
globalStyle(`${navGroupWrapper}:hover ${dropdown}`, {
	opacity: 1,
	visibility: 'visible',
	transform: 'translateY(0)',
})

// Rotacionar chevron no hover
globalStyle(`${navGroupWrapper}:hover ${chevron}`, {
	transform: 'rotate(180deg)',
	opacity: 1,
})

// Posicionar dropdown à direita nos últimos itens para não vazar da tela
export const dropdownRight = style({
	left: 'auto',
	right: 0,
})

export const dropdownItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.md,
	padding: `10px ${vars.spacing.md}`,
	borderRadius: vars.borderRadius.md,
	color: '#57534E',
	textDecoration: 'none',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	transition: 'all 0.15s ease',
	position: 'relative',
	whiteSpace: 'nowrap',

	':hover': {
		backgroundColor: '#F7FCE8',
		color: '#434D00',
	},

	':focus-visible': {
		outline: '2px solid #9FB601',
		outlineOffset: '-2px',
	},
})

export const dropdownItemActive = style({
	backgroundColor: '#EDF7C8',
	color: '#434D00',
	fontWeight: vars.fontWeight.bold,

	'::before': {
		content: '""',
		position: 'absolute',
		left: 0,
		top: '50%',
		transform: 'translateY(-50%)',
		width: '3px',
		height: '50%',
		backgroundColor: '#9FB601',
		borderRadius: '0 2px 2px 0',
	},
})

export const dropdownItemIcon = style({
	flexShrink: 0,
	opacity: 0.7,
})

export const dropdownItemLabel = style({
	flex: 1,
})

export const badge = style({
	fontSize: '0.6rem',
	padding: '3px 6px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: '#DBEAFE',
	color: '#1E40AF',
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	whiteSpace: 'nowrap',
	flexShrink: 0,
})
