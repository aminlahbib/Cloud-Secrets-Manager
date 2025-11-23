export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  permissions: Permission[];
  active: boolean;
  createdAt: string;
}

export type Permission = 'READ' | 'WRITE' | 'DELETE' | 'LIST' | 'ROTATE' | 'SHARE';

export interface Secret {
  id: string;
  key: string;
  value?: string;
  encryptedValue?: string;
  description?: string;
  tags?: string[];
  version?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface SecretFormData {
  key: string;
  value: string;
  description?: string;
  tags?: string;
  expiresAt?: Date;
}

export interface SharedSecret {
  id: string;
  secretKey: string;
  sharedWith: string;
  sharedBy: string;
  permission: 'read' | 'write';
  sharedAt: string;
}

export interface AuditLog {
  id: string;
  username: string;  // Backend returns 'username'
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ROTATE' | 'SHARE' | 'UNSHARE';
  secretKey?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;  // Optional - not in backend yet
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface LoginRequest {
  email?: string;
  password?: string;
  idToken?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

