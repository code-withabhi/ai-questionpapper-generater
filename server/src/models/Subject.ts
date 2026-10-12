import { Schema, model, Document, Types } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code?: string;
  course: string;
  description?: string;
  ownerId: Types.ObjectId;
  shared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    code: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    course: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shared: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
subjectSchema.index({ ownerId: 1, name: 1 });
subjectSchema.index({ shared: 1, course: 1 });

export const Subject = model<ISubject>('Subject', subjectSchema);
