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

export const checkoutHeaderWithLogout = style({
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'space-between',
	gap: vars.spacing.md,
	marginBottom: vars.spacing.sm,
})

export const checkoutIconWrapper = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	minWidth: '36px',
	borderRadius: vars.borderRadius.md,
	backgroundColor: vars.color.primary.main,
	boxShadow: vars.shadow.primary,
})

export const checkoutIcon = style({
	width: '18px',
	height: '18px',
	color: vars.color.primary.dark,
})

export const checkoutHeaderContent = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minWidth: 0,
})

export const checkoutHeaderTitle = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	lineHeight: vars.lineHeight.tight,
	letterSpacing: vars.letterSpacing.tight,
})

export const checkoutHeaderText = style({
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
	color: vars.color.text.secondary,
	marginTop: '1px',
})

export const checkoutForm = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.md,
})

export const checkoutError = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: vars.spacing.xs,
	backgroundColor: vars.color.error.light,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.md,
	color: vars.color.error.dark,
	fontSize: vars.fontSize.xs,
	fontFamily: vars.fontFamily.body,
})

export const errorIcon = style({
	width: '14px',
	height: '14px',
	flexShrink: 0,
	color: vars.color.error.main,
})

export const inputRow = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: vars.spacing.sm,
	border: 'none',
	padding: 0,
	margin: 0,
})

export const submitButton = style({
	marginTop: vars.spacing.xs,
	height: '42px',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
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

export const skeletonCard = style({
	marginBottom: vars.spacing.sm,
})

export const skeletonForm = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.sm,
})

export const skeletonInputRow = style({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: vars.spacing.xs,
})

export const skeletonPlanCard = style({
	padding: vars.spacing.lg,
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: vars.spacing.md,
})

export const skeletonFeatures = style({
	width: '100%',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
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

export const logoutButton = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.spacing.xs,
	padding: `${vars.spacing.xs} ${vars.spacing.md}`,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.error.dark,
	backgroundColor: vars.color.error.light,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.lg,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeOut}`,
	whiteSpace: 'nowrap',
	flexShrink: 0,

	':hover': {
		backgroundColor: vars.color.error.main,
		borderColor: vars.color.error.dark,
		color: vars.color.neutral.white,
	},

	':disabled': {
		opacity: '0.5',
		cursor: 'not-allowed',
	},
})

const modalSlideUp = keyframes({
	from: { opacity: 0, transform: 'translateY(20px) scale(0.98)' },
	to: { opacity: 1, transform: 'translateY(0) scale(1)' },
})

const overlayFadeIn = keyframes({
	from: { opacity: 0, backdropFilter: 'blur(0px)' },
	to: { opacity: 1, backdropFilter: 'blur(4px)' },
})

const checkmarkPop = keyframes({
	'0%': { transform: 'scale(0)', opacity: 0 },
	'50%': { transform: 'scale(1.2)' },
	'100%': { transform: 'scale(1)', opacity: 1 },
})

export const planChangeOverlay = style({
	position: 'fixed',
	inset: 0,
	height: '100%',
	backgroundColor: 'rgba(0, 0, 0, 0.6)',
	backdropFilter: 'blur(4px)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: vars.zIndex.modal,
	padding: vars.spacing.sm,
	animation: `${overlayFadeIn} 0.25s ease-out`,
	overflowY: 'auto',

	'@media': {
		[mediaQuery.md]: {
			padding: vars.spacing.lg,
		},
	},
})

export const planChangeModal = style({
	width: '100%',
	maxWidth: '1000px',
	maxHeight: 'calc(100% - 32px)',
	backgroundColor: vars.color.bg.primary,
	borderRadius: vars.borderRadius.xl,
	boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
	overflow: 'hidden',
	display: 'flex',
	flexDirection: 'column',
	animation: `${modalSlideUp} 0.35s cubic-bezier(0.16, 1, 0.3, 1)`,
	margin: 'auto',

	'@media': {
		[mediaQuery.md]: {
			maxHeight: '90%',
		},
	},
})

export const planChangeHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: `${vars.spacing.md} ${vars.spacing.lg}`,
	borderBottom: `1px solid ${vars.color.neutral.grayLight}`,
	background: `linear-gradient(to right, ${vars.color.bg.primary}, ${vars.color.bg.secondary})`,
})

export const planChangeTitle = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	margin: 0,

	'@media': {
		[mediaQuery.md]: {
			fontSize: vars.fontSize.xl,
		},
	},
})

export const planChangeCloseButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '36px',
	height: '36px',
	backgroundColor: vars.color.error.light,
	border: `1px solid ${vars.color.error.main}`,
	borderRadius: vars.borderRadius.full,
	color: vars.color.error.dark,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeOut}`,
	flexShrink: 0,

	':hover': {
		backgroundColor: vars.color.error.main,
		borderColor: vars.color.error.dark,
		color: vars.color.neutral.white,
	},
})

