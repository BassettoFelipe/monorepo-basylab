import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const container = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  cursor: "pointer",
});

export const switchButton = style({
  position: "relative",
  display: "inline-block",
  backgroundColor: "#D1D5DB",
  border: "none",
  borderRadius: "9999px",
  cursor: "pointer",
  transition: `background-color ${vars.transitionDuration.base}`,
  padding: 0,
  ":focus": {
    outline: "none",
  },
});

export const sm = style({
  width: "36px",
  height: "20px",
});

export const md = style({
  width: "44px",
  height: "24px",
});

export const checked = style({
  backgroundColor: vars.color.success.main,
});

export const disabled = style({
  opacity: 0.5,
  cursor: "not-allowed",
});

export const slider = style({
  position: "absolute",
  top: "2px",
  left: "2px",
  backgroundColor: "white",
  borderRadius: "50%",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  transition: `transform ${vars.transitionDuration.base}`,
  selectors: {
    [`${sm} &`]: {
      width: "16px",
      height: "16px",
    },
    [`${md} &`]: {
      width: "20px",
      height: "20px",
    },
    [`${sm}${checked} &`]: {
      transform: "translateX(16px)",
    },
    [`${md}${checked} &`]: {
      transform: "translateX(20px)",
    },
  },
});

export const label = style({
  fontSize: vars.fontSize.sm,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  userSelect: "none",
});
