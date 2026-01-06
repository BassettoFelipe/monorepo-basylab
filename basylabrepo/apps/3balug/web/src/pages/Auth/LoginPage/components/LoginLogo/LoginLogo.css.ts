import { style } from "@vanilla-extract/css";
import { vars } from "@/design-system/theme.css";

export const logo = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.spacing.sm,
  marginBottom: vars.spacing.xl,
  padding: vars.spacing.sm,
  backgroundColor: "transparent",
  borderRadius: vars.borderRadius.md,
  width: "fit-content",

  "@media": {
    "(max-width: 480px)": {
      marginBottom: vars.spacing.md,
    },
  },
});
