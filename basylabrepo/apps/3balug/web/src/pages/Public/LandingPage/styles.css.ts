/**
 * PlansPage Styles - 3Balug Brand (Refactored)
 *
 * Landing page moderna com design premium e UX aprimorada.
 * Layout responsivo com animações suaves e hierarquia visual clara.
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
 * Page Wrapper
 */
export const pageWrapper = style({
	minHeight: '100%',
	backgroundColor: vars.color.bg.primary,
	display: 'flex',
	flexDirection: 'column',
	overflowX: 'hidden',
})

export const container = style({
	width: '100%',
	maxWidth: '1280px',
	margin: '0 auto',
	padding: `0 ${vars.spacing.lg}`,

	'@media': {
		[mediaQuery.md]: {
			padding: `0 ${vars.spacing.md}`,
		},
		'(max-width: 640px)': {
			padding: `0 ${vars.spacing.sm}`,
		},
	},
})

/**
 * Header / Navigation
 */
export const header = style({
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	backgroundColor: 'rgba(255, 255, 255, 0.95)',
	backdropFilter: 'blur(20px)',
	WebkitBackdropFilter: 'blur(20px)',
	borderBottom: '1px solid rgba(207, 207, 207, 0.3)',
	padding: `${vars.spacing.md} 0`,
	zIndex: vars.zIndex.sticky,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
})

export const headerContent = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
})

export const logo = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.sm,
	cursor: 'pointer',
	transition: `transform ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		'&:hover': {
			transform: 'scale(1.02)',
		},
	},
})

export const nav = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.lg,

	'@media': {
		'(max-width: 768px)': {
			gap: vars.spacing.md,
		},
	},
})

export const navLink = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	textDecoration: 'none',
	fontWeight: vars.fontWeight.medium,
	padding: `${vars.spacing.xs} 0`,
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
	position: 'relative',

	selectors: {
		'&:hover': {
			color: vars.color.primary.dark,
		},
		'&::after': {
			content: '""',
			position: 'absolute',
			bottom: '-2px',
			left: '0',
			width: '0',
			height: '2px',
			backgroundColor: vars.color.primary.main,
			transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
		},
		'&:hover::after': {
			width: '100%',
		},
	},

	'@media': {
		'(max-width: 640px)': {
			display: 'none',
		},
	},
})

export const navButton = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	backgroundColor: vars.color.primary.main,
	textDecoration: 'none',
	padding: `${vars.spacing.sm} ${vars.spacing.lg}`,
	borderRadius: vars.borderRadius.full,
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
	boxShadow: '0 2px 8px rgba(230, 255, 75, 0.3)',

	selectors: {
		'&:hover': {
			backgroundColor: vars.color.primary.dark,
			color: vars.color.primary.main,
			transform: 'translateY(-2px)',
			boxShadow: '0 4px 16px rgba(67, 77, 0, 0.3)',
		},
		'&:active': {
			transform: 'translateY(0)',
			boxShadow: '0 2px 8px rgba(230, 255, 75, 0.3)',
		},
	},

	'@media': {
		'(max-width: 640px)': {
			padding: `${vars.spacing.xs} ${vars.spacing.md}`,
			fontSize: vars.fontSize.xs,
		},
	},
})

/**
 * Hero Section
 */
export const heroSection = style({
	paddingTop: '120px',
	paddingBottom: vars.spacing['4xl'],
	background: `linear-gradient(180deg, ${vars.color.neutral.offWhite} 0%, ${vars.color.bg.primary} 100%)`,
	position: 'relative',
	overflow: 'hidden',

	'@media': {
		'(max-width: 768px)': {
			paddingTop: '100px',
			paddingBottom: vars.spacing['2xl'],
		},
	},
})

export const heroBackground = style({
	position: 'absolute',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	overflow: 'hidden',
	pointerEvents: 'none',
	zIndex: 0,
})

export const heroGradientOrb = style({
	position: 'absolute',
	borderRadius: '50%',
	filter: 'blur(80px)',
	opacity: 0.4,
	animation: `${float} 8s ease-in-out infinite`,
})

export const heroContent = style({
	position: 'relative',
	zIndex: 1,
	maxWidth: '900px',
	margin: '0 auto',
	textAlign: 'center',
	animation: `${fadeInUp} 0.8s ease-out`,
})

export const heroBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.md}`,
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wide,
	marginBottom: vars.spacing.lg,
})

export const heroTitle = style({
	fontSize: vars.fontSize['5xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	lineHeight: vars.lineHeight.tight,
	marginBottom: vars.spacing.lg,
	letterSpacing: vars.letterSpacing.tight,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize['3xl'],
			marginBottom: vars.spacing.md,
		},
		'(max-width: 480px)': {
			fontSize: vars.fontSize['2xl'],
		},
	},
})

