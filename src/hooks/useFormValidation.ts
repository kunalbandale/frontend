import { useState, useCallback } from 'react';
import { ValidationResult, validateForm } from '../utils/validation';

export interface FormField {
  value: any;
  error: string;
  touched: boolean;
  isValid: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

export interface UseFormValidationOptions {
  initialValues: Record<string, any>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const useFormValidation = (options: UseFormValidationOptions) => {
  const { initialValues, validateOnChange = true, validateOnBlur = true } = options;
  
  // Initialize form state
  const [formState, setFormState] = useState<FormState>(() => {
    const state: FormState = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key],
        error: '',
        touched: false,
        isValid: true
      };
    });
    return state;
  });

  // Update field value
  const setValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: '',
        isValid: true
      }
    }));
  }, []);

  // Set field error
  const setError = useCallback((fieldName: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
        isValid: false
      }
    }));
  }, []);

  // Mark field as touched
  const setTouched = useCallback((fieldName: string, touched: boolean = true) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched
      }
    }));
  }, []);

  // Validate single field
  const validateField = useCallback((fieldName: string, validationResult: ValidationResult) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error: validationResult.isValid ? '' : validationResult.errors[0] || 'Invalid value',
        isValid: validationResult.isValid,
        value: validationResult.sanitizedValue ?? prev[fieldName].value
      }
    }));
  }, []);

  // Validate all fields
  const validateAll = useCallback((validations: Record<string, ValidationResult>) => {
    const validationResults = Object.values(validations);
    const formValidation = validateForm(validationResults);
    
    // Update form state with validation results
    Object.keys(validations).forEach(fieldName => {
      const validation = validations[fieldName];
      setFormState(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error: validation.isValid ? '' : validation.errors[0] || 'Invalid value',
          isValid: validation.isValid,
          value: validation.sanitizedValue ?? prev[fieldName].value
        }
      }));
    });
    
    return formValidation;
  }, []);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return Object.values(formState).every(field => field.isValid);
  }, [formState]);

  // Get form values
  const getValues = useCallback(() => {
    const values: Record<string, any> = {};
    Object.keys(formState).forEach(key => {
      values[key] = formState[key].value;
    });
    return values;
  }, [formState]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState(prev => {
      const newState: FormState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = {
          value: initialValues[key] || '',
          error: '',
          touched: false,
          isValid: true
        };
      });
      return newState;
    });
  }, [initialValues]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setFormState(prev => {
      const newState: FormState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = {
          ...prev[key],
          error: '',
          isValid: true
        };
      });
      return newState;
    });
  }, []);

  // Get field props for input components
  const getFieldProps = useCallback((fieldName: string) => {
    const field = formState[fieldName];
    return {
      value: field?.value || '',
      error: field?.error || '',
      touched: field?.touched || false,
      isValid: field?.isValid || true,
      onChange: (value: any) => {
        setValue(fieldName, value);
        if (validateOnChange) {
          // This would be called by the parent component with validation
        }
      },
      onBlur: () => {
        setTouched(fieldName);
        if (validateOnBlur) {
          // This would be called by the parent component with validation
        }
      }
    };
  }, [formState, setValue, setTouched, validateOnChange, validateOnBlur]);

  // Get all errors
  const getAllErrors = useCallback(() => {
    const errors: string[] = [];
    Object.values(formState).forEach(field => {
      if (field.error) {
        errors.push(field.error);
      }
    });
    return errors;
  }, [formState]);

  // Check if any field is touched
  const isAnyFieldTouched = useCallback(() => {
    return Object.values(formState).some(field => field.touched);
  }, [formState]);

  return {
    formState,
    setValue,
    setError,
    setTouched,
    validateField,
    validateAll,
    isFormValid,
    getValues,
    resetForm,
    clearErrors,
    getFieldProps,
    getAllErrors,
    isAnyFieldTouched
  };
};

