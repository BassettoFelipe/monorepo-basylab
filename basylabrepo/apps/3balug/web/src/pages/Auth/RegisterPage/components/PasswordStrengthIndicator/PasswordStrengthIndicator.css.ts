import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

/**
 * Password Strength Indicator
 */
export const passwordStrength = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  minHeight: "16px",
  transition: `opacity ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
});

export const passwordStrengthBars = style({
  display: "flex",
  gap: "2px",
  flex: 1,
});

export const passwordStrengthBar = style({
  height: "3px",
  flex: 1,
  borderRadius: "2px",
  backgroundColor: vars.color.neutral.grayLight,
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
});

export const passwordStrengthBarWeak = style({
  backgroundColor: vars.color.error.main,
  boxShadow: `0 0 4px ${vars.color.error.main}40`,
});

export const passwordStrengthBarMedium = style({
  backgroundColor: "#f59e0b",
  boxShadow: "0 0 4px rgba(245, 158, 11, 0.4)",
});

export const passwordStrengthBarStrong = style({
  backgroundColor: vars.color.success.main,
  boxShadow: `0 0 4px ${vars.color.success.main}40`,
});

export const passwordStrengthLabel = style({
  fontSize: "10px",
  fontFamily: vars.fontFamily.body,
  fontWeight: vars.fontWeight.medium,
  whiteSpace: "nowrap",
  letterSpacing: "0.3px",
  textTransform: "uppercase",
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
});

export const passwordStrengthLabelWeak = style({
  color: vars.color.error.main,
});

export const passwordStrengthLabelMedium = style({
  color: "#f59e0b",
});

export const passwordStrengthLabelStrong = style({
  color: vars.color.success.main,
});
