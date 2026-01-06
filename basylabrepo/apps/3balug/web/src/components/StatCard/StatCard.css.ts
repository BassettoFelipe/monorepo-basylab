import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const statCard = style({
  backgroundColor: "#FFFFFF",
  borderRadius: vars.borderRadius.lg,
  padding: vars.spacing.xl,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
  border: "1px solid #F5F5F4",
  transition: `all ${vars.transitionDuration.fast} ${vars.transitionTiming.easeInOut}`,

  ":hover": {
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
    transform: "translateY(-2px)",
    borderColor: "#E7E5E4",
  },

  "@media": {
    "(max-width: 640px)": {
      padding: vars.spacing.lg,
    },
  },
});

export const statCardHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: vars.spacing.lg,

  "@media": {
    "(max-width: 640px)": {
      marginBottom: vars.spacing.md,
    },
  },
});

export const statCardTitle = style({
  fontSize: vars.fontSize.xs,
  color: "#78716C",
  fontWeight: vars.fontWeight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  flex: 1,

  "@media": {
    "(max-width: 640px)": {
      fontSize: "0.7rem",
      letterSpacing: "0.5px",
    },
  },
});

export const statCardIcon = style({
  width: "48px",
  height: "48px",
  borderRadius: vars.borderRadius.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,

  "@media": {
    "(max-width: 640px)": {
      width: "40px",
      height: "40px",
    },
  },
});

export const statCardIconColor = styleVariants({
  primary: {
    backgroundColor: "#F7FCE8",
    color: "#5E6C02",
  },
  success: {
    backgroundColor: "#D1FAE5",
    color: "#047857",
  },
  warning: {
    backgroundColor: "#FEF3C7",
    color: "#B45309",
  },
  error: {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
  },
  info: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
  },
});

export const statCardBody = style({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: vars.spacing.sm,
});

export const statCardValue = style({
  fontSize: vars.fontSize["3xl"],
  fontWeight: vars.fontWeight.bold,
  color: "#1C1917",
  lineHeight: 1,
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",

  "@media": {
    "(max-width: 640px)": {
      fontSize: vars.fontSize["2xl"],
    },
  },
});

export const trend = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.bold,
  padding: "4px 8px",
  borderRadius: vars.borderRadius.sm,
  flexShrink: 0,

  "@media": {
    "(max-width: 640px)": {
      fontSize: vars.fontSize.xs,
      padding: "3px 6px",
      gap: "2px",
    },
  },
});

export const trendPositive = style({
  color: "#047857",
  backgroundColor: "#D1FAE5",
});

export const trendNegative = style({
  color: "#B91C1C",
  backgroundColor: "#FEE2E2",
});

export const statCardIconSvg = style({
  width: "24px",
  height: "24px",

  "@media": {
    "(max-width: 640px)": {
      width: "20px",
      height: "20px",
    },
  },
});
