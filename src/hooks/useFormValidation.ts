import { useState, useCallback, useEffect } from "react";
import {
  FieldValidationResult,
  ValidationResult,
} from "@/utils/clientValidation";

export interface FormField {
  value: unknown;
  error?: string;
  warning?: string;
  touched: boolean;
  isValidating: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface ValidationRule {
  validator: (
    value: unknown,
    formData?: Record<string, unknown>
  ) => FieldValidationResult;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormValidationConfig {
  [fieldName: string]: ValidationRule;
}

export interface UseFormValidationReturn {
  formState: FormState;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  touchedFields: string[];
  setValue: (fieldName: string, value: unknown) => void;
  setError: (fieldName: string, error: string) => void;
  setWarning: (fieldName: string, warning: string) => void;
  clearError: (fieldName: string) => void;
  clearWarning: (fieldName: string) => void;
  clearAllErrors: () => void;
  clearAllWarnings: () => void;
  touchField: (fieldName: string) => void;
  touchAllFields: () => void;
  validateField: (fieldName: string) => Promise<FieldValidationResult>;
  validateForm: () => Promise<ValidationResult>;
  resetForm: (initialValues?: Record<string, unknown>) => void;
  getFieldProps: (fieldName: string) => {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    error?: string;
    warning?: string;
    touched: boolean;
    isValidating: boolean;
  };
}

export const useFormValidation = (
  initialValues: Record<string, unknown> = {},
  validationConfig: FormValidationConfig = {}
): UseFormValidationReturn => {
  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach((key) => {
      state[key] = {
        value: initialValues[key],
        touched: false,
        isValidating: false,
      };
    });
    return state;
  });

  // Debounce timers
  const [debounceTimers, setDebounceTimers] = useState<
    Record<string, NodeJS.Timeout>
  >({});

  // Clear debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [debounceTimers]);

  // Computed values
  const errors = Object.keys(formState).reduce((acc, key) => {
    if (formState[key].error) {
      acc[key] = formState[key].error!;
    }
    return acc;
  }, {} as Record<string, string>);

  const warnings = Object.keys(formState).reduce((acc, key) => {
    if (formState[key].warning) {
      acc[key] = formState[key].warning!;
    }
    return acc;
  }, {} as Record<string, string>);

  const isValid = Object.keys(formState).every((key) => !formState[key].error);
  const isValidating = Object.keys(formState).some(
    (key) => formState[key].isValidating
  );
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;
  const touchedFields = Object.keys(formState).filter(
    (key) => formState[key].touched
  );

  // Set field value
  const setValue = useCallback((fieldName: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: undefined,
        warning: undefined,
      },
    }));

    // Validation will be handled by a separate effect
  }, []);

  // Set field error
  const setError = useCallback((fieldName: string, error: string) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
      },
    }));
  }, []);

  // Set field warning
  const setWarning = useCallback((fieldName: string, warning: string) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        warning,
      },
    }));
  }, []);

  // Clear field error
  const clearError = useCallback((fieldName: string) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error: undefined,
      },
    }));
  }, []);

  // Clear field warning
  const clearWarning = useCallback((fieldName: string) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        warning: undefined,
      },
    }));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setFormState((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = { ...newState[key], error: undefined };
      });
      return newState;
    });
  }, []);

  // Clear all warnings
  const clearAllWarnings = useCallback(() => {
    setFormState((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = { ...newState[key], warning: undefined };
      });
      return newState;
    });
  }, []);

  // Touch field
  const touchField = useCallback((fieldName: string) => {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true,
      },
    }));

    // Validation will be handled by a separate effect
  }, []);

  // Touch all fields
  const touchAllFields = useCallback(() => {
    setFormState((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = { ...newState[key], touched: true };
      });
      return newState;
    });
  }, []);

  // Validate field immediately
  const validateFieldImmediate = useCallback(
    (fieldName: string, value?: unknown) => {
      const config = validationConfig[fieldName];
      if (!config) return { isValid: true };

      const fieldValue =
        value !== undefined ? value : formState[fieldName]?.value;
      const formData = Object.keys(formState).reduce((acc, key) => {
        acc[key] = formState[key].value;
        return acc;
      }, {} as Record<string, unknown>);

      const result = config.validator(fieldValue, formData);

      setFormState((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error: result.error,
          warning: result.warning,
          isValidating: false,
        },
      }));

      return result;
    },
    [validationConfig, formState]
  );

  // Note: Debounced validation removed for simplicity
  // Can be re-implemented when needed

  // Validate field (async)
  const validateField = useCallback(
    async (fieldName: string): Promise<FieldValidationResult> => {
      return new Promise((resolve) => {
        const result = validateFieldImmediate(fieldName);
        resolve(result);
      });
    },
    [validateFieldImmediate]
  );

  // Validate entire form
  const validateForm = useCallback(async (): Promise<ValidationResult> => {
    const results: FieldValidationResult[] = [];
    const fieldNames = Object.keys(validationConfig);

    // Validate all fields
    for (const fieldName of fieldNames) {
      const result = await validateField(fieldName);
      results.push(result);
    }

    // Collect errors and warnings
    const formErrors: string[] = [];
    const formWarnings: string[] = [];

    results.forEach((result, index) => {
      if (result.error) {
        formErrors.push(`${fieldNames[index]}: ${result.error}`);
      }
      if (result.warning) {
        formWarnings.push(`${fieldNames[index]}: ${result.warning}`);
      }
    });

    return {
      isValid: formErrors.length === 0,
      errors: formErrors,
      warnings: formWarnings.length > 0 ? formWarnings : undefined,
    };
  }, [validationConfig, validateField]);

  // Reset form
  const resetForm = useCallback(
    (newInitialValues?: Record<string, unknown>) => {
      const values = newInitialValues || initialValues;
      const newState: FormState = {};

      Object.keys(values).forEach((key) => {
        newState[key] = {
          value: values[key],
          touched: false,
          isValidating: false,
        };
      });

      setFormState(newState);

      // Clear debounce timers
      Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
      setDebounceTimers({});
    },
    [initialValues, debounceTimers]
  );

  // Get field props for easy integration with form components
  const getFieldProps = useCallback(
    (fieldName: string) => {
      const field = formState[fieldName] || {
        value: "",
        touched: false,
        isValidating: false,
      };

      return {
        value: field.value,
        onChange: (value: unknown) => setValue(fieldName, value),
        onBlur: () => touchField(fieldName),
        error: field.error,
        warning: field.warning,
        touched: field.touched,
        isValidating: field.isValidating,
      };
    },
    [formState, setValue, touchField]
  );

  return {
    formState,
    errors,
    warnings,
    isValid,
    isValidating,
    hasErrors,
    hasWarnings,
    touchedFields,
    setValue,
    setError,
    setWarning,
    clearError,
    clearWarning,
    clearAllErrors,
    clearAllWarnings,
    touchField,
    touchAllFields,
    validateField,
    validateForm,
    resetForm,
    getFieldProps,
  };
};
