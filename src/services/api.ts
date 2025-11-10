import axios from 'axios';
import type {
    LoginRequest,
    LoginResponse,
    User,
    Department,
    MessageLog,
    BulkOperation,
    SingleMessageRequest,
    BulkMessageRequest,
    FileInfo
} from '../types';
import { handleApiError, handleFileUploadError, handleWhatsAppError, withRetry, createErrorContext, AppError } from '../utils/errorHandler';
import { withRateLimit, messageRateLimiter, fileUploadRateLimiter, retryWithBackoff } from '../utils/rateLimiter';

const API_BASE_URL = 'https://backend-obnm.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const context = createErrorContext(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      }
    );

    // Handle different types of errors
    let handledError: AppError;
    
    if (error.config?.url?.includes('/send/') || error.config?.url?.includes('/whatsapp')) {
      handledError = handleWhatsAppError(error, context);
    } else if (error.config?.url?.includes('/upload') || error.config?.url?.includes('/file')) {
      handledError = handleFileUploadError(error, context);
    } else {
      handledError = handleApiError(error, context);
    }

    // Only redirect to login for 401 errors on protected routes (not login itself)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(handledError);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    api.post('/auth/login', data).then(res => res.data),
  
  register: (data: LoginRequest): Promise<LoginResponse> =>
    api.post('/auth/register', data).then(res => res.data),
  
  getProfile: (): Promise<User> =>
    api.get('/auth/profile').then(res => res.data),
};

// Department API
export const departmentAPI = {
  getDepartments: (): Promise<Department[]> =>
    api.get('/admin/departments').then(res => res.data),
  
  // Deprecated: kept for backward compatibility
  getDepartmentFiles: (departmentCode: string): Promise<FileInfo[]> =>
    api.get(`/admin/departments/${departmentCode}/files`).then(res => res.data),

  // Preferred: reads PDFs from SectionPDF collection for a section
  getSectionPDFs: (departmentCode: string): Promise<FileInfo[]> =>
    api.get(`/admin/sections/${departmentCode}/pdfs`).then(res => res.data),

  // Consolidated: get all pending files across all departments in one call
  getAllPendingFiles: (): Promise<{ [key: string]: FileInfo[] }> =>
    api.get('/admin/all-pending-files').then(res => res.data),
};

// Message API
export const messageAPI = {
  sendSingleDocument: withRateLimit(
    (data: SingleMessageRequest): Promise<any> => {
      const formData = new FormData();
      formData.append('to', data.to);
      formData.append('department', data.department);
      formData.append('scheduledDate', data.scheduledDate);
      formData.append('scheduledTime', data.scheduledTime);
      formData.append('documentFile', data.pdfFile);
      
      return retryWithBackoff(
        () => api.post('/send/single-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data),
        3,
        1000
      );
    },
    messageRateLimiter,
    'Too many single message requests. Please wait before sending another message.'
  ),

  sendBulkDocument: withRateLimit(
    (data: BulkMessageRequest): Promise<any> => {
      const formData = new FormData();
      formData.append('department', data.department);
      formData.append('scheduledDate', data.scheduledDate);
      formData.append('scheduledTime', data.scheduledTime);
      formData.append('csvFile', data.csvFile);
      
      // Send the first PDF as documentFile (backend expects this field name)
      if (data.pdfFiles.length > 0) {
        formData.append('documentFile', data.pdfFiles[0]);
      }
      
      // Add remaining PDFs (avoid duplicating the first one)
      data.pdfFiles.slice(1).forEach((file) => {
        formData.append('pdfFiles', file);
      });
      
      return retryWithBackoff(
        () => api.post('/send/csv-bulk-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data),
        2,
        2000
      );
    },
    fileUploadRateLimiter,
    'Too many bulk message requests. Please wait before sending another batch.'
  ),

  sendBulkDatabasePDF: withRateLimit(
    (data: { department: string; csvFile: File; pdfId: string; scheduledDate: string; scheduledTime: string }): Promise<any> => {
      const formData = new FormData();
      formData.append('department', data.department);
      formData.append('scheduledDate', data.scheduledDate);
      formData.append('scheduledTime', data.scheduledTime);
      formData.append('csvFile', data.csvFile);
      formData.append('pdfId', data.pdfId);
      
      return retryWithBackoff(
        () => api.post('/send/csv-bulk-database-pdf', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data),
        2,
        2000
      );
    },
    fileUploadRateLimiter,
    'Too many bulk message requests. Please wait before sending another batch.'
  ),

  getMessages: (params?: any): Promise<{ messages: MessageLog[]; pagination: any; statistics: any }> =>
    api.get('/send/messages', { params }).then(res => res.data),

  getMessageStats: (params?: any): Promise<any> =>
    api.get('/send/messages-stats', { params }).then(res => res.data),

  exportMessagesCSV: (params?: any): Promise<Blob> =>
    api.get('/send/messages/export/csv', { 
      params,
      responseType: 'blob'
    }).then(res => res.data),
};

// Admin API
export const adminAPI = {
  getUsers: (): Promise<User[]> =>
    api.get('/admin/users').then(res => res.data),
  
  createUser: (data: Partial<User>): Promise<User> =>
    api.post('/admin/users', data).then(res => res.data),
  
  updateUser: (id: string, data: Partial<User>): Promise<User> =>
    api.put(`/admin/users/${id}`, data).then(res => res.data),
  
  deleteUser: (id: string): Promise<void> =>
    api.delete(`/admin/users/${id}`).then(res => res.data),
  
  // Section Management
  getSections: (): Promise<Department[]> =>
    api.get('/admin/sections').then(res => res.data),
  
  createSection: (data: { name: string; code: string; description?: string }): Promise<Department> =>
    api.post('/admin/sections', data).then(res => res.data),
  
  updateSection: (id: string, data: { name?: string; code?: string; description?: string }): Promise<Department> =>
    api.put(`/admin/sections/${id}`, data).then(res => res.data),
  
  deleteSection: (id: string): Promise<void> =>
    api.delete(`/admin/sections/${id}`).then(res => res.data),
  
  getBulkOperations: (params?: any): Promise<{ operations: BulkOperation[]; total: number }> =>
    api.get('/admin/bulk-operations', { params }).then(res => res.data),
  
  // WhatsApp Settings
  getWhatsAppSettings: (): Promise<{ accessToken: string; phoneNumberId: string }> =>
    api.get('/admin/whatsapp-settings').then(res => res.data),
  
  updateWhatsAppSettings: (data: { accessToken: string; phoneNumberId: string }): Promise<{ message: string; accessToken: string; phoneNumberId: string }> =>
    api.put('/admin/whatsapp-settings', data).then(res => res.data),
};

export default api;
