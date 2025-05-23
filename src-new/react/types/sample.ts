// Sample type definitions for demonstration purposes
// このファイルはサンプル用の型定義です

export interface SampleUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface SampleProject {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  status: 'draft' | 'active' | 'completed';
}

export interface SampleApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export type SampleTheme = 'light' | 'dark' | 'auto';

export type SampleButtonVariant = 'primary' | 'secondary' | 'danger';

// Sample enum
export enum SampleStatus {
  PENDING = 'pending',
  APPROVED = 'approved', 
  REJECTED = 'rejected'
} 