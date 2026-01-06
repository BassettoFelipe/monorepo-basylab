import * as styles from "./Logo.css";

export interface LogoProps {
  variant?: "primary" | "secondary" | "white";
  size?: "small" | "medium" | "large";
  className?: string;
}

// Cache-busting version - increment when logos change
const LOGO_VERSION = "v2";

const logoVariants = {
  primary: `/assets/images/logos/logo-primary.png?${LOGO_VERSION}`,
  secondary: `/assets/images/logos/logo-secondary.png?${LOGO_VERSION}`,
  white: `/assets/images/logos/logo-white.png?${LOGO_VERSION}`,
};

const sizeClassMap = {
  small: styles.logoSmall,
  medium: styles.logoMedium,
  large: styles.logoLarge,
};

export function Logo({ variant = "primary", size = "medium", className }: LogoProps) {
  const logoSrc = logoVariants[variant];
  const sizeClass = sizeClassMap[size];

  return (
    <img
      src={logoSrc}
      alt="3Balug"
      className={className ? `${sizeClass} ${className}` : sizeClass}
      loading="eager"
    />
  );
}
