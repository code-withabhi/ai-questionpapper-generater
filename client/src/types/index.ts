export type UserRole = 'teacher' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  course: string;
  description?: string;
  ownerId: string;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  _id: string;
  subjectId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  _id: string;
  subjectId: string;
  chapterId: string;
  title: string;
  description?: string;
  learningObjectives?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface Question {
  _id: string;
  subjectId: string | { _id: string; name: string; code: string };
  chapterId: string;
  topicId: string | { _id: string; title: string };
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  text: string;
  options?: MCQOption[];
  correctAnswer?: string;
  sampleAnswer?: string;
  explanation?: string;
  bloomLevel?: BloomLevel;
  tags?: string[];
  source?: 'manual' | 'ai-generated';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  subjects: number;
  chapters: number;
  topics: number;
  questions: number;
  questionsByDifficulty: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
  questionsByType: {
    'multiple-choice'?: number;
    'true-false'?: number;
    'short-answer'?: number;
    essay?: number;
  };
  recentQuestions: Question[];
}

export interface PaginatedResponse<T> {
  questions: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaperSection {
  title: string;
  instructions?: string;
  marksPerQuestion: number;
  questionIds: Question[] | string[];
}

export interface Paper {
  _id: string;
  title: string;
  subjectId: string | { _id: string; name: string; code: string };
  durationMinutes: number;
  targetTotalMarks: number;
  instructions?: string;
  status: 'draft' | 'finalized';
  version?: number;
  sections: PaperSection[];
  createdAt: string;
  updatedAt: string;
}


