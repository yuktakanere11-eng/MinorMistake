import type {
  Feedback,
  FeedbackCategory,
  FeedbackStatus,
  Submission,
} from './index';

export interface ReviewCategoryInput {
  category_name: string;
  category_comment: string;
}

export interface ReviewInput {
  submission_id: string;
  teacher_id: string;
  summary: string;
  strengths: string;
  improvements: string;
  action_items: string;
  status: FeedbackStatus;
  categories: ReviewCategoryInput[];
}

export interface ReviewFeedbackPayload {
  summary: string;
  strengths: string;
  improvements: string;
  action_items: string;
  status: FeedbackStatus;
}

export interface ReviewDraftState extends ReviewInput {
  feedback_id?: string;
}

export interface ReviewSubmissionContext {
  submission: Submission;
  feedback: Feedback | null;
  categories: FeedbackCategory[];
}

export interface AiFeedbackCue {
  label: string;
  value: string;
}

export interface AiFeedbackSuggestion {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  action_items?: string[];
  cues?: AiFeedbackCue[];
}