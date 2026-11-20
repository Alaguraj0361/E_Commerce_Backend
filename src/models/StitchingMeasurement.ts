import mongoose, { Schema, Document } from 'mongoose';

export interface IStitchingMeasurement extends Document {
  measurementCode: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity?: string;
  categorySlug: string;
  categoryName: string;
  measurements: Record<string, string>;
  specialInstructions?: string;
  fitPreference?: string;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

const StitchingMeasurementSchema = new Schema<IStitchingMeasurement>(
  {
    measurementCode: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
    customerName: { type: String, required: true, index: true },
    customerPhone: { type: String, required: true, index: true },
    customerEmail: { type: String, default: '' },
    customerCity: { type: String, default: 'Thoothukudi' },
    categorySlug: { type: String, required: true, index: true },
    categoryName: { type: String, required: true },
    measurements: { type: Map, of: String, default: {} },
    specialInstructions: { type: String, default: '' },
    fitPreference: { type: String, default: 'Comfort Fit' },
    unit: { type: String, default: 'inches' },
  },
  { timestamps: true }
);

export const StitchingMeasurement = mongoose.model<IStitchingMeasurement>(
  'StitchingMeasurement',
  StitchingMeasurementSchema
);

