import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProcessedWebhookEvent extends Document {
  eventId: string;
  source: 'razorpay' | 'stripe';
  eventType: string;
  resourceId?: string;
  processedAt: Date;
}

export interface IProcessedWebhookEventModel extends Model<IProcessedWebhookEvent> {
  recordIfNew(
    eventId: string,
    source: 'razorpay' | 'stripe',
    eventType: string,
    resourceId?: string
  ): Promise<boolean>;
}

const ProcessedWebhookEventSchema = new Schema<IProcessedWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['razorpay', 'stripe'],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    resourceId: {
      type: String,
      trim: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      // Automatically clean up records after 90 days
      expires: 60 * 60 * 24 * 90,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: guarantees database-level idempotency
ProcessedWebhookEventSchema.index({ eventId: 1, source: 1 }, { unique: true });

/**
 * Atomically attempts to insert the event.
 * If the event was already processed, it catches the unique index collision (E11000)
 * and returns false without throwing an error.
 */
ProcessedWebhookEventSchema.statics.recordIfNew = async function (
  eventId: string,
  source: 'razorpay' | 'stripe',
  eventType: string,
  resourceId?: string
): Promise<boolean> {
  try {
    await this.create({
      eventId,
      source,
      eventType,
      resourceId,
      processedAt: new Date(),
    });
    return true;
  } catch (err: any) {
    if (err.code === 11000) {
      return false; // Duplicate event
    }
    throw err;
  }
};

export const ProcessedWebhookEvent = mongoose.model<
  IProcessedWebhookEvent,
  IProcessedWebhookEventModel
>('ProcessedWebhookEvent', ProcessedWebhookEventSchema);

