import { createGlobalTheme } from "@vanilla-extract/css";
import { colors } from "./colors";
import {
  borderRadius,
  breakpoints,
  opacity,
  shadow,
  spacing,
  transitionDuration,
  transitionTiming,
  zIndex,
} from "./tokens";
import { fontFamily, fontSize, fontWeight, letterSpacing, lineHeight } from "./typography";

export const vars = createGlobalTheme(":root", {
  color: {
    primary: {
      main: colors.primary.main,
      dark: colors.primary.dark,
    },

    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      accent: colors.secondary.accent,
    },

    neutral: {
      white: colors.neutral.white,
      black: colors.neutral.black,
      offWhite: colors.neutral.offWhite,
      grayLight: colors.neutral.grayLight,
      grayDark: colors.neutral.grayDark,
    },

    success: {
      main: colors.semantic.success.main,
      light: colors.semantic.success.light,
      dark: colors.semantic.success.dark,
    },

    warning: {
      main: colors.semantic.warning.main,
      light: colors.semantic.warning.light,
      dark: colors.semantic.warning.dark,
    },

    error: {
      main: colors.semantic.error.main,
      light: colors.semantic.error.light,
      dark: colors.semantic.error.dark,
    },

    info: {
      main: colors.semantic.info.main,
      light: colors.semantic.info.light,
      dark: colors.semantic.info.dark,
    },

    text: {
      primary: colors.primary.dark,
      secondary: colors.neutral.grayDark,
      tertiary: colors.secondary.light,
      disabled: colors.neutral.grayLight,
      inverse: colors.neutral.white,
      onPrimary: colors.primary.dark,
    },

    bg: {
      primary: colors.neutral.white,
      secondary: colors.neutral.offWhite,
      tertiary: colors.secondary.main,
      dark: colors.primary.dark,
      black: colors.neutral.black,
      inverse: colors.primary.main,
    },

    border: {
      primary: colors.neutral.grayLight,
      secondary: colors.secondary.light,
      focus: colors.primary.main,
      error: colors.semantic.error.main,
    },
  },

  fontFamily: {
    heading: fontFamily.heading,
    body: fontFamily.body,
    mono: fontFamily.mono,
  },

  fontWeight: {
    regular: fontWeight.regular.toString(),
    medium: fontWeight.medium.toString(),
    bold: fontWeight.bold.toString(),
  },

  fontSize: {
    xs: fontSize.xs,
    sm: fontSize.sm,
    base: fontSize.base,
    lg: fontSize.lg,
    xl: fontSize.xl,
    "2xl": fontSize["2xl"],
    "3xl": fontSize["3xl"],
    "4xl": fontSize["4xl"],
    "5xl": fontSize["5xl"],
    "6xl": fontSize["6xl"],
  },

  lineHeight: {
    none: lineHeight.none,
    tight: lineHeight.tight,
    normal: lineHeight.normal,
    relaxed: lineHeight.relaxed,
    loose: lineHeight.loose,
  },

  letterSpacing: {
    tighter: letterSpacing.tighter,
    tight: letterSpacing.tight,
    normal: letterSpacing.normal,
    wide: letterSpacing.wide,
    wider: letterSpacing.wider,
    widest: letterSpacing.widest,
  },

  spacing: {
    none: spacing.none,
    "2xs": spacing["2xs"],
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    "2xl": spacing["2xl"],
    "3xl": spacing["3xl"],
    "4xl": spacing["4xl"],
    "5xl": spacing["5xl"],
    "6xl": spacing["6xl"],
  },

  borderRadius: {
    none: borderRadius.none,
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    xl: borderRadius.xl,
    "2xl": borderRadius["2xl"],
    "3xl": borderRadius["3xl"],
    full: borderRadius.full,
  },

  shadow: {
    none: shadow.none,
    xs: shadow.xs,
    sm: shadow.sm,
    md: shadow.md,
    lg: shadow.lg,
    xl: shadow.xl,
    "2xl": shadow["2xl"],
    inner: shadow.inner,
    primary: shadow.primary,
    primaryLarge: shadow.primaryLarge,
  },

  transitionDuration: {
    fast: transitionDuration.fast,
    base: transitionDuration.base,
    slow: transitionDuration.slow,
    slower: transitionDuration.slower,
  },

  transitionTiming: {
    linear: transitionTiming.linear,
    easeIn: transitionTiming.easeIn,
    easeOut: transitionTiming.easeOut,
    easeInOut: transitionTiming.easeInOut,
    snappy: transitionTiming.snappy,
    smooth: transitionTiming.smooth,
    bounce: transitionTiming.bounce,
  },

  zIndex: {
    base: zIndex.base.toString(),
    dropdown: zIndex.dropdown.toString(),
    sticky: zIndex.sticky.toString(),
    fixed: zIndex.fixed.toString(),
    modalBackdrop: zIndex.modalBackdrop.toString(),
    modal: zIndex.modal.toString(),
    popover: zIndex.popover.toString(),
    tooltip: zIndex.tooltip.toString(),
  },

  opacity: {
    0: opacity[0],
    5: opacity[5],
    10: opacity[10],
    20: opacity[20],
    25: opacity[25],
    30: opacity[30],
    40: opacity[40],
    50: opacity[50],
    60: opacity[60],
    70: opacity[70],
    75: opacity[75],
    80: opacity[80],
    90: opacity[90],
    95: opacity[95],
    100: opacity[100],
  },
});

export { breakpoints };

export const mediaQuery = {
  sm: `screen and (min-width: ${breakpoints.sm})`,
  md: `screen and (min-width: ${breakpoints.md})`,
  lg: `screen and (min-width: ${breakpoints.lg})`,
  xl: `screen and (min-width: ${breakpoints.xl})`,
  "2xl": `screen and (min-width: ${breakpoints["2xl"]})`,
} as const;
