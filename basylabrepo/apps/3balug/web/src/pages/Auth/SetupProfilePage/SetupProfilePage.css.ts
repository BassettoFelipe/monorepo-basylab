/**
 * SetupProfilePage Styles - 3Balug Brand
 * Minimalista e moderno com detalhes sutis
 */

import { style } from "@vanilla-extract/css";
import { mediaQuery, vars } from "@/design-system/theme.css";

/**
 * Page Layout - Fundo sutil
 */
export const page = style({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: vars.color.bg.secondary,
  padding: vars.spacing.md,

  "@media": {
    [mediaQuery.md]: {
      padding: vars.spacing.xl,
    },
  },
});

export const container = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "860px",
  margin: "0 auto",
  padding: vars.spacing.xl,
  backgroundColor: vars.color.bg.primary,
  borderRadius: vars.borderRadius.xl,
  boxShadow: vars.shadow.md,

  "@media": {
    [mediaQuery.md]: {
      padding: vars.spacing["2xl"],
    },
    [mediaQuery.lg]: {
      padding: vars.spacing["3xl"],
    },
  },
});

/**
 * Header minimalista
 */
export const header = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  marginBottom: vars.spacing.xl,

  "@media": {
    [mediaQuery.md]: {
      marginBottom: vars.spacing["2xl"],
    },
  },
});

export const logo = style({
  marginBottom: vars.spacing.lg,
});

export const title = style({
  fontSize: vars.fontSize["2xl"],
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.bold,
  color: vars.color.text.primary,
  margin: 0,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize["3xl"],
    },
  },
});

export const subtitle = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.primary,
  margin: 0,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize.base,
    },
  },
});

/**
 * Progress Section
 */
export const progressSection = style({
  marginBottom: vars.spacing.xl,
  padding: vars.spacing.lg,
  backgroundColor: vars.color.bg.secondary,
  borderRadius: vars.borderRadius.lg,

  "@media": {
    [mediaQuery.md]: {
      marginBottom: vars.spacing["2xl"],
    },
  },
});

/**
 * Form
 */
export const form = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xl,

  "@media": {
    [mediaQuery.md]: {
      gap: vars.spacing["2xl"],
    },
  },
});

export const formSection = style({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: vars.spacing.md,

  "@media": {
    "(min-width: 640px)": {
      gridTemplateColumns: "1fr 1fr",
    },
  },
});

/**
 * Actions
 */
export const actions = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  marginTop: vars.spacing.xl,
  paddingTop: vars.spacing.xl,
  borderTop: `1px solid ${vars.color.border.primary}`,

  "@media": {
    [mediaQuery.sm]: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  },
});

export const unsavedIndicator = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.spacing.xs,
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
  color: vars.color.success.dark,
  backgroundColor: vars.color.success.light,
  borderRadius: vars.borderRadius.full,

  "@media": {
    [mediaQuery.sm]: {
      marginRight: "auto",
    },
  },
});

/**
 * Field Styles
 */
export const fieldWrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
});

export const fieldLabel = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
});

export const fieldHelpText = style({
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.primary,
});

export const fieldError = style({
  fontSize: vars.fontSize.xs,
  fontFamily: vars.fontFamily.body,
  color: vars.color.error.main,
});

export const textarea = style({
  width: "100%",
  padding: vars.spacing.md,
  borderRadius: vars.borderRadius.md,
  border: `1px solid ${vars.color.border.primary}`,
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  minHeight: "100px",
  resize: "vertical",
  transition: `border-color ${vars.transitionDuration.base}`,
  backgroundColor: "#ffffff",
  color: vars.color.text.primary,
  outline: "none",

  ":focus": {
    borderColor: vars.color.primary.main,
  },

  "::placeholder": {
    color: vars.color.text.secondary,
  },
});

export const textareaError = style({
  borderColor: vars.color.error.main,
});

export const checkboxWrapper = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  cursor: "pointer",
  padding: vars.spacing.sm,
});

export const checkboxGroupOptions = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.xs,
  padding: vars.spacing.sm,
  border: `1px solid ${vars.color.border.primary}`,
  borderRadius: vars.borderRadius.md,
  backgroundColor: vars.color.bg.primary,
  transition: `border-color ${vars.transitionDuration.base}`,
});

export const checkboxGroupOptionsError = style({
  borderColor: vars.color.error.main,
});

export const checkboxWrapperError = style({
  padding: vars.spacing.sm,
  border: `1px solid ${vars.color.error.main}`,
  borderRadius: vars.borderRadius.md,
  backgroundColor: vars.color.bg.primary,
});

export const checkboxInput = style({
  width: "18px",
  height: "18px",
  cursor: "pointer",
  accentColor: vars.color.primary.main,
});

export const checkboxLabel = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.primary,
});

export const fullWidthField = style({
  gridColumn: "1 / -1",
});

/**
 * Estado de Mensagem (Erro / Sucesso / Vazio)
 */
export const stateContainer = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: vars.spacing["2xl"],
  gap: vars.spacing.lg,
});

export const stateIconWrapper = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "80px",
  height: "80px",
  borderRadius: vars.borderRadius.full,
  marginBottom: vars.spacing.sm,
});

export const stateIconError = style({
  backgroundColor: vars.color.error.light,
  color: vars.color.error.main,
});

export const stateIconSuccess = style({
  backgroundColor: vars.color.success.light,
  color: vars.color.success.main,
});

export const stateTitle = style({
  fontSize: vars.fontSize.xl,
  fontFamily: vars.fontFamily.heading,
  fontWeight: vars.fontWeight.medium,
  color: vars.color.text.primary,
  margin: 0,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize["2xl"],
    },
  },
});

export const stateDescription = style({
  fontSize: vars.fontSize.sm,
  fontFamily: vars.fontFamily.body,
  color: vars.color.text.secondary,
  margin: 0,
  maxWidth: "360px",
  lineHeight: 1.6,

  "@media": {
    [mediaQuery.md]: {
      fontSize: vars.fontSize.base,
    },
  },
});

export const stateActions = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.spacing.sm,
  marginTop: vars.spacing.md,
  width: "100%",
  maxWidth: "280px",

  "@media": {
    [mediaQuery.sm]: {
      flexDirection: "row",
      maxWidth: "none",
      width: "auto",
    },
  },
});

// Não utilizados
export const brandSection = style({ display: "none" });
export const brandContent = style({});
export const brandLogo = style({});
export const brandTitle = style({});
export const brandSubtitle = style({});
export const features = style({});
export const featureItem = style({});
export const featureIcon = style({});
export const decorCircle1 = style({});
export const decorCircle2 = style({});
export const decorCircle3 = style({});
export const emptyState = style({});
export const emptyStateText = style({});