export const heroTitleHighlight = style({
	color: vars.color.secondary.main,
	position: 'relative',
	display: 'inline-block',
})

export const heroDescription = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,
	marginBottom: vars.spacing['2xl'],
	maxWidth: '700px',
	marginLeft: 'auto',
	marginRight: 'auto',

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.base,
			marginBottom: vars.spacing.xl,
		},
	},
})

export const heroActions = style({
	display: 'flex',
	gap: vars.spacing.md,
	justifyContent: 'center',
	flexWrap: 'wrap',

	'@media': {
		'(max-width: 480px)': {
			flexDirection: 'column',
			alignItems: 'stretch',
			gap: vars.spacing.sm,
		},
	},
})

export const heroStats = style({
	display: 'flex',
	justifyContent: 'center',
	gap: vars.spacing['3xl'],
	marginTop: vars.spacing['3xl'],
	paddingTop: vars.spacing['2xl'],
	borderTop: `1px solid ${vars.color.neutral.grayLight}`,
	listStyle: 'none',
	padding: `${vars.spacing['2xl']} 0 0 0`,
	margin: `${vars.spacing['3xl']} 0 0 0`,

	'@media': {
		'(max-width: 768px)': {
			gap: vars.spacing.xl,
			marginTop: vars.spacing['2xl'],
			paddingTop: vars.spacing.xl,
		},
		'(max-width: 480px)': {
			gap: vars.spacing.lg,
			flexWrap: 'wrap',
		},
	},
})

export const heroStat = style({
	textAlign: 'center',
	listStyle: 'none',
})

export const heroStatNumber = style({
	fontSize: vars.fontSize['3xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	lineHeight: vars.lineHeight.tight,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize['2xl'],
		},
	},
})

export const heroStatLabel = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	marginTop: vars.spacing.xs,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xs,
		},
	},
})

/**
 * Features Section
 */
export const featuresSection = style({
	padding: `${vars.spacing['4xl']} 0`,
	backgroundColor: vars.color.bg.primary,
	position: 'relative',

	'@media': {
		'(max-width: 768px)': {
			padding: `${vars.spacing['2xl']} 0`,
		},
	},
})

export const sectionHeader = style({
	textAlign: 'center',
	maxWidth: '700px',
	marginLeft: 'auto',
	marginRight: 'auto',
	marginBottom: vars.spacing.xl,

	'@media': {
		'(max-width: 768px)': {
			marginBottom: vars.spacing.lg,
		},
	},
})

export const sectionLabel = style({
	display: 'inline-block',
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.secondary.main,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wider,
	marginBottom: vars.spacing.sm,
})

export const sectionTitle = style({
	fontSize: vars.fontSize['3xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: vars.spacing.md,
	lineHeight: vars.lineHeight.tight,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize['2xl'],
		},
	},
})

export const sectionDescription = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.base,
		},
	},
})

export const featuresGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: vars.spacing.lg,
	listStyle: 'none',
	padding: 0,
	margin: 0,

	'@media': {
		'(max-width: 1024px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
			gap: vars.spacing.md,
		},
	},
})

export const featureCard = style({
	padding: vars.spacing.xl,
	borderRadius: vars.borderRadius.xl,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	position: 'relative',
	overflow: 'hidden',

	selectors: {
		'&:hover': {
			transform: 'translateY(-4px)',
			boxShadow: vars.shadow.lg,
			borderColor: vars.color.primary.main,
		},
		'&::before': {
			content: '""',
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			height: '3px',
			backgroundColor: vars.color.primary.main,
			transform: 'scaleX(0)',
			transformOrigin: 'left',
			transition: `transform ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
		},
		'&:hover::before': {
			transform: 'scaleX(1)',
		},
	},

	'@media': {
		'(max-width: 768px)': {
			padding: vars.spacing.lg,
		},
	},
})

export const featureIconWrapper = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '56px',
	height: '56px',
	borderRadius: vars.borderRadius.lg,
	backgroundColor: vars.color.neutral.offWhite,
	marginBottom: vars.spacing.lg,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		[`${featureCard}:hover &`]: {
			backgroundColor: vars.color.primary.main,
			transform: 'scale(1.1) rotate(-5deg)',
		},
	},

	'@media': {
		'(max-width: 768px)': {
			width: '48px',
			height: '48px',
			marginBottom: vars.spacing.md,
		},
	},
})

export const featureIcon = style({
	width: '28px',
	height: '28px',
	color: vars.color.primary.dark,
	strokeWidth: 1.5,
	transition: `color ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	selectors: {
		[`${featureCard}:hover &`]: {
			color: vars.color.primary.dark,
		},
	},

	'@media': {
		'(max-width: 768px)': {
			width: '24px',
			height: '24px',
		},
	},
})

export const featureTitle = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.sm,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.base,
		},
	},
})

