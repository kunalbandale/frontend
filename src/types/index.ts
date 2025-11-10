export interface User {
  _id: string;
  email: string;
  role: 'ADMIN' | 'CLERK' | 'SECTION';
  department?: string;
  fullName?: string;
  username?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageLog {
  _id: string;
  to: string;
  type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
  payload: any;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'DELIVERED' | 'READ' | 'UPLOADED';
  department: string;
  sentBy: User;
  waMessageId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkOperation {
  _id: string;
  operationName: string;
  type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
  department: string;
  totalRecipients: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  sentBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: 'ADMIN' | 'CLERK' | 'SECTION';
  department?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SingleMessageRequest {
  to: string;
  department: string;
  scheduledDate: string;
  scheduledTime: string;
  pdfFile: File;
}

export interface BulkMessageRequest {
  department: string;
  csvFile: File;
  pdfFiles: File[];
  scheduledDate: string;
  scheduledTime: string;
}

export interface FileInfo {
  id?: string;            // Mongo _id when coming from DB
  name: string;          // filename (e.g., 9876543210.pdf)
  path?: string;         // legacy FS path (optional)
  size: number;          // bytes
  type: string;          // mime type
  department?: string;   // section code
  uploadedAt?: string;   // ISO date
  recipient?: string;    // mobile number
  uploadedBy?: string;   // uploader name/email
}