export const planChangeContent = style({
	padding: vars.spacing.md,
	overflowY: 'auto',
	flex: 1,

	'@media': {
		[mediaQuery.md]: {
			padding: vars.spacing.lg,
		},
	},
})

export const planChangeDescription = style({
	fontSize: vars.fontSize.lg,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.medium,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.lg,
	textAlign: 'center',
})

export const planGrid = style({
	display: 'grid',
	gridTemplateColumns: '1fr',
	gap: vars.spacing.md,

	'@media': {
		[mediaQuery.md]: {
			gridTemplateColumns: 'repeat(3, 1fr)',
			gap: vars.spacing.lg,
			alignItems: 'stretch',
		},
	},
})

export const planOption = style({
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.primary,
	border: `2px solid ${vars.color.neutral.grayLight}`,
	borderRadius: vars.borderRadius.xl,
	cursor: 'pointer',
	transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
	textAlign: 'left',
	outline: 'none',

	':hover': {
		borderColor: vars.color.secondary.main,
		boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12)',
		transform: 'translateY(-2px)',
	},

	':focus-visible': {
		borderColor: vars.color.primary.main,
		boxShadow: '0 0 0 3px rgba(230, 255, 75, 0.3)',
	},
})

export const planOptionSelected = style({
	borderColor: vars.color.primary.main,
	backgroundColor: 'rgba(230, 255, 75, 0.06)',
	boxShadow: `0 0 0 1px ${vars.color.primary.main}, 0 8px 24px -4px rgba(230, 255, 75, 0.2)`,
	transform: 'translateY(-2px)',

	':hover': {
		borderColor: vars.color.primary.main,
		boxShadow: `0 0 0 1px ${vars.color.primary.main}, 0 12px 32px -4px rgba(230, 255, 75, 0.25)`,
	},
})

export const planOptionCurrent = style({
	borderColor: vars.color.secondary.main,
	backgroundColor: 'rgba(159, 182, 1, 0.04)',
})

export const planOptionBadge = style({
	position: 'absolute',
	top: '-8px',
	right: vars.spacing.sm,
	padding: `${vars.spacing['2xs']} ${vars.spacing.sm}`,
	backgroundColor: vars.color.secondary.main,
	color: vars.color.neutral.white,
	fontSize: vars.fontSize.xs,
	fontWeight: vars.fontWeight.bold,
	borderRadius: vars.borderRadius.full,
	boxShadow: vars.shadow.md,
	textTransform: 'uppercase',
	letterSpacing: '0.5px',
})

