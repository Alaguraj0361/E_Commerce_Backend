import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant {
  _id?: mongoose.Types.ObjectId;
  sku: string;
  price: number;
  stock: number;
  images: string[];
  attributes: {
    size?: string;
    color?: string;
    colorHex?: string;
    material?: string;
    [key: string]: any;
  };
}

export interface IProductImage {
  url: string;
  alt?: string;
  isMain?: boolean;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: mongoose.Types.ObjectId | string;
  category: mongoose.Types.ObjectId | string;
  images: IProductImage[];
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  variants: IProductVariant[];
  attributes: Record<string, string[]>;
  tags: string[];
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  hasBespokeTailoring?: boolean;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: true }
);

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isMain: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    shortDescription: {
      type: String,
      default: '',
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    images: [ProductImageSchema],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
      index: true,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      index: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    variants: [ProductVariantSchema],
    attributes: {
      type: Map,
      of: [String],
      default: {},
    },
    tags: [{ type: String, index: true }],
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    bestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    newArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasBespokeTailoring: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to ensure slug is always populated if name is present
ProductSchema.pre('validate', function (next) {
  if ((!this.slug || typeof this.slug !== 'string' || this.slug.trim() === '') && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

// Compound text index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
