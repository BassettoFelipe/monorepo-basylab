import { keyframes, style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

const fadeIn = keyframes({
	from: { opacity: 0, transform: 'translateY(8px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

export const checkoutPage = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '100%',
	backgroundColor: vars.color.bg.secondary,
	padding: vars.spacing.xs,

	'@media': {
		[mediaQuery.lg]: {
			padding: vars.spacing.sm,
		},
	},
})

export const checkoutContainer = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	width: '100%',
	maxWidth: '960px',
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.lg,
	boxShadow: vars.shadow.lg,
	overflow: 'hidden',

	'@media': {
		[mediaQuery.lg]: {
			gridTemplateColumns: '1.2fr 0.8fr',
		},
	},
})

export const checkoutLeftColumn = style({
	display: 'flex',
	flexDirection: 'column',
	padding: vars.spacing.md,
	animation: `${fadeIn} 0.4s ease-out`,

	'@media': {
		[mediaQuery.lg]: {
			padding: vars.spacing.lg,
		},
	},
})

export const checkoutHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	marginBottom: vars.spacing.sm,
	flex: 1,
})

export const checkoutHeaderContent = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minWidth: 0,
})

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

export const checkoutForm = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const inputRow = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: vars.spacing.sm,
})

export const checkoutRightColumn = style({
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	padding: vars.spacing.lg,
	background: vars.color.bg.secondary,
	borderTop: `1px solid ${vars.color.neutral.grayLight}`,
	gap: vars.spacing.md,

	'@media': {
		[mediaQuery.lg]: {
			borderTop: 'none',
			borderLeft: `1px solid ${vars.color.neutral.grayLight}`,
		},
	},
})

export const planCard = style({
	background: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	padding: vars.spacing.lg,
	boxShadow: vars.shadow.lg,
	border: `1px solid ${vars.color.neutral.grayLight}`,
})

export const planCardHeader = style({
	textAlign: 'center',
	marginBottom: vars.spacing.md,
})

export const planCardPrice = style({
	textAlign: 'center',
	padding: vars.spacing.md,
	background: 'linear-gradient(135deg, rgba(230, 255, 75, 0.2) 0%, rgba(159, 182, 1, 0.15) 100%)',
	borderRadius: vars.borderRadius.lg,
	marginBottom: vars.spacing.sm,
})

export const planCardFeatures = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	marginBottom: vars.spacing.md,
})

export const planCardFeatureItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
})

export const planCardDivider = style({
	height: '1px',
	backgroundColor: vars.color.neutral.grayLight,
	margin: `${vars.spacing.sm} 0`,
})

export const planCardInfo = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
})

export const planCardInfoRow = style({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
})

export const securityFooter = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.sm,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
})
