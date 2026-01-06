/**
 * RegisterPage Styles - 3Balug Brand
 *
 * Página de registro com identidade visual da marca 3Balug.
 * Layout split-screen compacto com formulário à esquerda e resumo/benefícios à direita.
 */

import { globalStyle, keyframes, style } from '@vanilla-extract/css'
import { mediaQuery, vars } from '@/design-system/theme.css'

/**
 * Screen reader only utility class
 */
globalStyle('.sr-only', {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: 0,
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	whiteSpace: 'nowrap',
	border: 0,
})

/**
 * Animações
 */
const fadeIn = keyframes({
	from: { opacity: 0, transform: 'translateY(8px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

const float = keyframes({
	'0%, 100%': { transform: 'translateY(0) scale(1)' },
	'50%': { transform: 'translateY(-10px) scale(1.02)' },
})

const floatReverse = keyframes({
	'0%, 100%': { transform: 'translateY(0) scale(1)' },
	'50%': { transform: 'translateY(10px) scale(0.98)' },
})

/**
 * Page Layout
 */
export const registerPage = style({
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

export const registerContainer = style({
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
 * Left Column - Form Section
 */
export const registerLeftColumn = style({
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	padding: vars.spacing.md,
	animation: `${fadeIn} 0.4s ease-out`,

	'@media': {
		[mediaQuery.lg]: {
			padding: `${vars.spacing.lg} ${vars.spacing.xl}`,
		},
	},
})

/**
 * Header
 */
export const registerHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	marginBottom: vars.spacing.sm,
})

export const registerIconWrapper = style({
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

export const registerIcon = style({
	width: '20px',
	height: '20px',
	color: vars.color.primary.dark,
})

export const registerHeaderContent = style({
	display: 'flex',
	flexDirection: 'column',
})

export const registerHeaderTitle = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	lineHeight: vars.lineHeight.tight,
	letterSpacing: vars.letterSpacing.tight,
})

export const registerHeaderText = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	marginTop: '1px',
})

/**
 * Form
 */
export const registerForm = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
})

/**
 * Error Box
 */
export const registerError = style({
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

/**
 * Password Strength Indicator
 */
export const passwordStrength = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	minHeight: '16px',
	transition: `opacity ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
})

export const passwordStrengthBars = style({
	display: 'flex',
	gap: '2px',
	flex: 1,
})

export const passwordStrengthBar = style({
	height: '3px',
	flex: 1,
	borderRadius: '2px',
	backgroundColor: vars.color.neutral.grayLight,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
})

export const passwordStrengthBarWeak = style({
	backgroundColor: vars.color.error.main,
	boxShadow: `0 0 4px ${vars.color.error.main}40`,
})

export const passwordStrengthBarMedium = style({
	backgroundColor: '#f59e0b',
	boxShadow: '0 0 4px rgba(245, 158, 11, 0.4)',
})

export const passwordStrengthBarStrong = style({
	backgroundColor: vars.color.success.main,
	boxShadow: `0 0 4px ${vars.color.success.main}40`,
})

export const passwordStrengthLabel = style({
	fontSize: '10px',
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	whiteSpace: 'nowrap',
	letterSpacing: '0.3px',
	textTransform: 'uppercase',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
})

export const passwordStrengthLabelWeak = style({
	color: vars.color.error.main,
})

export const passwordStrengthLabelMedium = style({
	color: '#f59e0b',
})

export const passwordStrengthLabelStrong = style({
	color: vars.color.success.main,
})

export const passwordRequirements = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: '6px',
	padding: vars.spacing.sm,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.md,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	minHeight: '60px',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
})

export const passwordRequirement = style({
	display: 'flex',
	alignItems: 'center',
	gap: '7px',
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.primary,
	padding: '4px 6px',
	borderRadius: vars.borderRadius.sm,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	backgroundColor: 'transparent',
})

export const passwordRequirementMet = style({
	color: vars.color.success.dark,
	fontWeight: vars.fontWeight.medium,
	backgroundColor: 'rgba(34, 197, 94, 0.12)',
})

export const passwordRequirementIcon = style({
	width: '14px',
	height: '14px',
	flexShrink: 0,
	color: vars.color.neutral.grayDark,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	opacity: vars.opacity[50],
	selectors: {
		[`${passwordRequirementMet} &`]: {
			color: vars.color.success.dark,
			opacity: 1,
			filter: `drop-shadow(0 0 3px ${vars.color.success.main}50)`,
		},
	},
})

/**
 * Terms Checkbox
 */
export const termsCheckboxWrapper = style({
	display: 'flex',
	flexDirection: 'column',
	border: 'none',
	padding: 0,
	margin: `${vars.spacing.md} 0 ${vars.spacing.sm} 0`,
	minWidth: 0,
})

export const termsCheckboxLabel = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.sm,
	cursor: 'pointer',
	userSelect: 'none',
	paddingTop: '2px',
})

export const termsCheckboxInput = style({
	position: 'absolute',
	opacity: 0,
	width: 0,
	height: 0,
})

export const termsCheckbox = style({
	width: '20px',
	height: '20px',
	minWidth: '20px',
	borderRadius: '4px',
	border: `2px solid ${vars.color.neutral.grayLight}`,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.color.bg.primary,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	flexShrink: 0,
	boxSizing: 'border-box',
	selectors: {
		[`${termsCheckboxInput}:checked + &`]: {
			backgroundColor: vars.color.secondary.main,
			borderColor: vars.color.secondary.main,
		},
		[`${termsCheckboxInput}:focus + &`]: {
			boxShadow: '0 0 0 3px rgba(159, 182, 1, 0.2)',
			borderColor: vars.color.secondary.main,
		},
		[`${termsCheckboxLabel}:hover &`]: {
			borderColor: vars.color.secondary.main,
		},
	},
})

export const termsCheckboxError = style({
	borderColor: `${vars.color.border.error} !important`,
	selectors: {
		[`${termsCheckboxInput}:focus + &`]: {
			boxShadow: `0 0 0 3px ${vars.color.error.light}33`,
			borderColor: vars.color.error.main,
		},
		[`${termsCheckboxLabel}:hover &`]: {
			borderColor: vars.color.error.main,
		},
	},
})

export const termsCheckboxIcon = style({
	width: '12px',
	height: '12px',
	color: vars.color.neutral.white,
	opacity: 0,
	transform: 'scale(0)',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	selectors: {
		[`${termsCheckboxInput}:checked + ${termsCheckbox} &`]: {
			opacity: 1,
			transform: 'scale(1)',
		},
	},
})

export const termsCheckboxText = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.normal,
})

export const termsCheckboxLink = style({
	color: vars.color.secondary.main,
	textDecoration: 'none',
	fontWeight: vars.fontWeight.medium,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	selectors: {
		'&:hover': {
			color: vars.color.secondary.main,
			textDecoration: 'underline',
		},
	},
})

export const termsCheckboxErrorMessage = style({
	fontSize: '10px',
	fontFamily: vars.fontFamily.body,
	color: vars.color.error.main,
	marginLeft: '28px',
	marginTop: '4px',
})

/**
 * Submit Button
 */
export const submitButton = style({
	marginTop: vars.spacing.sm,
	height: '40px',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
})

/**
 * Right Column - Summary Section
 */
export const registerRightColumn = style({
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
		},
	},
})

export const sidebarHeader = style({})

export const sidebarTitle = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: '4px',
	letterSpacing: vars.letterSpacing.tight,
})

export const sidebarSubtitle = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	fontWeight: vars.fontWeight.medium,
})

/**
 * Plan Placeholder
 */
export const planPlaceholder = style({
	padding: vars.spacing.xl,
	background: vars.color.bg.primary,
	border: `2px dashed ${vars.color.neutral.grayLight}`,
	borderRadius: vars.borderRadius.xl,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	textAlign: 'center',
	gap: vars.spacing.sm,
	minHeight: '180px',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	selectors: {
		'&:hover': {
			borderColor: vars.color.secondary.main,
			backgroundColor: 'rgba(230, 255, 75, 0.03)',
		},
	},
})

export const planPlaceholderIcon = style({
	width: '36px',
	height: '36px',
	color: vars.color.neutral.grayDark,
})

export const planPlaceholderTitle = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.secondary,
})

export const planPlaceholderText = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.tertiary,
	maxWidth: '200px',
})

/**
 * Plan Card
 */
export const planCard = style({
	padding: vars.spacing.lg,
	background: vars.color.bg.primary,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	borderRadius: vars.borderRadius.xl,
	boxShadow: vars.shadow.sm,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	selectors: {
		'&:hover': {
			boxShadow: vars.shadow.lg,
			transform: 'translateY(-2px)',
			borderColor: vars.color.primary.main,
		},
	},
})

export const planCardHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	marginBottom: vars.spacing.sm,
})

export const planCardIcon = style({
	width: '32px',
	height: '32px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.primary.main,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
	color: vars.color.primary.dark,
	boxShadow: vars.shadow.primary,
})

export const planCardIconSvg = style({
	width: '16px',
	height: '16px',
})

export const planCardTitleWrapper = style({
	flex: 1,
	minWidth: 0,
})

export const planCardTitle = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
})

export const planCardSubtitle = style({
	fontSize: '10px',
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.tertiary,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wide,
})

export const planCardPrice = style({
	display: 'flex',
	alignItems: 'baseline',
	gap: '2px',
	flexShrink: 0,
})

export const planCardPriceAmount = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.secondary.main,
})

export const planCardPricePeriod = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.tertiary,
})

export const planCardDivider = style({
	height: '1px',
	backgroundColor: vars.color.neutral.grayLight,
	marginBottom: vars.spacing.sm,
})

export const planCardFeatures = style({
	listStyle: 'none',
	display: 'flex',
	flexDirection: 'column',
	gap: '6px',
})

export const planCardFeature = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
})

export const planCardFeatureIcon = style({
	width: '14px',
	height: '14px',
	flexShrink: 0,
	color: vars.color.success.main,
})

/**
 * Benefits Section
 */
export const benefitsSection = style({
	padding: vars.spacing.lg,
	background: `linear-gradient(135deg, ${vars.color.primary.dark} 0%, #434d00 100%)`,
	borderRadius: vars.borderRadius.xl,
	boxShadow: vars.shadow.primaryLarge,
	border: 'none',
	position: 'relative',
	overflow: 'hidden',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&::before': {
			content: '""',
			position: 'absolute',
			top: '-50px',
			right: '-50px',
			width: '150px',
			height: '150px',
			borderRadius: '50%',
			background: 'rgba(230, 255, 75, 0.1)',
			animation: `${float} 8s ease-in-out infinite`,
		},
		'&::after': {
			content: '""',
			position: 'absolute',
			bottom: '-30px',
			left: '-30px',
			width: '100px',
			height: '100px',
			borderRadius: '50%',
			background: 'rgba(230, 255, 75, 0.08)',
			animation: `${floatReverse} 10s ease-in-out infinite`,
		},
		'&:hover': {
			boxShadow: '0 12px 32px rgba(67, 77, 0, 0.35)',
			transform: 'translateY(-2px)',
		},
	},
})

