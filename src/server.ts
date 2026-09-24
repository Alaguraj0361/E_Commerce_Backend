import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';


import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import Route Handlers
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import orderRoutes from './routes/order.routes.js';
import reviewRoutes from './routes/review.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { handleStripeWebhook } from './controllers/webhook.controller.js';


const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
app.use(
  cors({
    origin: [
      ENV.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id'],
  })
);

// Request Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 1. Stripe Webhook: MUST receive raw buffer, before express.json()
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// 2. Standard Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
app.use('/api', generalLimiter);

// Serve static uploaded files
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: ENV.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Start Server
export const startServer = async () => {
  await connectDB();
  const server = app.listen(ENV.PORT, () => {
    console.log(`=============================================`);
    console.log(`  E-Commerce Backend Server Started`);
    console.log(`  Port: http://localhost:${ENV.PORT}`);
    console.log(`  Mode: ${ENV.NODE_ENV}`);
    console.log(`  Health Check: http://localhost:${ENV.PORT}/api/health`);
    console.log(`=============================================`);
  });
  return server;
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
