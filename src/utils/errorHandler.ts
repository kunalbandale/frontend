export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  requestId?: string;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: string;
  url?: string;
  method?: string;
}

export class AppError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;
  public requestId?: string;
  public context?: ErrorContext;

  constructor(message: string, status?: number, code?: string, details?: any, requestId?: string, context?: ErrorContext) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.context = context;
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred', context?: ErrorContext) {
    super(message, 0, 'NETWORK_ERROR', null, undefined, context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any, context?: ErrorContext) {
    super(message, 400, 'VALIDATION_ERROR', details, undefined, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, 401, 'AUTH_ERROR', null, undefined, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: ErrorContext) {
    super(message, 403, 'AUTHZ_ERROR', null, undefined, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: ErrorContext) {
    super(message, 404, 'NOT_FOUND', null, undefined, context);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Server error occurred', context?: ErrorContext) {
    super(message, 500, 'SERVER_ERROR', null, undefined, context);
    this.name = 'ServerError';
  }
}

export class WhatsAppAPIError extends AppError {
  constructor(message: string, details?: any, context?: ErrorContext) {
    super(message, 502, 'WHATSAPP_API_ERROR', details, undefined, context);
    this.name = 'WhatsAppAPIError';
  }
}

// Error handler for API responses
export const handleApiError = (error: any, context?: ErrorContext): AppError => {
  console.error('🚨 API Error:', error, context);

  // Network error (no response)
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return new NetworkError('Unable to connect to server. Please check your internet connection.', context);
    }
    return new NetworkError('Network error occurred', context);
  }

  const { status, data } = error.response;
  const requestId = error.response.headers['x-request-id'];

  // Handle different HTTP status codes
  switch (status) {
    case 400:
      return new ValidationError(
        data?.message || 'Invalid request data',
        data?.errors || data?.details,
        context
      );
    
    case 401:
      // Clear auth token if it exists
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return new AuthenticationError(
        data?.message || 'Authentication required',
        context
      );
    
    case 403:
      return new AuthorizationError(
        data?.message || 'Insufficient permissions',
        context
      );
    
    case 404:
      return new NotFoundError(
        data?.message || 'Resource not found',
        context
      );
    
    case 422:
      return new ValidationError(
        data?.message || 'Validation failed',
        data?.errors || data?.details,
        context
      );
    
    case 429:
      return new AppError(
        'Too many requests. Please try again later.',
        429,
        'RATE_LIMIT',
        data?.details,
        requestId,
        context
      );
    
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(
        data?.message || 'Server error occurred',
        context
      );
    
    default:
      return new AppError(
        data?.message || 'An unexpected error occurred',
        status,
        data?.code || 'UNKNOWN_ERROR',
        data?.details,
        requestId,
        context
      );
  }
};

// Error handler for file upload errors
export const handleFileUploadError = (error: any, context?: ErrorContext): AppError => {
  if (error.code === 'FILE_TOO_LARGE') {
    return new ValidationError('File is too large. Please choose a smaller file.', context);
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return new ValidationError('Invalid file type. Please choose a valid file.', context);
  }
  
  if (error.code === 'NO_FILE_SELECTED') {
    return new ValidationError('Please select a file to upload.', context);
  }
  
  return handleApiError(error, context);
};

// Error handler for WhatsApp specific errors
export const handleWhatsAppError = (error: any, context?: ErrorContext): AppError => {
  if (error.message?.includes('WhatsApp') || error.message?.includes('WA_')) {
    return new WhatsAppAPIError(
      error.message || 'WhatsApp API error occurred',
      error.details,
      context
    );
  }
  
  return handleApiError(error, context);
};

// User-friendly error messages
export const getErrorMessage = (error: AppError): string => {
  // Custom messages for specific error types
  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (error instanceof AuthenticationError) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error instanceof ValidationError) {
    return error.message || 'Please check your input and try again.';
  }
  
  if (error instanceof WhatsAppAPIError) {
    return 'WhatsApp service is temporarily unavailable. Please try again later.';
  }
  
  if (error instanceof ServerError) {
    return 'Server error occurred. Please try again later.';
  }
  
  // Default message
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Error logging utility
export const logError = (error: AppError, additionalContext?: any) => {
  const errorData = {
    message: error.message,
    status: error.status,
    code: error.code,
    details: error.details,
    requestId: error.requestId,
    context: error.context,
    additionalContext,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('🚨 Application Error:', errorData);

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      }).catch(console.error);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
};

// Retry utility for failed requests
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: ErrorContext
): Promise<T> => {
  let lastError: AppError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleApiError(error, context);
      
      // Don't retry certain errors
      if (
        lastError instanceof AuthenticationError ||
        lastError instanceof AuthorizationError ||
        lastError instanceof ValidationError ||
        lastError instanceof NotFoundError ||
        (lastError.status && lastError.status >= 400 && lastError.status < 500)
      ) {
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// Error boundary helper
export const createErrorContext = (operation: string, additionalData?: any): ErrorContext => ({
  operation,
  userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).userId : undefined,
  timestamp: new Date().toISOString(),
  url: window.location.href,
  method: 'GET', // This would be set by the calling function
  ...additionalData
});

