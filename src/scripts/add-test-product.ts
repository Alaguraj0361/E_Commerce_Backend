import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

async function seedTestProduct() {
  console.log('[Test Product] Connecting to MongoDB...');
  await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

  let category = await Category.findOne({ isActive: true });
  if (!category) {
    category = await Category.findOne();
  }
  if (!category) {
    category = await Category.create({
      name: 'Testing',
      slug: 'testing-category',
      description: 'Testing Category',
      isActive: true,
    });
  }

  const testProductData = {
    name: 'testing',
    slug: 'testing',
    description:
      'Live payment gateway verification product. Specially configured for ₹1 exact billing with zero delivery charge and zero GST tax.',
    shortDescription: 'Testing Product - Exact ₹1 Billing (No delivery fee, No GST)',
    category: category._id,
    price: 1,
    compareAtPrice: 99,
    costPrice: 0,
    sku: 'TEST-1RS',
    stock: 999,
    lowStockThreshold: 10,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        alt: 'Testing Product',
        isDefault: true,
      },
    ],
    isActive: true,
    isFeatured: true,
    tags: ['test', 'razorpay', '1rs'],
    variants: [],
  };

  const product = await Product.findOneAndUpdate(
    { slug: 'testing' },
    testProductData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('[Test Product] Successfully configured ₹1 testing product:');
  console.log({
    id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    sku: product.sku,
    stock: product.stock,
  });

  await mongoose.disconnect();
}

seedTestProduct().catch((err) => {
  console.error('[Test Product Error]:', err);
  process.exit(1);
});

