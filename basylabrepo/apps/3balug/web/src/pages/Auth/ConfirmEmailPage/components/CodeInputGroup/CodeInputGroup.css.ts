import { style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

export const codeInputContainer = style({
  display: "flex",
  gap: vars.spacing.sm,
  justifyContent: "center",
  position: "relative",
  cursor: "text",
  border: "none",
  padding: 0,
  margin: 0,

  "@media": {
    [mediaQuery.md]: {
      gap: vars.spacing.xs,
    },
  },
});

export const codeInput = style({
  width: "60px",
  height: "72px",
  fontSize: vars.fontSize["3xl"],
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  textAlign: "center",
  border: `2px solid ${vars.color.neutral.grayLight}`,
  borderRadius: vars.borderRadius.lg,
  color: vars.color.primary.dark,
  backgroundColor: vars.color.bg.primary,
  transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,
  outline: "none",

  selectors: {
    "&:focus": {
      borderColor: vars.color.primary.main,
      boxShadow: "0 0 0 4px rgba(230, 255, 75, 0.15)",
      transform: "scale(1.05)",
    },
    "&:disabled": {
      backgroundColor: vars.color.neutral.offWhite,
      cursor: "not-allowed",
      opacity: 0.6,
    },
  },

  "@media": {
    [mediaQuery.md]: {
      width: "52px",
      height: "64px",
      fontSize: vars.fontSize["2xl"],
    },
    "(max-width: 480px)": {
      width: "48px",
      height: "56px",
      fontSize: vars.fontSize.xl,
    },
  },
});
