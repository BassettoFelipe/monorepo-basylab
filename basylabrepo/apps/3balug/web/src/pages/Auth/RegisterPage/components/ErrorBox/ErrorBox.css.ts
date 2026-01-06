import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

/**
 * Error Box
 */
export const registerError = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  padding: vars.spacing.sm,
  backgroundColor: vars.color.error.light,
  border: `1px solid ${vars.color.error.main}`,
  borderRadius: vars.borderRadius.md,
  color: vars.color.error.dark,
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
});

export const errorIcon = style({
  width: "16px",
  height: "16px",
  flexShrink: 0,
  color: vars.color.error.main,
});
