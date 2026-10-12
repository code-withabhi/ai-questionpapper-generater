import { Schema, model, Document, Types } from 'mongoose';

export interface ITopic extends Document {
  chapterId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  description?: string;
  learningObjectives?: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
      index: true,
    },
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
    learningObjectives: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
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

// Compound indexes for efficient queries
topicSchema.index({ chapterId: 1, order: 1 });

export const Topic = model<ITopic>('Topic', topicSchema);
