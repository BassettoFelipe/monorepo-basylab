/**
 * Input Component Styles - 3Balug Brand
 *
 * Componente de input seguindo a identidade visual da marca.
 * Suporta labels, ícones, estados de erro e helpers.
 */

import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

/**
 * Input Wrapper
 */
export const inputWrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  boxSizing: "border-box",
});

export const fullWidth = style({
  width: "100%",
  boxSizing: "border-box",
});

/**
 * Label
 */
export const label = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  fontFamily: vars.fontFamily.body,
});

export const required = style({
  color: vars.color.error.main,
  marginLeft: "2px",
});

/**
 * Input Container (para posicionar ícones)
 */
export const inputContainer = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  minHeight: "44px",
});

/**
 * Input Base
 */
export const input = style({
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  border: `2px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.md,
  fontSize: vars.fontSize.base,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.primary,
  backgroundColor: vars.color.bg.primary,
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
  minHeight: "44px",
  width: "100%",
  boxSizing: "border-box",
  margin: 0,

  selectors: {
    "&::placeholder": {
      color: vars.color.text.tertiary,
      opacity: vars.opacity[60],
    },
    "&:hover:not(:disabled):not(:focus)": {
      borderColor: vars.color.secondary.light,
    },
    "&:focus": {
      outline: "none",
      borderColor: vars.color.secondary.main,
      boxShadow: "none",
    },
    "&:disabled": {
      backgroundColor: vars.color.bg.secondary,
      color: vars.color.text.disabled,
      cursor: "not-allowed",
      borderColor: vars.color.neutral.grayLight,
    },
  },
});

/**
 * Input with Icons
 */
export const inputWithLeftIcon = style({
  paddingLeft: "2.75rem",
});

export const inputWithRightIcon = style({
  paddingRight: "2.75rem",
});

/**
 * Icon Wrappers
 */
const iconWrapper = style({
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.color.text.tertiary,
  pointerEvents: "none",
  transition: `color ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
});

export const leftIcon = style([
  iconWrapper,
  {
    left: vars.spacing.md,
  },
]);

export const rightIcon = style([
  iconWrapper,
  {
    right: vars.spacing.md,
  },
]);

export const rightIconButton = style([
  iconWrapper,
  {
    right: vars.spacing.md,
    pointerEvents: "auto",
    cursor: "pointer",

    selectors: {
      "&:hover": {
        color: vars.color.primary.dark,
      },
      "&:focus-visible": {
        outline: "none",
      },
    },
  },
]);

/**
 * Error State
 */
export const inputError = style({
  borderColor: vars.color.border.error,
  boxShadow: "none",

  selectors: {
    "&:focus": {
      borderColor: vars.color.error.main,
      boxShadow: "none",
    },
    "&:hover:not(:disabled):not(:focus)": {
      borderColor: vars.color.error.main,
    },
  },
});

/**
 * Helper Texts
 */
export const errorMessage = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.error.main,
  fontFamily: vars.fontFamily.body,
  minHeight: "20px",
});

export const helperText = style({
  fontSize: vars.fontSize.sm,
  color: vars.color.text.secondary,
  fontFamily: vars.fontFamily.body,
  minHeight: "20px",
});
