import { forwardRef, type SelectHTMLAttributes } from "react";
import * as styles from "./Select.css";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
  loading?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      placeholder,
      loading = false,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s/g, "-")}`;

    const wrapperClasses = [styles.selectWrapper, fullWidth && styles.fullWidth]
      .filter(Boolean)
      .join(" ");

    const selectClasses = [styles.select, error && styles.selectError, className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          aria-invalid={!!error}
          disabled={loading || props.disabled}
          {...props}
        >
          {loading ? (
            <option value="" disabled>
              Carregando...
            </option>
          ) : (
            <>
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
        {error && (
          <span className={styles.errorMessage} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
      </div>
    );
  },
);

Select.displayName = "Select";
