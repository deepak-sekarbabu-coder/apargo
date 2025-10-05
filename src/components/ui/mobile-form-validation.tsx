'use client';

import { AlertCircle, CheckCircle, Eye, EyeOff, Info } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo } from '@/hooks/use-mobile';

// Validation rule types
interface ValidationRule<FormShape extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  test: (value: string, formData?: FormShape) => boolean;
  message: string;
  level?: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
  score?: number; // For password strength etc.
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    id: 'required',
    test: value => value.trim().length > 0,
    message,
    level: 'error',
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    id: 'minLength',
    test: value => value.length >= min,
    message: message || `Must be at least ${min} characters long`,
    level: 'error',
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    id: 'maxLength',
    test: value => value.length <= max,
    message: message || `Must be no more than ${max} characters long`,
    level: 'error',
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    id: 'email',
    test: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
    level: 'error',
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    id: 'phone',
    test: value => /^\+?[\d\s-()]+$/.test(value.replace(/\s/g, '')),
    message,
    level: 'error',
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    id: 'url',
    test: value => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
    level: 'error',
  }),

  number: (message = 'Please enter a valid number'): ValidationRule => ({
    id: 'number',
    test: value => !isNaN(Number(value)) && value.trim() !== '',
    message,
    level: 'error',
  }),

  passwordStrength: (message = 'Password should be stronger'): ValidationRule => ({
    id: 'passwordStrength',
    test: value => {
      const score = calculatePasswordStrength(value);
      return score >= 3;
    },
    message,
    level: 'warning',
  }),

  confirmPassword: (
    passwordField: string,
    message = 'Passwords do not match'
  ): ValidationRule<{ [k: string]: unknown }> => ({
    id: 'confirmPassword',
    test: (value, formData) => value === formData?.[passwordField],
    message,
    level: 'error',
  }),
};

// Password strength calculator
function calculatePasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

// Custom hook for form validation
export function useFormValidation<
  FormShape extends Record<string, unknown> = Record<string, unknown>,
>() {
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [warnings, setWarnings] = React.useState<Record<string, string[]>>({});
  const [infos, setInfos] = React.useState<Record<string, string[]>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validate = React.useCallback(
    (
      fieldName: string,
      value: string,
      rules: ValidationRule<FormShape>[],
      formData?: FormShape
    ): ValidationResult => {
      const fieldErrors: string[] = [];
      const fieldWarnings: string[] = [];
      const fieldInfos: string[] = [];

      rules.forEach(rule => {
        if (!rule.test(value, formData)) {
          switch (rule.level) {
            case 'error':
              fieldErrors.push(rule.message);
              break;
            case 'warning':
              fieldWarnings.push(rule.message);
              break;
            case 'info':
              fieldInfos.push(rule.message);
              break;
            default:
              fieldErrors.push(rule.message);
          }
        }
      });

      // Update state
      setErrors(prev => ({ ...prev, [fieldName]: fieldErrors }));
      setWarnings(prev => ({ ...prev, [fieldName]: fieldWarnings }));
      setInfos(prev => ({ ...prev, [fieldName]: fieldInfos }));

      return {
        isValid: fieldErrors.length === 0,
        errors: fieldErrors,
        warnings: fieldWarnings,
        infos: fieldInfos,
        score: fieldName.includes('password') ? calculatePasswordStrength(value) : undefined,
      };
    },
    []
  );

  const validateField = React.useCallback(
    (
      fieldName: string,
      value: string,
      rules: ValidationRule<FormShape>[],
      formData?: FormShape
    ) => {
      setTouched(prev => ({ ...prev, [fieldName]: true }));
      return validate(fieldName, value, rules, formData);
    },
    [validate]
  );

  const clearFieldErrors = React.useCallback((fieldName: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: [] }));
    setWarnings(prev => ({ ...prev, [fieldName]: [] }));
    setInfos(prev => ({ ...prev, [fieldName]: [] }));
  }, []);

  const isFieldValid = React.useCallback(
    (fieldName: string) => {
      return !errors[fieldName] || errors[fieldName].length === 0;
    },
    [errors]
  );

  return {
    errors,
    warnings,
    infos,
    touched,
    validate: validateField,
    clearFieldErrors,
    isFieldValid,
    hasErrors: Object.values(errors).some(fieldErrors => fieldErrors.length > 0),
    hasWarnings: Object.values(warnings).some(fieldWarnings => fieldWarnings.length > 0),
  };
}

