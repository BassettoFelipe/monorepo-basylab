import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const fadeIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
})

const slideUp = keyframes({
	from: { opacity: 0, transform: 'translateY(10px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

const pulseGlow = keyframes({
	'0%': { boxShadow: '0 0 0 0 rgba(159, 182, 1, 0.4)' },
	'70%': { boxShadow: '0 0 0 6px rgba(159, 182, 1, 0)' },
	'100%': { boxShadow: '0 0 0 0 rgba(159, 182, 1, 0)' },
})

export const mobileOverlay = style({
	display: 'none',

	'@media': {
		'(max-width: 1024px)': {
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			backdropFilter: 'blur(4px)',
			zIndex: 1000,
			display: 'block',
			animation: `${fadeIn} 0.2s ease-out`,
		},
	},
})

export const sidebar = style({
	width: '72px',
	height: 'calc(100vh - 120px)',
	backgroundColor: '#FFFFFF',
	borderRight: '1px solid #E7E5E4',
	display: 'flex',
	flexDirection: 'column',
	position: 'fixed',
	left: 0,
	top: '120px',
	zIndex: 50,
	boxShadow: '1px 0 3px rgba(0, 0, 0, 0.05)',
	overflow: 'visible',

	'@media': {
		'(max-width: 1024px)': {
			width: '280px',
			height: '100dvh',
			top: 0,
			left: 0,
			transform: 'translateX(-100%)',
			transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			zIndex: 1001,
			boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
			overflowY: 'auto',
			overflowX: 'hidden',
		},
	},
})

export const sidebarHiddenOnDesktop = style({
	'@media': {
		'(min-width: 1025px)': {
			display: 'none',
		},
	},
})

// Visible scrollbar for sidebar on mobile
globalStyle(`${sidebar}::-webkit-scrollbar`, {
	width: '6px',
})

globalStyle(`${sidebar}::-webkit-scrollbar-track`, {
	backgroundColor: '#F5F5F4',
})

globalStyle(`${sidebar}::-webkit-scrollbar-thumb`, {
	backgroundColor: '#D6D3D1',
	borderRadius: '3px',
})

globalStyle(`${sidebar}::-webkit-scrollbar-thumb:hover`, {
	backgroundColor: '#A8A29E',
})

export const sidebarOpen = style({
	'@media': {
		'(max-width: 1024px)': {
			transform: 'translateX(0)',
		},
	},
})

export const sidebarHeader = style({
	display: 'none',

	'@media': {
		'(max-width: 1024px)': {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: `${vars.spacing.sm} ${vars.spacing.md}`,
			borderBottom: '1px solid #E7E5E4',
			minHeight: '52px',
			flexShrink: 0,
		},
	},
})

export const logo = style({
	width: '100px',
	height: 'auto',
	objectFit: 'contain',
})

export const closeButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '32px',
	height: '32px',
	border: 'none',
	backgroundColor: '#F5F5F4',
	color: '#57534E',
	cursor: 'pointer',
	borderRadius: vars.borderRadius.full,
	transition: 'all 0.2s ease',
	flexShrink: 0,

	':hover': {
		backgroundColor: '#E7E5E4',
		color: '#292524',
	},

	':active': {
		backgroundColor: '#D6D3D1',
	},
})

export const nav = style({
	flex: 1,
	overflow: 'visible',
	padding: vars.spacing.sm,
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',

	'@media': {
		'(max-width: 1024px)': {
			padding: vars.spacing.sm,
			gap: '2px',
			overflowY: 'auto',
			overflowX: 'hidden',
		},
	},
})

// Visible scrollbar for nav
globalStyle(`${nav}::-webkit-scrollbar`, {
	width: '6px',
})

globalStyle(`${nav}::-webkit-scrollbar-track`, {
	backgroundColor: '#F5F5F4',
})

globalStyle(`${nav}::-webkit-scrollbar-thumb`, {
	backgroundColor: '#D6D3D1',
	borderRadius: '3px',
})

globalStyle(`${nav}::-webkit-scrollbar-thumb:hover`, {
	backgroundColor: '#A8A29E',
})

export const navItem = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	height: '44px',
	borderRadius: vars.borderRadius.lg,
	color: '#57534E',
	textDecoration: 'none',
	transition: 'all 0.2s ease',
	position: 'relative',
	flexShrink: 0,

	':hover': {
		backgroundColor: '#F7FCE8',
		color: '#434D00',
	},

	':focus-visible': {
		outline: '2px solid #9FB601',
		outlineOffset: '-2px',
	},

	'@media': {
		'(max-width: 1024px)': {
			justifyContent: 'flex-start',
			padding: `0 ${vars.spacing.md}`,
			gap: vars.spacing.md,
			height: '40px',
		},
	},
})