export const featureDescription = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

/**
 * Plans Section
 */
export const plansSection = style({
	padding: `${vars.spacing['2xl']} 0`,
	backgroundColor: vars.color.neutral.offWhite,
	position: 'relative',

	'@media': {
		'(max-width: 768px)': {
			padding: `${vars.spacing.xl} 0`,
		},
	},
})

export const plansGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, 1fr)',
	gap: vars.spacing.md,
	alignItems: 'stretch',
	listStyle: 'none',
	padding: 0,
	margin: 0,

	'@media': {
		'(max-width: 1024px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr',
			maxWidth: '360px',
			margin: '0 auto',
		},
	},
})

export const planCard = style({
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	padding: vars.spacing.lg,
	boxShadow: vars.shadow.sm,
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	position: 'relative',
	border: '2px solid transparent',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',

	selectors: {
		'&:hover': {
			transform: 'translateY(-4px)',
			boxShadow: vars.shadow.lg,
		},
	},

	'@media': {
		'(max-width: 768px)': {
			padding: vars.spacing.md,
		},
	},
})

export const planCardPopular = style({
	borderColor: vars.color.primary.main,
	boxShadow: vars.shadow.primary,

	selectors: {
		'&:hover': {
			transform: 'translateY(-4px)',
			boxShadow: vars.shadow.primaryLarge,
		},
	},
})

export const planRibbon = style({
	position: 'absolute',
	top: '16px',
	right: '-28px',
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
	padding: `${vars.spacing['2xs']} ${vars.spacing.xl}`,
	fontSize: '0.625rem',
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wide,
	transform: 'rotate(45deg)',
	boxShadow: vars.shadow.xs,
})

export const planBadge = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: `${vars.spacing['2xs']} ${vars.spacing.sm}`,
	borderRadius: vars.borderRadius.full,
	fontSize: '0.625rem',
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wide,
	marginBottom: vars.spacing.sm,
	width: 'fit-content',
})

export const badgeBlue = style({
	backgroundColor: 'rgba(59, 130, 246, 0.1)',
	color: '#2563eb',
})

export const badgeGreen = style({
	backgroundColor: vars.color.success.light,
	color: vars.color.success.dark,
})

export const badgePurple = style({
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
})

export const planContent = style({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
})

export const planHeader = style({
	marginBottom: vars.spacing.md,

	'@media': {
		'(max-width: 768px)': {
			marginBottom: vars.spacing.sm,
		},
	},
})

export const planName = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	marginBottom: vars.spacing['2xs'],

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.base,
		},
	},
})

export const planDescription = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.normal,
	minHeight: '36px',

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xs,
			minHeight: '32px',
		},
	},
})

export const planPricing = style({
	display: 'flex',
	alignItems: 'baseline',
	gap: vars.spacing.xs,
	marginBottom: vars.spacing.md,
	paddingBottom: vars.spacing.md,
	borderBottom: `1px solid ${vars.color.neutral.grayLight}`,

	'@media': {
		'(max-width: 768px)': {
			marginBottom: vars.spacing.sm,
			paddingBottom: vars.spacing.sm,
		},
	},
})

export const planPrice = style({
	fontSize: vars.fontSize['2xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	lineHeight: vars.lineHeight.none,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xl,
		},
	},
})

export const planPeriod = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xs,
		},
	},
})

export const planFeatures = style({
	listStyle: 'none',
	marginBottom: vars.spacing.md,
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,

	'@media': {
		'(max-width: 768px)': {
			marginBottom: vars.spacing.sm,
			gap: vars.spacing['2xs'],
		},
	},
})

export const planFeature = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.tight,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xs,
			gap: vars.spacing['2xs'],
		},
	},
})

export const checkIcon = style({
	width: '16px',
	height: '16px',
	color: vars.color.success.main,
	flexShrink: 0,
	strokeWidth: 2.5,
	marginTop: '1px',

	'@media': {
		'(max-width: 768px)': {
			width: '14px',
			height: '14px',
		},
	},
})

export const planButton = style({
	marginTop: 'auto',
})

/**
 * CTA Section
 */
