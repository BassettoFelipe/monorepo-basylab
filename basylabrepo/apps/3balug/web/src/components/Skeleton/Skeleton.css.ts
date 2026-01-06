import { keyframes, style, styleVariants } from '@vanilla-extract/css'
import { vars } from '@/design-system/theme.css'

const shimmer = keyframes({
	'0%': {
		backgroundPosition: '-468px 0',
	},
	'100%': {
		backgroundPosition: '468px 0',
	},
})

export const skeleton = style({
	backgroundColor: vars.color.neutral.grayLight,
	backgroundImage: `linear-gradient(90deg, ${vars.color.neutral.grayLight} 0px, ${vars.color.neutral.offWhite} 40px, ${vars.color.neutral.grayLight} 80px)`,
	backgroundSize: '468px 100%',
	backgroundRepeat: 'no-repeat',
	display: 'inline-block',
	animation: `${shimmer} 1.2s ease-in-out infinite`,
})

export const variants = styleVariants({
	rectangular: {
		borderRadius: vars.borderRadius.sm,
	},
	rounded: {
		borderRadius: vars.borderRadius.md,
	},
	circular: {
		borderRadius: vars.borderRadius.full,
	},
})
