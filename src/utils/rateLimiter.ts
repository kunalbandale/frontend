// Rate limiting utility for API calls

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (args: any[]) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(args: any[]): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(args);
    }
    return 'default';
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  isAllowed(args: any[] = []): boolean {
    this.cleanup();
    
    const key = this.getKey(args);
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Reset the counter
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingTime(args: any[] = []): number {
    const key = this.getKey(args);
    const entry = this.limits.get(key);
    
    if (!entry) {
      return 0;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return 0;
    }

    return entry.resetTime - now;
  }

  getRemainingRequests(args: any[] = []): number {
    const key = this.getKey(args);
    const entry = this.limits.get(key);
    
    if (!entry) {
      return this.config.maxRequests;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  keyGenerator: (args) => {
    // Use the first argument as the key (usually the endpoint)
    return args[0] || 'default';
  }
});

export const messageRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 30000, // 30 seconds
  keyGenerator: (args) => {
    // Use user ID and operation type as key
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).userId : 'anonymous';
    const operation = args[0] || 'default';
    return `${userId}-${operation}`;
  }
});

export const fileUploadRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60000, // 1 minute
  keyGenerator: (args) => {
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).userId : 'anonymous';
    return `${userId}-file-upload`;
  }
});

// Rate limit decorator for functions
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  rateLimiter: RateLimiter,
  errorMessage: string = 'Rate limit exceeded. Please try again later.'
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    if (!rateLimiter.isAllowed(args)) {
      const remainingTime = rateLimiter.getRemainingTime(args);
      const seconds = Math.ceil(remainingTime / 1000);
      throw new Error(`${errorMessage} Try again in ${seconds} seconds.`);
    }

    return fn(...args);
  };
}

// Rate limit hook for React components
export const useRateLimit = (rateLimiter: RateLimiter, args: any[] = []) => {
  const isAllowed = rateLimiter.isAllowed(args);
  const remainingTime = rateLimiter.getRemainingTime(args);
  const remainingRequests = rateLimiter.getRemainingRequests(args);

  return {
    isAllowed,
    remainingTime,
    remainingRequests,
    remainingTimeSeconds: Math.ceil(remainingTime / 1000)
  };
};

// Debounce utility for input fields
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for frequent events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// Global circuit breaker for API calls
export const apiCircuitBreaker = new CircuitBreaker(5, 60000, 30000);

