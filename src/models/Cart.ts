import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  sku?: string;
  attributes?: Record<string, any>;
  quantity: number;
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  guestId?: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    sku: {
      type: String,
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    guestId: {
      type: String,
      index: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
