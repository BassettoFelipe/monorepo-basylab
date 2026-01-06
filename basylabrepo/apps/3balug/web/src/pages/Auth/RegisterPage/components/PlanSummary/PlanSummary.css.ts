import { keyframes, style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

/**
 * Animações
 */
const float = keyframes({
  "0%, 100%": { transform: "translateY(0) scale(1)" },
  "50%": { transform: "translateY(-10px) scale(1.02)" },
});

const floatReverse = keyframes({
  "0%, 100%": { transform: "translateY(0) scale(1)" },
  "50%": { transform: "translateY(10px) scale(0.98)" },
});

/**
 * Right Column - Summary Section
 */
export const registerRightColumn = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: vars.spacing.lg,
  background: `linear-gradient(135deg, ${vars.color.neutral.offWhite} 0%, rgba(230, 255, 75, 0.05) 100%)`,
  borderTop: `1px solid ${vars.color.neutral.grayLight}`,
  gap: vars.spacing.lg,
  position: "relative",
  overflow: "hidden",

  "@media": {
    [mediaQuery.lg]: {
      borderTop: "none",
      justifyContent: "center",
      padding: vars.spacing.xl,
    },
  },
});

export const sidebarHeader = style({});

export const sidebarTitle = style({
  fontSize: vars.fontSize.xl,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.primary.dark,
  marginBottom: "4px",
  letterSpacing: vars.letterSpacing.tight,
});

export const sidebarSubtitle = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  fontWeight: vars.fontWeight.medium,
});

/**
 * Plan Placeholder
 */
export const planPlaceholder = style({
  padding: vars.spacing.xl,
  background: vars.color.bg.primary,
  border: `2px dashed ${vars.color.neutral.grayLight}`,
  borderRadius: vars.borderRadius.xl,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: vars.spacing.sm,
  minHeight: "180px",
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
  selectors: {
    "&:hover": {
      borderColor: vars.color.secondary.main,
      backgroundColor: "rgba(230, 255, 75, 0.03)",
    },
  },
});

export const planPlaceholderIcon = style({
  width: "36px",
  height: "36px",
  color: vars.color.neutral.grayDark,
});

export const planPlaceholderTitle = style({
  fontSize: vars.fontSize.base,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.secondary,
});

export const planPlaceholderText = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.tertiary,
  maxWidth: "200px",
});

/**
 * Benefits Section
 */
export const benefitsSection = style({
  padding: vars.spacing.lg,
  background: `linear-gradient(135deg, ${vars.color.primary.dark} 0%, #434d00 100%)`,
  borderRadius: vars.borderRadius.xl,
  boxShadow: vars.shadow.primaryLarge,
  border: "none",
  position: "relative",
  overflow: "hidden",
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,

  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: "-50px",
      right: "-50px",
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      background: "rgba(230, 255, 75, 0.1)",
      animation: `${float} 8s ease-in-out infinite`,
    },
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: "-30px",
      left: "-30px",
      width: "100px",
      height: "100px",
      borderRadius: "50%",
      background: "rgba(230, 255, 75, 0.08)",
      animation: `${floatReverse} 10s ease-in-out infinite`,
    },
    "&:hover": {
      boxShadow: "0 12px 32px rgba(67, 77, 0, 0.35)",
      transform: "translateY(-2px)",
    },
  },
});

export const benefitsTitle = style({
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.neutral.white,
  marginBottom: vars.spacing.sm,
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wider,
  opacity: vars.opacity[80],
  position: "relative",
  zIndex: 1,
});

export const benefitsList = style({
  listStyle: "none",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.spacing.sm,
  position: "relative",
  zIndex: 1,
});

export const benefitItem = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.neutral.white,
  padding: vars.spacing.sm,
  backgroundColor: "rgba(230, 255, 75, 0.15)",
  borderRadius: vars.borderRadius.lg,
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(230, 255, 75, 0.2)",

  selectors: {
    "&:hover": {
      backgroundColor: "rgba(230, 255, 75, 0.25)",
      transform: "translateY(-1px)",
      boxShadow: vars.shadow.xs,
    },
  },
});

export const benefitIconWrapper = style({
  width: "28px",
  height: "28px",
  minWidth: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: vars.color.primary.main,
  borderRadius: vars.borderRadius.md,
  boxShadow: vars.shadow.xs,
});

export const benefitIcon = style({
  width: "14px",
  height: "14px",
  flexShrink: 0,
  color: vars.color.primary.dark,
});
