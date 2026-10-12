import { Schema, model, Document, Types } from 'mongoose';

export interface IChapter extends Document {
  subjectId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<IChapter>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
chapterSchema.index({ subjectId: 1, order: 1 });

export const Chapter = model<IChapter>('Chapter', chapterSchema);
