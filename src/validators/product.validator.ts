import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  sku: z.string().min(1, 'SKU is required'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  lowStockThreshold: z.number().int().min(0).optional(),
  images: z.array(
    z.object({
      url: z.string().min(1),
      alt: z.string().optional(),
      isMain: z.boolean().optional(),
    })
  ).min(1, 'At least one image is required'),
  variants: z.array(
    z.object({
      sku: z.string().min(1),
      price: z.number().min(0),
      stock: z.number().int().min(0),
      images: z.array(z.string()).optional(),
      attributes: z.record(z.any()).optional(),
    })
  ).optional(),
  attributes: z.record(z.array(z.string())).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  hasBespokeTailoring: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();
