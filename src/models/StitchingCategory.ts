import mongoose, { Schema, Document } from 'mongoose';

export interface IMeasurementFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
}

export interface IStitchingCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  estimatedTurnaroundDays: number;
  fields: IMeasurementFieldDef[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MeasurementFieldDefSchema = new Schema<IMeasurementFieldDef>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String, default: '' },
    hint: { type: String, default: '' },
  },
  { _id: false }
);

const StitchingCategorySchema = new Schema<IStitchingCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    basePrice: { type: Number, default: 450, min: 0 },
    estimatedTurnaroundDays: { type: Number, default: 3, min: 1 },
    fields: [MeasurementFieldDefSchema],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const StitchingCategory = mongoose.model<IStitchingCategory>(
  'StitchingCategory',
  StitchingCategorySchema
);