export const benefitsTitle = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.neutral.white,
	marginBottom: vars.spacing.sm,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wider,
	opacity: vars.opacity[80],
	position: 'relative',
	zIndex: 1,
})

export const benefitsList = style({
	listStyle: 'none',
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: vars.spacing.sm,
	position: 'relative',
	zIndex: 1,
})

export const benefitItem = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.neutral.white,
	padding: vars.spacing.sm,
	backgroundColor: 'rgba(230, 255, 75, 0.15)',
	borderRadius: vars.borderRadius.lg,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	backdropFilter: 'blur(10px)',
	border: '1px solid rgba(230, 255, 75, 0.2)',

	selectors: {
		'&:hover': {
			backgroundColor: 'rgba(230, 255, 75, 0.25)',
			transform: 'translateY(-1px)',
			boxShadow: vars.shadow.xs,
		},
	},
})

export const benefitIconWrapper = style({
	width: '28px',
	height: '28px',
	minWidth: '28px',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.color.primary.main,
	borderRadius: vars.borderRadius.md,
	boxShadow: vars.shadow.xs,
})

export const benefitIcon = style({
	width: '14px',
	height: '14px',
	flexShrink: 0,
	color: vars.color.primary.dark,
})

/**
 * Footer
 */
export const registerFooter = style({
	marginTop: vars.spacing.md,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,

	'@media': {
		[mediaQuery.lg]: {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr',
		},
	},
})

const footerLinkBase = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.sm} ${vars.spacing.md}`,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	fontWeight: vars.fontWeight.medium,
	textDecoration: 'none',
	borderRadius: vars.borderRadius.md,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	minHeight: '44px',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
})

export const registerFooterLinkSecondary = style([
	footerLinkBase,
	{
		color: vars.color.text.secondary,
		backgroundColor: 'transparent',
		border: `1px solid ${vars.color.neutral.grayLight}`,
		selectors: {
			'&:hover': {
				color: vars.color.secondary.main,
				borderColor: vars.color.secondary.main,
				backgroundColor: 'rgba(159, 182, 1, 0.05)',
			},
		},
	},
])

export const registerFooterLinkPrimary = style([
	footerLinkBase,
	{
		color: vars.color.primary.dark,
		backgroundColor: vars.color.primary.main,
		border: `1px solid ${vars.color.primary.main}`,
		selectors: {
			'&:hover': {
				backgroundColor: vars.color.primary.dark,
				borderColor: vars.color.primary.dark,
				color: vars.color.primary.main,
			},
		},
	},
])

export const footerLinkIcon = style({
	width: '14px',
	height: '14px',
	flexShrink: 0,
})