export const ctaSection = style({
	padding: `${vars.spacing['3xl']} 0`,
	backgroundColor: vars.color.neutral.offWhite,
	position: 'relative',
	overflow: 'hidden',

	'@media': {
		'(max-width: 768px)': {
			padding: `${vars.spacing['2xl']} 0`,
		},
	},
})

export const ctaCard = style({
	backgroundColor: vars.color.primary.dark,
	borderRadius: vars.borderRadius['2xl'],
	padding: `${vars.spacing['3xl']} ${vars.spacing['2xl']}`,
	position: 'relative',
	overflow: 'hidden',
	display: 'grid',
	gridTemplateColumns: '1fr auto',
	alignItems: 'center',
	gap: vars.spacing['2xl'],

	'@media': {
		'(max-width: 900px)': {
			gridTemplateColumns: '1fr',
			textAlign: 'center',
			padding: vars.spacing['2xl'],
		},
	},
})

export const ctaBackground = style({
	position: 'absolute',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundImage: `
		radial-gradient(circle at 0% 0%, rgba(230, 255, 75, 0.15) 0%, transparent 40%),
		radial-gradient(circle at 100% 100%, rgba(159, 182, 1, 0.1) 0%, transparent 40%)
	`,
	pointerEvents: 'none',
})

export const ctaDecoration = style({
	position: 'absolute',
	top: '-50px',
	right: '-50px',
	width: '200px',
	height: '200px',
	borderRadius: '50%',
	border: '2px solid rgba(230, 255, 75, 0.2)',
	pointerEvents: 'none',

	'@media': {
		'(max-width: 768px)': {
			display: 'none',
		},
	},
})

export const ctaDecorationInner = style({
	position: 'absolute',
	bottom: '-30px',
	left: '-30px',
	width: '120px',
	height: '120px',
	borderRadius: '50%',
	border: '2px solid rgba(230, 255, 75, 0.1)',
	pointerEvents: 'none',

	'@media': {
		'(max-width: 768px)': {
			display: 'none',
		},
	},
})

export const ctaContent = style({
	position: 'relative',
	zIndex: 1,
})