export const navItemActive = style({
	backgroundColor: '#EDF7C8',
	color: '#434D00',

	'::after': {
		content: '""',
		position: 'absolute',
		left: 0,
		top: '50%',
		transform: 'translateY(-50%)',
		width: '3px',
		height: '20px',
		backgroundColor: '#9FB601',
		borderRadius: '0 3px 3px 0',
		animation: `${pulseGlow} 2s ease-in-out infinite`,
	},
})

export const navItemIcon = style({
	flexShrink: 0,
})

export const navItemLabel = style({
	display: 'none',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,

	'@media': {
		'(max-width: 1024px)': {
			display: 'block',
		},
	},
})

export const tooltip = style({
	position: 'absolute',
	left: 'calc(100% + 12px)',
	top: '50%',
	transform: 'translateY(-50%)',
	backgroundColor: '#292524',
	color: '#FFFFFF',
	padding: '8px 12px',
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	whiteSpace: 'nowrap',
	pointerEvents: 'none',
	opacity: 0,
	visibility: 'hidden',
	transition: 'opacity 0.15s ease, visibility 0.15s ease',
	zIndex: 10000,
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',

	'::before': {
		content: '""',
		position: 'absolute',
		left: '-6px',
		top: '50%',
		transform: 'translateY(-50%)',
		border: '6px solid transparent',
		borderRightColor: '#292524',
	},

	'@media': {
		'(max-width: 1024px)': {
			display: 'none',
		},
	},
})

globalStyle(`${navItem}:hover ${tooltip}`, {
	opacity: 1,
	visibility: 'visible',
})

// Footer with Profile (Mobile only) - compact
export const sidebarFooter = style({
	display: 'none',

	'@media': {
		'(max-width: 1024px)': {
			display: 'block',
			borderTop: '1px solid #E7E5E4',
			padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
			flexShrink: 0,
			position: 'relative',
		},
	},
})

export const profileSection = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: '#FAFAF9',
	borderRadius: vars.borderRadius.md,
	border: '1px solid #E7E5E4',
	marginBottom: vars.spacing.xs,
	width: '100%',
	cursor: 'pointer',
	transition: 'all 0.2s ease',

	':hover': {
		backgroundColor: '#F5F5F4',
		borderColor: '#D6D3D1',
	},

	':active': {
		backgroundColor: '#E7E5E4',
	},
})

export const userAvatar = style({
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.full,
	background: 'linear-gradient(135deg, #C7E356 0%, #9FB601 100%)',
	color: '#3F480A',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.bold,
	flexShrink: 0,
	boxShadow: '0 2px 4px rgba(159, 182, 1, 0.25)',
})

export const profileInfo = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minWidth: 0,
})

export const userName = style({
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	color: '#292524',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	lineHeight: 1.3,
})

export const userPlan = style({
	fontSize: '10px',
	fontWeight: vars.fontWeight.medium,
	color: '#78716C',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	lineHeight: 1.3,
})

export const profileActions = style({
	position: 'absolute',
	bottom: 'calc(100% + 8px)',
	left: vars.spacing.sm,
	right: vars.spacing.sm,
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	backgroundColor: '#FFFFFF',
	border: '1px solid #E7E5E4',
	borderRadius: vars.borderRadius.lg,
	padding: vars.spacing.xs,
	boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
	animation: `${slideUp} 0.2s ease`,
	zIndex: 10,
})

export const profileActionItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: `8px ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.md,
	color: '#57534E',
	textDecoration: 'none',
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	cursor: 'pointer',
	transition: 'all 0.15s ease',
	width: '100%',
	border: 'none',
	backgroundColor: 'transparent',
	textAlign: 'left',

	':hover': {
		backgroundColor: '#F5F5F4',
		color: '#292524',
	},

	':active': {
		backgroundColor: '#E7E5E4',
	},
})

export const profileActionDanger = style({
	color: '#DC2626',

	':hover': {
		backgroundColor: '#FEF2F2',
		color: '#DC2626',
	},
})

export const chevronIcon = style({
	color: '#78716C',
	transition: 'transform 0.2s ease',
	flexShrink: 0,
	marginLeft: 'auto',
})

export const chevronOpen = style({
	transform: 'rotate(180deg)',
})

export const floatingMenuButton = style({
	display: 'none',

	'@media': {
		'(max-width: 1024px)': {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			position: 'fixed',
			top: '16px',
			left: '16px',
			width: '44px',
			height: '44px',
			backgroundColor: '#FFFFFF',
			border: '1px solid #E7E5E4',
			borderRadius: vars.borderRadius.lg,
			color: '#57534E',
			cursor: 'pointer',
			zIndex: 999,
			boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
			transition: 'all 0.2s ease',

			':hover': {
				backgroundColor: '#F5F5F4',
				borderColor: '#D6D3D1',
				color: '#292524',
			},

			':active': {
				backgroundColor: '#E7E5E4',
				transform: 'scale(0.95)',
			},
		},
	},
})
