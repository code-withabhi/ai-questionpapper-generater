export interface QuestionCandidate {
  _id: string;
  questionText: string;
  questionType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  topicId?: string;
  chapterId?: string;
  subjectId: string;
  bloomLevel?: string;
  normalizedTextHash: string;
  usageCount?: number;
}

export interface SectionRule {
  title: string;
  instructions?: string;
  allowedTypes: string[];
  marksPerQuestion?: number;
  targetMarks: number;
  requiredCount?: number;
}

export interface DifficultyQuota {
  easyPercent: number;    // e.g. 30
  mediumPercent: number;  // e.g. 50
  hardPercent: number;    // e.g. 20
}

export interface PaperGenerationCriteria {
  targetTotalMarks: number;
  durationMinutes: number;
  sectionRules?: SectionRule[];
  difficultyQuota?: DifficultyQuota;
  requiredTopicIds?: string[];
  maxTopicRepetition?: number;
}

export interface ValidationReport {
  isValid: boolean;
  actualTotalMarks: number;
  targetTotalMarks: number;
  difficultyBreakdown: {
    easyMarks: number;
    mediumMarks: number;
    hardMarks: number;
    easyPercent: number;
    mediumPercent: number;
    hardPercent: number;
  };
  topicCoverage: {
    totalTopicsCovered: number;
    coverageDetails: Record<string, number>; // topicId -> questionCount
  };
  errors: string[];
  warnings: string[];
}

export interface GenerationEngineResult {
  success: boolean;
  sections: Array<{
    title: string;
    instructions?: string;
    marksPerQuestion: number;
    questionIds: string[];
    questions: QuestionCandidate[];
    sectionMarks: number;
  }>;
  totalMarks: number;
  validationReport: ValidationReport;
  algorithmSummary: {
    candidatePoolSize: number;
    duplicatesPruned: number;
    searchStrategy: 'greedy-backtracking';
    executionTimeMs: number;
  };
  errorReason?: string;
}