export const planOptionSelectedBadge = style({
	position: 'absolute',
	top: '-10px',
	left: vars.spacing.sm,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '22px',
	height: '22px',
	backgroundColor: vars.color.primary.main,
	borderRadius: vars.borderRadius.full,
	animation: `${checkmarkPop} 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
	boxShadow: vars.shadow.md,
	zIndex: 1,
})

export const planOptionName = style({
	fontSize: vars.fontSize.base,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.xs,
	marginTop: vars.spacing.xs,
})

export const planOptionPrice = style({
	display: 'flex',
	alignItems: 'baseline',
	gap: vars.spacing['2xs'],
	fontSize: vars.fontSize.xl,
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	marginBottom: vars.spacing.sm,
	paddingBottom: vars.spacing.sm,
	borderBottom: `1px solid ${vars.color.neutral.grayLight}`,
})

export const planOptionPricePeriod = style({
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.regular,
	color: vars.color.text.secondary,
})

export const planOptionFeatures = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.spacing.xs,
	marginTop: vars.spacing.xs,
	flex: 1,
})

export const planOptionFeature = style({
	display: 'flex',
	alignItems: 'flex-start',
	gap: vars.spacing.xs,
	fontSize: vars.fontSize.xs,
	color: vars.color.text.secondary,
	lineHeight: vars.lineHeight.normal,
})

export const planOptionFeatureIcon = style({
	color: vars.color.success.main,
	flexShrink: 0,
	marginTop: '2px',
})

export const planChangeFooter = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'stretch',
	gap: vars.spacing.sm,
	padding: vars.spacing.md,
	borderTop: `1px solid ${vars.color.neutral.grayLight}`,
	backgroundColor: vars.color.bg.secondary,

	'@media': {
		[mediaQuery.sm]: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-end',
			padding: `${vars.spacing.md} ${vars.spacing.lg}`,
		},
	},
})

export const planChangeCancelButton = style({
	padding: `${vars.spacing.sm} ${vars.spacing.lg}`,
	backgroundColor: vars.color.bg.primary,
	border: `1px solid ${vars.color.neutral.grayLight}`,
	borderRadius: vars.borderRadius.lg,
	color: vars.color.text.secondary,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeOut}`,
	order: 2,

	':hover': {
		backgroundColor: vars.color.bg.secondary,
		borderColor: vars.color.text.secondary,
		color: vars.color.text.primary,
	},

	'@media': {
		[mediaQuery.sm]: {
			order: 1,
		},
	},
})

export const planChangeConfirmButton = style({
	padding: `${vars.spacing.sm} ${vars.spacing.xl}`,
	backgroundColor: vars.color.primary.main,
	border: `2px solid ${vars.color.primary.main}`,
	borderRadius: vars.borderRadius.md,
	color: vars.color.primary.dark,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
	order: 1,

	selectors: {
		'&:hover:not(:disabled)': {
			backgroundColor: vars.color.primary.dark,
			borderColor: vars.color.primary.dark,
			color: vars.color.primary.main,
			boxShadow: vars.shadow.md,
			transform: 'translateY(-1px)',
		},
		'&:active:not(:disabled)': {
			transform: 'translateY(0)',
			boxShadow: vars.shadow.sm,
		},
	},

	':disabled': {
		opacity: '0.5',
		cursor: 'not-allowed',
	},

	'@media': {
		[mediaQuery.sm]: {
			order: 2,
		},
	},
})

export const changePlanButton = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: vars.spacing.xs,
	width: '100%',
	padding: vars.spacing.sm,
	marginTop: vars.spacing.md,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.primary.dark,
	backgroundColor: vars.color.primary.main,
	border: `2px solid ${vars.color.primary.main}`,
	borderRadius: vars.borderRadius.md,
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

	':hover': {
		backgroundColor: vars.color.primary.dark,
		borderColor: vars.color.primary.dark,
		color: vars.color.primary.main,
		boxShadow: vars.shadow.md,
		transform: 'translateY(-1px)',
	},

	':active': {
		transform: 'translateY(0)',
		boxShadow: vars.shadow.sm,
	},
})

export const planOptionRadioInput = style({
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

export const planChangeBackdrop = style({
	position: 'absolute',
	inset: 0,
	width: '100%',
	height: '100%',
	backgroundColor: 'transparent',
	border: 'none',
	cursor: 'default',
	zIndex: -1,
})