export const ctaLabel = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing['2xs']} ${vars.spacing.sm}`,
	backgroundColor: 'rgba(230, 255, 75, 0.15)',
	color: vars.color.primary.main,
	borderRadius: vars.borderRadius.full,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wide,
	marginBottom: vars.spacing.md,
	border: '1px solid rgba(230, 255, 75, 0.3)',
})

export const ctaTitle = style({
	fontSize: vars.fontSize['2xl'],
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.neutral.white,
	marginBottom: vars.spacing.sm,
	lineHeight: vars.lineHeight.tight,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.xl,
		},
	},
})

export const ctaDescription = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.neutral.offWhite,
	opacity: 0.85,
	lineHeight: vars.lineHeight.relaxed,
	maxWidth: '500px',

	'@media': {
		'(max-width: 900px)': {
			maxWidth: 'none',
			marginLeft: 'auto',
			marginRight: 'auto',
		},
		'(max-width: 768px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const ctaActions = style({
	position: 'relative',
	zIndex: 1,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
	alignItems: 'center',

	'@media': {
		'(max-width: 900px)': {
			flexDirection: 'row',
			justifyContent: 'center',
			flexWrap: 'wrap',
		},
	},
})

export const ctaButton = style({
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.sm,

	selectors: {
		'&:hover': {
			backgroundColor: `${vars.color.secondary.main} !important`,
			borderColor: `${vars.color.secondary.main} !important`,
			color: `${vars.color.primary.dark} !important`,
		},
	},
})

export const ctaSecondaryLink = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.neutral.offWhite,
	textDecoration: 'none',
	opacity: 0.8,
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.spacing.xs,

	selectors: {
		'&:hover': {
			color: vars.color.primary.main,
			opacity: 1,
		},
	},
})

/**
 * Footer
 */
export const footer = style({
	backgroundColor: vars.color.primary.dark,
	color: vars.color.neutral.offWhite,
	padding: `${vars.spacing['3xl']} 0 ${vars.spacing.xl}`,

	'@media': {
		'(max-width: 768px)': {
			padding: `${vars.spacing['2xl']} 0 ${vars.spacing.lg}`,
		},
	},
})

export const footerContent = style({
	display: 'grid',
	gridTemplateColumns: '2fr 1fr 1fr 1fr',
	gap: vars.spacing['2xl'],
	marginBottom: vars.spacing['2xl'],
	paddingBottom: vars.spacing['2xl'],
	borderBottom: '1px solid rgba(255, 255, 255, 0.1)',

	'@media': {
		'(max-width: 768px)': {
			gridTemplateColumns: '1fr',
			gap: vars.spacing.xl,
			marginBottom: vars.spacing.xl,
			paddingBottom: vars.spacing.xl,
		},
	},
})

export const footerBrand = style({
	maxWidth: '300px',

	'@media': {
		'(max-width: 768px)': {
			maxWidth: 'none',
		},
	},
})

export const footerLogo = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.main,
	marginBottom: vars.spacing.md,
})

export const footerTagline = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.neutral.offWhite,
	opacity: 0.8,
	lineHeight: vars.lineHeight.relaxed,

	'@media': {
		'(max-width: 768px)': {
			fontSize: vars.fontSize.sm,
		},
	},
})

export const footerLinks = style({
	display: 'contents',

	'@media': {
		'(max-width: 768px)': {
			display: 'grid',
			gridTemplateColumns: 'repeat(2, 1fr)',
			gap: vars.spacing.lg,
		},
	},
})

export const footerColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const footerColumnTitle = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.main,
	marginBottom: vars.spacing.sm,
	textTransform: 'uppercase',
	letterSpacing: vars.letterSpacing.wide,
})

export const footerLink = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.neutral.offWhite,
	textDecoration: 'none',
	opacity: 0.8,
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
	width: 'fit-content',

	selectors: {
		'&:hover': {
			color: vars.color.primary.main,
			opacity: 1,
			transform: 'translateX(4px)',
		},
	},
})

export const footerBottom = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',

	'@media': {
		'(max-width: 768px)': {
			flexDirection: 'column',
			gap: vars.spacing.md,
			textAlign: 'center',
		},
	},
})

export const copyright = style({
	fontSize: vars.fontSize.sm,
	fontFamily: vars.fontFamily.body,
	color: vars.color.neutral.offWhite,
	opacity: 0.6,
})

export const errorContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '300px',
	gap: vars.spacing.lg,
	padding: vars.spacing.xl,
	textAlign: 'center',
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	border: `1px solid ${vars.color.error.light}`,
	gridColumn: '1 / -1',
})

export const errorTitle = style({
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.error.main,
})

export const errorText = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	maxWidth: '500px',
	lineHeight: vars.lineHeight.relaxed,
})

/**
 * Scroll to Top Button
 */
export const scrollToTop = style({
	position: 'fixed',
	bottom: vars.spacing.xl,
	right: vars.spacing.xl,
	width: '48px',
	height: '48px',
	borderRadius: vars.borderRadius.full,
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
	border: 'none',
	cursor: 'pointer',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	boxShadow: vars.shadow.lg,
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
	zIndex: vars.zIndex.fixed,
	opacity: 0,
	visibility: 'hidden',
	transform: 'translateY(20px)',

	selectors: {
		'&:hover': {
			transform: 'translateY(-4px)',
			boxShadow: vars.shadow.xl,
		},
	},

	'@media': {
		'(max-width: 768px)': {
			bottom: vars.spacing.lg,
			right: vars.spacing.lg,
			width: '40px',
			height: '40px',
		},
	},
})

export const scrollToTopVisible = style({
	opacity: 1,
	visibility: 'visible',
	transform: 'translateY(0)',
})

/**
 * FAQ Section
 */
export const faqSection = style({
	padding: `${vars.spacing['4xl']} 0`,
	backgroundColor: vars.color.bg.primary,

	'@media': {
		'(max-width: 768px)': {
			padding: `${vars.spacing['2xl']} 0`,
		},
	},
})

export const faqGrid = style({
	maxWidth: '760px',
	margin: '0 auto',
})

export const faqItem = style({
	backgroundColor: vars.color.neutral.offWhite,
	borderRadius: vars.borderRadius.lg,
	overflow: 'hidden',
	border: `1px solid ${vars.color.neutral.grayLight}`,
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
	cursor: 'pointer',
	width: '100%',
	textAlign: 'left',

	selectors: {
		'&:hover': {
			borderColor: vars.color.primary.main,
			boxShadow: vars.shadow.sm,
		},
	},
})

export const faqQuestion = style({
	padding: vars.spacing.lg,
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: vars.spacing.md,

	'@media': {
		'(max-width: 768px)': {
			padding: vars.spacing.md,
			fontSize: vars.fontSize.sm,
		},
	},
})

export const faqAnswer = style({
	padding: `0 ${vars.spacing.lg} ${vars.spacing.lg}`,
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.relaxed,

	'@media': {
		'(max-width: 768px)': {
			padding: `0 ${vars.spacing.md} ${vars.spacing.md}`,
			fontSize: vars.fontSize.sm,
		},
	},
})
