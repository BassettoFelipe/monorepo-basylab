import { keyframes, style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

const pulse = keyframes({
  "0%, 100%": { opacity: "1", transform: "scale(1)" },
  "50%": { opacity: "0.8", transform: "scale(0.98)" },
});

export const errorMessage = style({
  padding: vars.spacing.md,
  backgroundColor: vars.color.error.light,
  border: `1px solid ${vars.color.error.main}`,
  borderRadius: vars.borderRadius.lg,
  color: vars.color.error.dark,
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  animation: `${pulse} 2s ease-in-out`,

  "@media": {
    [mediaQuery.md]: {
      padding: vars.spacing.sm,
      fontSize: vars.fontSize.xs,
    },
  },
});
