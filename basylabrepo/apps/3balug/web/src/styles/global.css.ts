import { globalStyle } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

globalStyle('*, *::before, *::after', {
	margin: 0,
	padding: 0,
	boxSizing: 'border-box',
})

globalStyle('html', {
	height: '100%',
	minHeight: '100%',
	fontSize: '16px',
	WebkitFontSmoothing: 'antialiased',
	MozOsxFontSmoothing: 'grayscale',
	textRendering: 'optimizeLegibility',
})

globalStyle('body', {
	fontFamily: vars.fontFamily.body,
	backgroundColor: vars.color.bg.primary,
	color: vars.color.text.primary,
	fontSize: vars.fontSize.base,
	fontWeight: vars.fontWeight.regular,
	lineHeight: vars.lineHeight.normal,
	height: '100%',
	minHeight: '100%',
	overflow: 'auto',
})

globalStyle('h1, h2, h3, h4, h5, h6', {
	fontFamily: vars.fontFamily.heading,
	fontWeight: vars.fontWeight.bold,
	color: vars.color.text.primary,
	lineHeight: vars.lineHeight.tight,
})

globalStyle('h1', {
	fontSize: vars.fontSize['5xl'],
	letterSpacing: vars.letterSpacing.tight,
})

globalStyle('h2', {
	fontSize: vars.fontSize['4xl'],
	letterSpacing: vars.letterSpacing.tight,
})

globalStyle('h3', {
	fontSize: vars.fontSize['3xl'],
	letterSpacing: vars.letterSpacing.normal,
})

globalStyle('h4', {
	fontSize: vars.fontSize['2xl'],
})

globalStyle('h5', {
	fontSize: vars.fontSize.xl,
	fontWeight: vars.fontWeight.medium,
})

globalStyle('h6', {
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.medium,
})

globalStyle('p', {
	marginBottom: vars.spacing.md,
})

globalStyle('p:last-child', {
	marginBottom: 0,
})

globalStyle('button', {
	fontFamily: 'inherit',
	border: 'none',
	background: 'none',
	cursor: 'pointer',
	transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
})

globalStyle('button:disabled', {
	cursor: 'not-allowed',
	opacity: vars.opacity[50],
})

globalStyle('input, textarea, select', {
	fontFamily: 'inherit',
	fontSize: 'inherit',
	lineHeight: 'inherit',
	color: 'inherit',
})

globalStyle('input::placeholder, textarea::placeholder', {
	color: vars.color.text.tertiary,
	opacity: vars.opacity[60],
})

globalStyle('a', {
	color: vars.color.primary.dark,
	textDecoration: 'none',
	transition: `color ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
})

globalStyle('a:hover', {
	color: vars.color.secondary.main,
})

globalStyle('a:focus-visible', {
	outline: 'none',
})

globalStyle('*:focus-visible', {
	outline: 'none',
})

globalStyle('*:focus', {
	outline: 'none',
})

globalStyle('ul, ol', {
	paddingLeft: vars.spacing.lg,
})

globalStyle('li', {
	marginBottom: vars.spacing.xs,
})

globalStyle('img, video, svg', {
	maxWidth: '100%',
	height: 'auto',
	display: 'block',
})

globalStyle('strong, b', {
	fontWeight: vars.fontWeight.bold,
})

globalStyle('em, i', {
	fontStyle: 'italic',
})

globalStyle('code, pre', {
	fontFamily: vars.fontFamily.mono,
	fontSize: vars.fontSize.sm,
})

globalStyle('code', {
	padding: `${vars.spacing['2xs']} ${vars.spacing.xs}`,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.sm,
})

globalStyle('pre', {
	padding: vars.spacing.md,
	backgroundColor: vars.color.bg.secondary,
	borderRadius: vars.borderRadius.md,
	overflow: 'auto',
})

globalStyle('pre code', {
	padding: 0,
	backgroundColor: 'transparent',
})

globalStyle('::-webkit-scrollbar', {
	width: '12px',
	height: '12px',
})

globalStyle('::-webkit-scrollbar-track', {
	backgroundColor: vars.color.bg.secondary,
})

globalStyle('::-webkit-scrollbar-thumb', {
	backgroundColor: vars.color.secondary.light,
	borderRadius: vars.borderRadius.full,
	border: `2px solid ${vars.color.bg.secondary}`,
})

globalStyle('::-webkit-scrollbar-thumb:hover', {
	backgroundColor: vars.color.secondary.main,
})

globalStyle('::selection', {
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
})

globalStyle('::-moz-selection', {
	backgroundColor: vars.color.primary.main,
	color: vars.color.primary.dark,
})

globalStyle('*', {
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			animationDuration: '0.01ms !important',
			animationIterationCount: '1 !important',
			transitionDuration: '0.01ms !important',
			scrollBehavior: 'auto',
		},
	},
})

globalStyle('#root', {
	height: '100%',
	minHeight: '100%',
})
