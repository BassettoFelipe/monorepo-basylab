import { forwardRef, type InputHTMLAttributes, type ReactNode, useCallback, useState } from "react";
import { applyMask, getRawValue, type MaskType } from "@/utils/masks";
import * as styles from "./Input.css";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightIconButton?: boolean;
  onRightIconClick?: () => void;
  mask?: MaskType;
  uppercase?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>, rawValue?: string) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = "",
      id,
      leftIcon,
      rightIcon,
      rightIconButton = false,
      onRightIconClick,
      mask,
      uppercase = false,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState("");
    const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, "-")}`;

    const wrapperClasses = [styles.inputWrapper, fullWidth && styles.fullWidth]
      .filter(Boolean)
      .join(" ");

    const inputClasses = [
      styles.input,
      error && styles.inputError,
      leftIcon && styles.inputWithLeftIcon,
      rightIcon && styles.inputWithRightIcon,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;
        let rawValue = newValue;

        if (uppercase) {
          newValue = newValue.toUpperCase();
        }

        if (mask) {
          const masked = applyMask(newValue, mask);
          rawValue = getRawValue(masked);
          newValue = masked;

          e.target.value = newValue;
          setInternalValue(newValue);
        } else if (uppercase) {
          e.target.value = newValue;
          setInternalValue(newValue);
        }

        if (onChange) {
          onChange(e, mask ? rawValue : undefined);
        }
      },
      [mask, uppercase, onChange],
    );

    const handleRightIconClick = useCallback(() => {
      if (rightIconButton && onRightIconClick) {
        onRightIconClick();
      }
    }, [rightIconButton, onRightIconClick]);

    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {props.required && (
              <abbr className={styles.required} title="obrigatório">
                *
              </abbr>
            )}
          </label>
        )}
        <div className={styles.inputContainer}>
          {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperTextId : undefined}
            value={mask ? internalValue : props.value}
            onChange={handleChange}
            {...props}
          />
          {rightIcon &&
            (rightIconButton ? (
              <button
                type="button"
                className={styles.rightIconButton}
                onClick={handleRightIconClick}
                aria-label="Toggle"
              >
                {rightIcon}
              </button>
            ) : (
              <span className={styles.rightIcon} aria-hidden="true">
                {rightIcon}
              </span>
            ))}
        </div>
        {error && (
          <span id={errorId} className={styles.errorMessage} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperTextId} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
