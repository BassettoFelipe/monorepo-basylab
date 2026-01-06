import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

/**
 * Plan Card
 */
export const planCard = style({
  padding: vars.spacing.lg,
  background: vars.color.bg.primary,
  border: `1px solid ${vars.color.neutral.grayLight}`,
  borderRadius: vars.borderRadius.xl,
  boxShadow: vars.shadow.sm,
  transition: `all ${vars.transitionDuration.base} ${vars.transitionTiming.easeInOut}`,
  selectors: {
    "&:hover": {
      boxShadow: vars.shadow.lg,
      transform: "translateY(-2px)",
      borderColor: vars.color.primary.main,
    },
  },
});

export const planCardHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  marginBottom: vars.spacing.sm,
});

export const planCardIcon = style({
  width: "32px",
  height: "32px",
  borderRadius: vars.borderRadius.md,
  backgroundColor: vars.color.primary.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: vars.color.primary.dark,
  boxShadow: vars.shadow.primary,
});

export const planCardIconSvg = style({
  width: "16px",
  height: "16px",
});

export const planCardTitleWrapper = style({
  flex: 1,
  minWidth: 0,
});

export const planCardTitle = style({
  fontSize: vars.fontSize.base,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
});

export const planCardSubtitle = style({
  fontSize: "10px",
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.tertiary,
  textTransform: "uppercase",
  letterSpacing: vars.letterSpacing.wide,
});

export const planCardPrice = style({
  display: "flex",
  alignItems: "baseline",
  gap: "2px",
  flexShrink: 0,
});

export const planCardPriceAmount = style({
  fontSize: vars.fontSize.xl,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.secondary.main,
});

export const planCardPricePeriod = style({
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.tertiary,
});

export const planCardDivider = style({
  height: "1px",
  backgroundColor: vars.color.neutral.grayLight,
  marginBottom: vars.spacing.sm,
});

export const planCardFeatures = style({
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export const planCardFeature = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
});

export const planCardFeatureIcon = style({
  width: "14px",
  height: "14px",
  flexShrink: 0,
  color: vars.color.success.main,
});
