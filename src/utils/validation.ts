// Input validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (email.length > 254) {
    errors.push('Email is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: email.trim().toLowerCase()
  };
};

// Phone number validation
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone) {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }
  
  if (cleaned.length > 15) {
    errors.push('Phone number is too long');
  }
  
  // Check for valid patterns
  const validPatterns = [
    /^91\d{10}$/, // Indian format with country code
    /^\d{10}$/,   // 10 digit number
    /^0\d{9}$/    // Starting with 0
  ];
  
  const isValidFormat = validPatterns.some(pattern => pattern.test(cleaned));
  if (!isValidFormat) {
    errors.push('Please enter a valid phone number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: cleaned
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password is too long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: password
  };
};

// Name validation
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  }
  
  if (trimmed.length > 50) {
    errors.push(`${fieldName} is too long`);
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed
  };
};

// File validation
export const validateFile = (
  file: File | null, 
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): ValidationResult => {
  const errors: string[] = [];
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], required = true } = options; // Default 10MB
  
  if (!file) {
    if (required) {
      errors.push('File is required');
    }
    return { isValid: !required, errors };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: file
  };
};

// CSV file validation
export const validateCSVFile = (file: File | null): ValidationResult => {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('CSV file is required');
    return { isValid: false, errors };
  }
  
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.csv')) {
    errors.push('File must be a CSV file');
  }
  
  // Check MIME type
  if (!file.type.includes('csv') && !file.type.includes('text/csv')) {
    errors.push('File must be a valid CSV file');
  }
  
  // Check file size (max 5MB for CSV)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('CSV file must be less than 5MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: file
  };
};

// PDF file validation
export const validatePDFFile = (file: File | null): ValidationResult => {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('PDF file is required');
    return { isValid: false, errors };
  }
  
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.push('File must be a PDF file');
  }
  
  // Check MIME type
  if (file.type !== 'application/pdf') {
    errors.push('File must be a valid PDF file');
  }
  
  // Check file size (max 10MB for PDF)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('PDF file must be less than 10MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: file
  };
};

// Department code validation
export const validateDepartmentCode = (code: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!code) {
    errors.push('Department code is required');
    return { isValid: false, errors };
  }
  
  const trimmed = code.trim();
  
  if (trimmed.length < 2) {
    errors.push('Department code must be at least 2 characters long');
  }
  
  if (trimmed.length > 10) {
    errors.push('Department code is too long');
  }
  
  // Check for valid characters (letters, numbers, underscores, hyphens)
  const codeRegex = /^[a-zA-Z0-9_-]+$/;
  if (!codeRegex.test(trimmed)) {
    errors.push('Department code can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed.toUpperCase()
  };
};

// Text input sanitization
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

// HTML sanitization (basic)
export const sanitizeHTML = (html: string): string => {
  if (!html) return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};

// URL validation
export const validateURL = (url: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!url) {
    errors.push('URL is required');
    return { isValid: false, errors };
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check for allowed protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }
    
    // Check URL length
    if (url.length > 2048) {
      errors.push('URL is too long');
    }
    
  } catch {
    errors.push('Please enter a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: url.trim()
  };
};

// Form validation helper
export const validateForm = (validations: ValidationResult[]): ValidationResult => {
  const allErrors: string[] = [];
  let isValid = true;
  
  validations.forEach(validation => {
    if (!validation.isValid) {
      isValid = false;
      allErrors.push(...validation.errors);
    }
  });
  
  return {
    isValid,
    errors: allErrors
  };
};

// Input length validation
export const validateLength = (
  value: string, 
  min: number, 
  max: number, 
  fieldName: string = 'Field'
): ValidationResult => {
  const errors: string[] = [];
  
  if (!value) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }
  
  const trimmed = value.trim();
  
  if (trimmed.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters long`);
  }
  
  if (trimmed.length > max) {
    errors.push(`${fieldName} must be no more than ${max} characters long`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed
  };
};

