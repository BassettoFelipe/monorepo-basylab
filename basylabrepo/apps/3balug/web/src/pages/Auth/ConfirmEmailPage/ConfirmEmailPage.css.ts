/**
 * ConfirmEmailPage Styles - 3Balug Brand
 *
 * Página de confirmação de email com design moderno seguindo
 * o padrão de UI/UX da aplicação.
 */

import { keyframes, style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

/**
 * Animations
 */
const fadeInUp = keyframes({
	'0%': { opacity: '0', transform: 'translateY(20px)' },
	'100%': { opacity: '1', transform: 'translateY(0)' },
})

const float = keyframes({
	'0%, 100%': { transform: 'translateY(0)' },
	'50%': { transform: 'translateY(-10px)' },
})

/**
 * Page Layout
 */
export const confirmEmailPage = style({
	minHeight: '100%',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.color.bg.primary,
	padding: vars.spacing.md,
	position: 'relative',
	overflow: 'hidden',

	'@media': {
		[mediaQuery.md]: {
			padding: vars.spacing.sm,
		},
		'(max-width: 480px)': {
			padding: vars.spacing.xs,
			minHeight: '100%',
		},
	},
})

export const backgroundDecor = style({
	position: 'absolute',
	top: '-200px',
	right: '-200px',
	width: '600px',
	height: '600px',
	borderRadius: '50%',
	background: 'radial-gradient(circle, rgba(230, 255, 75, 0.15) 0%, transparent 70%)',
	animation: `${float} 8s ease-in-out infinite`,
	pointerEvents: 'none',
	zIndex: 0,

	'@media': {
		[mediaQuery.md]: {
			width: '300px',
			height: '300px',
			top: '-100px',
			right: '-100px',
		},
		'(max-width: 480px)': {
			display: 'none',
		},
	},
})

export const backgroundDecor2 = style({
	position: 'absolute',
	bottom: '-150px',
	left: '-150px',
	width: '400px',
	height: '400px',
	borderRadius: '50%',
	background: 'radial-gradient(circle, rgba(159, 182, 1, 0.1) 0%, transparent 70%)',
	animation: `${float} 10s ease-in-out infinite`,
	animationDelay: '-3s',
	pointerEvents: 'none',
	zIndex: 0,

	'@media': {
		[mediaQuery.md]: {
			width: '200px',
			height: '200px',
			bottom: '-50px',
			left: '-50px',
		},
		'(max-width: 480px)': {
			display: 'none',
		},
	},
})

/**
 * Container
 */
export const confirmEmailContainer = style({
	position: 'relative',
	zIndex: 1,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius['2xl'],
	padding: vars.spacing['3xl'],
	maxWidth: '540px',
	width: '100%',
	boxShadow: vars.shadow.xl,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	animation: `${fadeInUp} 0.6s ease-out`,

	'@media': {
		[mediaQuery.md]: {
			padding: vars.spacing.xl,
			maxWidth: '480px',
		},
		'(max-width: 480px)': {
			padding: vars.spacing.lg,
			borderRadius: vars.borderRadius.xl,
		},
	},
})

/**
 * Header Section
 */
export const confirmEmailHeader = style({
	textAlign: 'center',
	marginBottom: vars.spacing['2xl'],

	'@media': {
		[mediaQuery.md]: {
			marginBottom: vars.spacing.lg,
		},
		'(max-width: 480px)': {
			marginBottom: vars.spacing.md,
		},
	},
})

export const confirmEmailIcon = style({
	width: '80px',
	height: '80px',
	margin: `0 auto ${vars.spacing.xl}`,
	backgroundColor: vars.color.neutral.offWhite,
	borderRadius: vars.borderRadius.xl,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: vars.color.primary.dark,
	position: 'relative',
	boxShadow: vars.shadow.sm,

	selectors: {
		'&::before': {
			content: '""',
			position: 'absolute',
			inset: '-4px',
			borderRadius: vars.borderRadius.xl,
			background: `linear-gradient(135deg, ${vars.color.primary.main} 0%, ${vars.color.secondary.main} 100%)`,
			opacity: 0.2,
			zIndex: -1,
		},
	},

	'@media': {
		[mediaQuery.md]: {
			width: '64px',
			height: '64px',
			margin: `0 auto ${vars.spacing.md}`,
		},
		'(max-width: 480px)': {
			width: '56px',
			height: '56px',
			margin: `0 auto ${vars.spacing.sm}`,
		},
	},
})

export const confirmEmailTitle = style({
	fontSize: vars.fontSize['3xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: vars.spacing.sm,
	lineHeight: vars.lineHeight.tight,
	letterSpacing: vars.letterSpacing.tight,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize['2xl'],
		},
	},
})

export const confirmEmailSubtitle = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	marginBottom: vars.spacing.xs,
	lineHeight: vars.lineHeight.normal,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const confirmEmailEmail = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.secondary.main,
	letterSpacing: vars.letterSpacing.tight,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize.base,
		},
	},
})

/**
 * Form Section
 */
export const confirmEmailForm = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xl,

	'@media': {
		'(max-width: 480px)': {
			gap: vars.spacing.md,
		},
	},
})

/**
 * Submit Button
 */
export const submitButton = style({
	marginTop: vars.spacing.md,
})

/**
 * Footer Section
 */
export const confirmEmailFooter = style({
	marginTop: vars.spacing.xl,
	paddingTop: vars.spacing.xl,
	borderTop: `1px solid ${vars.color.neutral.grayLight}`,
	textAlign: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,

	'@media': {
		[mediaQuery.md]: {
			marginTop: vars.spacing.md,
			paddingTop: vars.spacing.md,
			gap: vars.spacing.sm,
		},
		'(max-width: 480px)': {
			marginTop: vars.spacing.sm,
			paddingTop: vars.spacing.sm,
		},
	},
})
