import { Schema, model, Document, Types } from 'mongoose';

export type QuestionType =
  | 'mcq-single'
  | 'mcq-multiple'
  | 'true-false'
  | 'fill-blank'
  | 'short-answer'
  | 'long-answer'
  | 'numerical'
  | 'programming'
  | 'case-study'
  | 'assertion-reasoning'
  | 'match-following';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export type QuestionOrigin = 'manual' | 'ai-generated';

export type ApprovalStatus = 'draft' | 'approved' | 'rejected';

interface MCQOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  ownerId: Types.ObjectId;
  subjectId: Types.ObjectId;
  chapterId?: Types.ObjectId;
  topicId?: Types.ObjectId;
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  estimatedTimeMinutes?: number;
  bloomLevel?: BloomLevel;
  
  // MCQ specific
  options?: MCQOption[];
  
  // Answer and explanation
  correctAnswer?: string;
  explanation?: string;
  markingScheme?: string;
  
  // Metadata
  tags: string[];
  origin: QuestionOrigin;
  approvalStatus: ApprovalStatus;
  normalizedTextHash: string;
  
  // Soft delete
  deletedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const mcqOptionSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    questionType: {
      type: String,
      enum: [
        'mcq-single',
        'mcq-multiple',
        'true-false',
        'fill-blank',
        'short-answer',
        'long-answer',
        'numerical',
        'programming',
        'case-study',
        'assertion-reasoning',
        'match-following',
      ],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0.5,
      max: 100,
      index: true,
    },
    estimatedTimeMinutes: {
      type: Number,
      min: 1,
      max: 300,
    },
    bloomLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
    },
    options: [mcqOptionSchema],
    correctAnswer: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    markingScheme: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    origin: {
      type: String,
      enum: ['manual', 'ai-generated'],
      required: true,
      default: 'manual',
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'approved', 'rejected'],
      required: true,
      default: 'draft',
      index: true,
    },
    normalizedTextHash: {
      type: String,
      required: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
questionSchema.index({ ownerId: 1, subjectId: 1 });
questionSchema.index({ subjectId: 1, difficulty: 1, marks: 1 });
questionSchema.index({ normalizedTextHash: 1, deletedAt: 1 });
questionSchema.index({ tags: 1 });

// Validation: MCQ questions must have options
questionSchema.pre('save', function (next) {
  if (
    (this.questionType === 'mcq-single' ||
      this.questionType === 'mcq-multiple' ||
      this.questionType === 'true-false') &&
    (!this.options || this.options.length < 2)
  ) {
    next(new Error('MCQ questions must have at least 2 options'));
    return;
  }
  
  // MCQ must have at least one correct answer
  if (
    (this.questionType === 'mcq-single' || this.questionType === 'mcq-multiple') &&
    this.options &&
    !this.options.some((opt) => opt.isCorrect)
  ) {
    next(new Error('MCQ questions must have at least one correct answer'));
    return;
  }
  
  // Single MCQ must have exactly one correct answer
  if (
    this.questionType === 'mcq-single' &&
    this.options &&
    this.options.filter((opt) => opt.isCorrect).length !== 1
  ) {
    next(new Error('Single-answer MCQ must have exactly one correct option'));
    return;
  }
  
  next();
});

export const Question = model<IQuestion>('Question', questionSchema);
