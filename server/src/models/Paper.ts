import mongoose, { Document, Schema } from 'mongoose';

export interface IPaperSection {
  title: string;
  instructions?: string;
  marksPerQuestion: number;
  questionIds: mongoose.Types.ObjectId[];
}

export interface IPaperVersionSnapshot {
  versionNumber: number;
  title: string;
  sections: IPaperSection[];
  totalMarks: number;
  savedAt: Date;
}

export interface IPaper extends Document {
  title: string;
  subjectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  durationMinutes: number;
  targetTotalMarks: number;
  instructions?: string;
  status: 'draft' | 'finalized';
  version: number;
  versionHistory: IPaperVersionSnapshot[];
  sections: IPaperSection[];
  createdAt: Date;
  updatedAt: Date;
}

const PaperSectionSchema = new Schema<IPaperSection>(
  {
    title: { type: String, required: true },
    instructions: { type: String },
    marksPerQuestion: { type: Number, required: true, default: 1 },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  },
  { _id: false }
);

const PaperVersionSnapshotSchema = new Schema<IPaperVersionSnapshot>(
  {
    versionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    sections: [PaperSectionSchema],
    totalMarks: { type: Number, required: true },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaperSchema = new Schema<IPaper>(
  {
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    targetTotalMarks: { type: Number, required: true, default: 50 },
    instructions: { type: String },
    status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },
    version: { type: Number, default: 1 },
    versionHistory: [PaperVersionSnapshotSchema],
    sections: [PaperSectionSchema],
  },
  { timestamps: true }
);

export const Paper = mongoose.model<IPaper>('Paper', PaperSchema);
