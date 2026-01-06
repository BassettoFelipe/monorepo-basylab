import { style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

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

export const planCardBadge = style({
	display: 'inline-block',
	padding: `${vars.spacing['2xs']} ${vars.spacing.sm}`,
	backgroundColor: vars.color.bg.secondary,
	color: vars.color.text.secondary,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.medium,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
	marginBottom: vars.spacing.xs,
})

export const planCardName = style({
	fontSize: vars.fontSize['2xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,
})

export const planCardPrice = style({
	textAlign: 'center',
	padding: vars.spacing.md,
	background: 'linear-gradient(135deg, rgba(230, 255, 75, 0.2) 0%, rgba(159, 182, 1, 0.15) 100%)',
	borderRadius: vars.borderRadius.lg,
	marginBottom: vars.spacing.sm,
})

export const planCardPriceValue = style({
	fontSize: vars.fontSize['3xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const planCardPricePeriod = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
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

export const planCardFeatureIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '16px',
	height: '16px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.success.light,
	color: vars.color.success.main,
	flexShrink: 0,
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

export const planCardInfoLabel = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
})

export const planCardInfoValue = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
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

export const securityFooterIcon = style({
	color: vars.color.secondary.main,
	flexShrink: 0,
})
