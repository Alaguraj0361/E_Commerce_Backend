import mongoose, { Schema, Document } from 'mongoose';

export interface IStitchingOrder extends Document {
  stitchingOrderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  categorySlug: string;
  categoryName: string;
  measurementId?: mongoose.Types.ObjectId;
  measurementCode?: string;
  measurementSummary?: string;
  estimatedDispatchDate: string;
  actualDispatchDate?: string;
  additionalInformation?: string;
  liningType?: string;
  fabricProvidedBy?: string;
  assignedTailor?: string;
  priority: string;
  status: string;
  stitchingCharge: number;
  advancePaid: number;
  balanceDue: number;
  courierPartner?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StitchingOrderSchema = new Schema<IStitchingOrder>(
  {
    stitchingOrderNumber: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
    customerName: { type: String, required: true, index: true },
    customerPhone: { type: String, required: true, index: true },
    customerAddress: { type: String, default: '' },
    categorySlug: { type: String, required: true, index: true },
    categoryName: { type: String, required: true },
    measurementId: { type: Schema.Types.ObjectId, ref: 'StitchingMeasurement' },
    measurementCode: { type: String, default: '' },
    measurementSummary: { type: String, default: '' },
    estimatedDispatchDate: { type: String, required: true, index: true },
    actualDispatchDate: { type: String },
    additionalInformation: { type: String, default: '' },
    liningType: { type: String, default: 'Pure Mulmul Cotton (Pre-Washed)' },
    fabricProvidedBy: { type: String, default: 'Customer Provided' },
    assignedTailor: { type: String, default: 'Master Murugan (Atelier 1)' },
    priority: { type: String, default: 'Normal', enum: ['Normal', 'Express (48h)', 'Urgent Wedding VIP'] },
    status: {
      type: String,
      default: 'Order Confirmed',
      enum: [
        'Order Confirmed',
        'Fabric Received',
        'Pattern Cutting',
        'Embroidery / Aari',
        'Stitching In Progress',
        'Trial / Alteration',
        'Ironing & Packed',
        'Ready for Dispatch',
        'Dispatched',
        'Delivered',
      ],
      index: true,
    },
    stitchingCharge: { type: Number, default: 0, min: 0 },
    advancePaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, default: 0, min: 0 },
    courierPartner: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const StitchingOrder = mongoose.model<IStitchingOrder>(
  'StitchingOrder',
  StitchingOrderSchema
);

