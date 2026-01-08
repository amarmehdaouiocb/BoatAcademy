import type { Database } from './database.types';

// Extract table row types for convenience
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Site = Database['public']['Tables']['sites']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type StudentDocument = Database['public']['Tables']['student_documents']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type DocumentType = Database['public']['Tables']['document_types']['Row'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];
export type DocumentStatus = Database['public']['Enums']['document_status'];
export type SessionType = Database['public']['Enums']['session_type'];
export type EnrollmentStatus = Database['public']['Enums']['enrollment_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type ProductType = Database['public']['Enums']['product_type'];
export type NotificationType = Database['public']['Enums']['notification_type'];
export type PenaltyType = Database['public']['Enums']['penalty_type'];

// Commonly used partial types
export type ProfileBasic = Pick<Profile, 'user_id' | 'full_name' | 'role' | 'primary_site_id'>;

// Re-export Database for convenience
export type { Database };