// Live announcements for accessibility
function useLiveAnnouncements() {
  const announceRef = React.useRef<HTMLDivElement>(null);

  const announce = React.useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (announceRef.current) {
        announceRef.current.setAttribute('aria-live', priority);
        announceRef.current.textContent = message;

        // Clear after announcement
        setTimeout(() => {
          if (announceRef.current) {
            announceRef.current.textContent = '';
          }
        }, 1000);
      }
    },
    []
  );

  const LiveRegion = React.useCallback(
    () => <div ref={announceRef} className="sr-only" aria-live="polite" aria-atomic="true" />,
    []
  );

  return { announce, LiveRegion };
}

// Enhanced form field component
interface MobileFormFieldProps<
  FormShape extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rules?: ValidationRule<FormShape>[];
  placeholder?: string;
  helpText?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showPasswordToggle?: boolean;
  validateOnChange?: boolean;
  formData?: FormShape;
}

export const MobileFormField = React.forwardRef<HTMLInputElement, MobileFormFieldProps>(
  (
    {
      name,
      label,
      type = 'text',
      value,
      onChange,
      onBlur,
      rules = [],
      placeholder,
      helpText,
      autoComplete,
      inputMode,
      required = false,
      disabled = false,
      className,
      showPasswordToggle = false,
      validateOnChange = false,
      formData,
      ...props
    },
    ref
  ) => {
    const { isMobile, isTouchDevice } = useDeviceInfo();
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const { validate, errors, warnings, infos, touched, isFieldValid } = useFormValidation();
    const { announce, LiveRegion } = useLiveAnnouncements();

    const fieldId = `field-${name}`;
    const errorId = `${fieldId}-error`;
    const helpId = `${fieldId}-help`;
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Validation on change
    React.useEffect(() => {
      if (validateOnChange && value && touched[name]) {
        const result = validate(name, value, rules, formData);

        // Announce validation results
        if (result.errors.length > 0) {
          announce(`Error in ${label}: ${result.errors[0]}`, 'assertive');
        } else if (result.warnings.length > 0) {
          announce(`Warning for ${label}: ${result.warnings[0]}`, 'polite');
        }
      }
    }, [value, validate, name, rules, formData, touched, label, announce, validateOnChange]);

    const handleBlur = () => {
      setIsFocused(false);
      validate(name, value, rules, formData);
      onBlur?.();
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (validateOnChange) {
        validate(name, newValue, rules, formData);
      }
    };

    const hasError = touched[name] && errors[name]?.length > 0;
    const hasWarning = touched[name] && warnings[name]?.length > 0;
    const hasInfo = infos[name]?.length > 0;

    // Password strength indicator
    const passwordStrength = type === 'password' ? calculatePasswordStrength(value) : 0;
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthColors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-emerald-500',
    ];

    return (
      <div className={cn('space-y-2', className)}>
        <LiveRegion />

        {/* Label */}
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-medium',
            hasError ? 'text-destructive' : 'text-foreground',
            required && 'after:content-["*"] after:ml-0.5 after:text-destructive'
          )}
        >
          {label}
        </label>

        {/* Input container */}
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            name={name}
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoComplete={autoComplete}
            inputMode={inputMode}
            disabled={disabled}
            required={required}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              // Mobile optimizations
              (isMobile || isTouchDevice) && 'min-h-[44px] text-base',
              // Validation states
              hasError && 'border-destructive focus-visible:ring-destructive',
              hasWarning && !hasError && 'border-yellow-500 focus-visible:ring-yellow-500',
              !hasError &&
                !hasWarning &&
                touched[name] &&
                isFieldValid(name) &&
                'border-green-500 focus-visible:ring-green-500',
              // Focus state
              isFocused && 'ring-2 ring-ring ring-offset-2',
              // Password field with toggle
              showPasswordToggle && 'pr-10'
            )}
            style={{
              fontSize: isMobile || isTouchDevice ? '16px' : undefined, // Prevent zoom on iOS
              touchAction: 'manipulation',
            }}
            aria-invalid={hasError}
            aria-describedby={cn(hasError && errorId, helpText && helpId)}
            {...props}
          />

          {/* Password toggle */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded touch-manipulation"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}

          {/* Validation icons */}
          {!showPasswordToggle && touched[name] && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError && <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />}
              {!hasError && hasWarning && (
                <Info className="h-4 w-4 text-yellow-500" aria-hidden="true" />
              )}
              {!hasError && !hasWarning && isFieldValid(name) && (
                <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        {/* Password strength indicator */}
        {type === 'password' && value && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full bg-muted transition-colors',
                    i < passwordStrength && strengthColors[Math.min(passwordStrength - 1, 5)]
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Password strength: {strengthLabels[Math.min(passwordStrength, 5)]}
            </p>
          </div>
        )}

        {/* Help text */}
        {helpText && !hasError && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}

        {/* Error messages */}
        {hasError && (
          <div id={errorId} className="space-y-1">
            {errors[name]?.map((error, index) => (
              <p key={index} className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Warning messages */}
        {hasWarning && !hasError && (
          <div className="space-y-1">
            {warnings[name]?.map((warning, index) => (
              <p key={index} className="text-sm text-yellow-600 flex items-center gap-1">
                <Info className="h-3 w-3 flex-shrink-0" />
                {warning}
              </p>
            ))}
          </div>
        )}

        {/* Info messages */}
        {hasInfo && !hasError && !hasWarning && (
          <div className="space-y-1">
            {infos[name]?.map((info, index) => (
              <p key={index} className="text-sm text-blue-600 flex items-center gap-1">
                <Info className="h-3 w-3 flex-shrink-0" />
                {info}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
);
MobileFormField.displayName = 'MobileFormField';

// Form validation summary component
interface MobileFormSummaryProps {
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  className?: string;
}

export const MobileFormSummary = React.forwardRef<HTMLDivElement, MobileFormSummaryProps>(
  ({ errors, warnings, className }, ref) => {
    const { announce } = useLiveAnnouncements();
    const errorCount = Object.values(errors).reduce(
      (count, fieldErrors) => count + fieldErrors.length,
      0
    );
    const warningCount = Object.values(warnings).reduce(
      (count, fieldWarnings) => count + fieldWarnings.length,
      0
    );

    React.useEffect(() => {
      if (errorCount > 0) {
        announce(`Form has ${errorCount} error${errorCount !== 1 ? 's' : ''}`, 'assertive');
      }
    }, [errorCount, announce]);

    if (errorCount === 0 && warningCount === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md border p-4 space-y-3',
          errorCount > 0 ? 'border-destructive bg-destructive/5' : 'border-yellow-500 bg-yellow-50',
          className
        )}
        role="alert"
        aria-labelledby="form-summary-title"
      >
        <div className="flex items-center gap-2">
          {errorCount > 0 ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Info className="h-5 w-5 text-yellow-600" />
          )}
          <h3
            id="form-summary-title"
            className={cn('font-medium', errorCount > 0 ? 'text-destructive' : 'text-yellow-800')}
          >
            {errorCount > 0
              ? `Please fix ${errorCount} error${errorCount !== 1 ? 's' : ''}`
              : `${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
          </h3>
        </div>

        {errorCount > 0 && (
          <ul className="space-y-1 text-sm text-destructive">
            {Object.entries(errors).map(([field, fieldErrors]) =>
              fieldErrors.map((error, index) => (
                <li key={`${field}-${index}`} className="list-disc list-inside">
                  {error}
                </li>
              ))
            )}
          </ul>
        )}

        {warningCount > 0 && errorCount === 0 && (
          <ul className="space-y-1 text-sm text-yellow-800">
            {Object.entries(warnings).map(([field, fieldWarnings]) =>
              fieldWarnings.map((warning, index) => (
                <li key={`${field}-${index}`} className="list-disc list-inside">
                  {warning}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    );
  }
);
MobileFormSummary.displayName = 'MobileFormSummary';
