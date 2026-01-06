import { keyframes, style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

const float = keyframes({
  "0%, 100%": { transform: "translateY(0) scale(1)" },
  "50%": { transform: "translateY(-20px) scale(1.05)" },
});

const floatReverse = keyframes({
  "0%, 100%": { transform: "translateY(0) scale(1)" },
  "50%": { transform: "translateY(20px) scale(0.95)" },
});

export const brandSection = style({
  display: "none",
  position: "relative",
  background: "linear-gradient(135deg, #3a4400 0%, #6b7a00 100%)",
  overflow: "hidden",

  "@media": {
    [mediaQuery.lg]: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  },
});

export const brandContent = style({
  position: "relative",
  zIndex: vars.zIndex.base,
  padding: vars.spacing["3xl"],
  color: vars.color.neutral.white,
  textAlign: "center",
  maxWidth: "480px",
});

export const brandLogo = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "80px",
  height: "80px",
  margin: "0 auto",
  marginBottom: vars.spacing.xl,
  borderRadius: vars.borderRadius.xl,
  backgroundColor: "rgba(0, 0, 0, 0.2)",
  boxShadow: vars.shadow.primaryLarge,
});

export const brandTitle = style({
  fontSize: vars.fontSize["3xl"],
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  marginBottom: vars.spacing.md,
  lineHeight: vars.lineHeight.tight,
  color: vars.color.neutral.white,
});

export const brandSubtitle = style({
  fontSize: vars.fontSize.lg,
  fontFamily: vars.fontFamily.body,
  opacity: vars.opacity[90],
  lineHeight: vars.lineHeight.relaxed,
  marginBottom: vars.spacing["2xl"],
});

export const decorCircle1 = style({
  position: "absolute",
  width: "320px",
  height: "320px",
  borderRadius: vars.borderRadius.full,
  background: `rgba(230, 255, 75, ${vars.opacity[10]})`,
  top: "-120px",
  right: "-120px",
  animation: `${float} 8s ease-in-out infinite`,
  zIndex: 0,
});

export const decorCircle2 = style({
  position: "absolute",
  width: "220px",
  height: "220px",
  borderRadius: vars.borderRadius.full,
  background: `rgba(230, 255, 75, ${vars.opacity[5]})`,
  bottom: "-60px",
  left: "-60px",
  animation: `${floatReverse} 10s ease-in-out infinite`,
  zIndex: 0,
});

export const decorCircle3 = style({
  position: "absolute",
  width: "160px",
  height: "160px",
  borderRadius: vars.borderRadius.full,
  background: `rgba(230, 255, 75, ${vars.opacity[10]})`,
  top: "50%",
  left: "10%",
  animation: `${float} 12s ease-in-out infinite`,
  zIndex: 0,
});
