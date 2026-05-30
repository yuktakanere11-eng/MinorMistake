import type { User } from '@supabase/supabase-js';

export type AppRole = 'teacher' | 'student';

export type SubmissionStatus = 'submitted' | 'reviewed';
export type FeedbackStatus = 'draft' | 'final';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'student';

  // ✅ ADD THIS (fixes your error)
  onboarding_completed?: boolean;

  // ✅ Optional but recommended (matches your DB)
  institution_name?: string;
  department?: string;

  teaching_role?: string;
  primary_course_type?: string;
  preferred_grading_style?: string;
  current_class_count?: string;

  created_at?: string;
  updated_at?: string;
}
export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  semester: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  total_points?: number | null;
  submission_type?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  file_path: string | null;
  submitted_at: string;
  status: SubmissionStatus;
  updated_at: string;
}

export interface Feedback {
  id: string;
  submission_id: string;
  teacher_id: string;
  summary: string | null;
  strengths: string | null;
  improvements: string | null;
  action_items: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCategory {
  id: string;
  feedback_id: string;
  category_name: string;
  category_comment: string | null;
  created_at: string;
}

export interface AuthUserWithProfile {
  user: User;
  profile: Profile | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: Class;
        Insert: {
          id?: string;
          teacher_id: string;
          name: string;
          description?: string | null;
          semester?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          name?: string;
          description?: string | null;
          semester?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_enrollments: {
        Row: ClassEnrollment;
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: Assignment;
        Insert: {
          id?: string;
          class_id: string;
          teacher_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          teacher_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: Submission;
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          submission_text?: string | null;
          file_path?: string | null;
          submitted_at?: string;
          status?: SubmissionStatus;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          submission_text?: string | null;
          file_path?: string | null;
          submitted_at?: string;
          status?: SubmissionStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: Feedback;
        Insert: {
          id?: string;
          submission_id: string;
          teacher_id: string;
          summary?: string | null;
          strengths?: string | null;
          improvements?: string | null;
          action_items?: string | null;
          status?: FeedbackStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          teacher_id?: string;
          summary?: string | null;
          strengths?: string | null;
          improvements?: string | null;
          action_items?: string | null;
          status?: FeedbackStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedback_categories: {
        Row: FeedbackCategory;
        Insert: {
          id?: string;
          feedback_id: string;
          category_name: string;
          category_comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          feedback_id?: string;
          category_name?: string;
          category_comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export * from './review';