/**
 * PaymentCheckoutPage Styles - 3Balug Brand
 *
 * Página de checkout de pagamento com identidade visual da marca 3Balug.
 * Layout split-screen compacto com formulário de pagamento à esquerda e resumo à direita.
 */

import { keyframes, style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

/**
 * Animations
 */
const fadeIn = keyframes({
	from: { opacity: 0, transform: 'translateY(8px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

const spin = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
})

const float = keyframes({
	'0%, 100%': { transform: 'translateY(0) scale(1)' },
	'50%': { transform: 'translateY(-10px) scale(1.02)' },
})

/**
 * Page Layout
 */
export const paymentPage = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '100%',
	backgroundColor: vars.color.bg.secondary,
	padding: vars.spacing.sm,

	'@media': {
		[mediaQuery.lg]: {
			padding: vars.spacing.md,
		},
	},
})

export const paymentContainer = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	width: '100%',
	maxWidth: '1100px',
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	boxShadow: vars.shadow.xl,
	overflow: 'hidden',

	'@media': {
		[mediaQuery.lg]: {
			gridTemplateColumns: '1.15fr 0.85fr',
		},
	},
})

/**
 * Left Column - Payment Form
 */
export const paymentLeftColumn = style({
	display: 'flex',
	flexDirection: 'column',
	padding: vars.spacing.lg,
	animation: `${fadeIn} 0.4s ease-out`,

	'@media': {
		[mediaQuery.lg]: {
			padding: `${vars.spacing.xl} ${vars.spacing['2xl']}`,
		},
	},
})

/**
 * Header
 */
export const paymentHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	marginBottom: vars.spacing.md,
	flexWrap: 'wrap',
})

export const paymentIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '40px',
	height: '40px',
	minWidth: '40px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.primary.main,
	boxShadow: vars.shadow.primary,
})

export const paymentIcon = style({
	width: '20px',
	height: '20px',
	color: vars.color.primary.dark,
})

export const paymentHeaderContent = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minWidth: 0,
})

export const paymentHeaderTitle = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	lineHeight: vars.lineHeight.tight,
	letterSpacing: vars.letterSpacing.tight,
})

export const paymentHeaderText = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	marginTop: '1px',
})

export const timerBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: '4px',
	padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
	backgroundColor: 'rgba(230, 255, 75, 0.15)',
	border: '1px solid rgba(159, 182, 1, 0.3)',
	borderRadius: vars.borderRadius.md,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
})

/**
 * Form
 */
export const paymentForm = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const paymentError = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.sm,
	backgroundColor: vars.color.error.light,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.md,
	color: vars.color.error.dark,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
})

export const errorIcon = style({
	width: '16px',
	height: '16px',
	flexShrink: 0,
	color: vars.color.error.main,
})

export const inputRow = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing.sm,
	'@media': {
		'(min-width: 640px)': {
			gridTemplateColumns: '1fr 1fr',
		},
	},
})

export const submitButton = style({
	marginTop: vars.spacing.xs,
	height: '40px',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
})

export const backLink = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.secondary,
	textDecoration: 'none',
	borderRadius: vars.borderRadius.md,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	marginTop: vars.spacing.xs,
	selectors: {
		'&:hover': {
			color: vars.color.secondary.main,
			backgroundColor: 'rgba(159, 182, 1, 0.05)',
		},
	},
})

/**
 * Right Column - Summary Section
 */
export const paymentRightColumn = style({
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	padding: vars.spacing.lg,
	background: `linear-gradient(135deg, ${vars.color.neutral.offWhite} 0%, rgba(230, 255, 75, 0.05) 100%)`,
	borderTop: `1px solid ${vars.color.neutral.grayLight}`,
	gap: vars.spacing.lg,
	position: 'relative',
	overflow: 'hidden',

	'@media': {
		[mediaQuery.lg]: {
			borderTop: 'none',
			justifyContent: 'center',
			padding: vars.spacing.xl,
			borderTopRightRadius: vars.borderRadius.xl,
			borderBottomRightRadius: vars.borderRadius.xl,
		},
	},
})

/**
 * Customer Info
 */
export const customerInfo = style({
	padding: vars.spacing.lg,
	background: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	boxShadow: vars.shadow.sm,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&:hover': {
			boxShadow: vars.shadow.md,
			borderColor: vars.color.secondary.main,
		},
	},
})

export const customerInfoItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} 0`,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
})

export const customerInfoIcon = style({
	color: vars.color.secondary.main,
	flexShrink: 0,
	width: '16px',
	height: '16px',
})

/**
 * Order Summary
 */
export const orderSummary = style({
	padding: vars.spacing.lg,
	background: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	boxShadow: vars.shadow.sm,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&:hover': {
			boxShadow: vars.shadow.md,
			borderColor: vars.color.secondary.main,
		},
	},
})

export const summaryTitle = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: vars.spacing.md,
	letterSpacing: vars.letterSpacing.tight,
})

export const summaryItem = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: `${vars.spacing.sm} 0`,
	borderBottom: `1px solid ${vars.color.neutral.grayLight}`,
})

export const summaryLabel = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
})

export const summaryValue = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const summaryTotal = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: `${vars.spacing.md} 0`,
	marginTop: vars.spacing.sm,
})

export const summaryTotalLabel = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const summaryTotalValue = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.secondary.main,
})

/**
 * Security Badge
 */
export const securityBadge = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	padding: vars.spacing.lg,
	background: `linear-gradient(135deg, ${vars.color.primary.dark} 0%, #434d00 100%)`,
	borderRadius: vars.borderRadius.xl,
	color: vars.color.neutral.white,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	boxShadow: vars.shadow.primaryLarge,
	position: 'relative',
	overflow: 'hidden',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&::before': {
			content: '""',
			position: 'absolute',
			top: '-20px',
			right: '-20px',
			width: '80px',
			height: '80px',
			borderRadius: '50%',
			background: 'rgba(230, 255, 75, 0.1)',
			animation: `${float} 6s ease-in-out infinite`,
		},
		'&:hover': {
			boxShadow: '0 12px 32px rgba(67, 77, 0, 0.35)',
			transform: 'translateY(-2px)',
		},
	},
})

export const securityIcon = style({
	width: '20px',
	height: '20px',
	flexShrink: 0,
	position: 'relative',
	zIndex: 1,
})

/**
 * Loading State
 */
export const loadingContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.md,
	padding: vars.spacing.xl,
	color: vars.color.text.secondary,
	fontFamily: vars.fontFamily.body,
})

export const loadingSpinner = style({
	width: '40px',
	height: '40px',
	color: vars.color.secondary.main,
	animation: `${spin} 1s linear infinite`,
})
