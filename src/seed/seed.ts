import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { ENV } from '../config/env.js';

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Seed] Connected.');

    // Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      Order.deleteMany({}),
      Cart.deleteMany({}),
    ]);

    // 1. Create Users
    console.log('[Seed] Creating demo users...');
    const admin = await User.create({
      firstName: 'Alexander',
      lastName: 'Pierce',
      email: 'admin@ecommerce.com',
      phone: '+91 98765 43210',
      password: 'Admin@123456',
      role: 'admin',
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });

    const customer = await User.create({
      firstName: 'Sophia',
      lastName: 'Chen',
      email: 'customer@ecommerce.com',
      phone: '+91 91234 56789',
      password: 'Customer@123456',
      role: 'customer',
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    });

    // 2. Create Categories
    console.log('[Seed] Creating categories...');
    const categories = await Category.create([
      {
        name: "Men's Fashion",
        slug: 'mens-fashion',
        description: 'Refined contemporary apparel tailored for modern living.',
        image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: "Women's Fashion",
        slug: 'womens-fashion',
        description: 'Timeless silhouettes and effortless wardrobe staples.',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Precision-engineered acoustics, peripherals, and minimalist tech.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Footwear',
        slug: 'footwear',
        description: 'Artisanal leather boots, minimalist sneakers, and performance shoes.',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Heirloom timepieces, handcrafted leather goods, and eyewear.',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Architectural lighting, artisanal ceramics, and serene lifestyle pieces.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
    ]);

    const catMap = new Map(categories.map((c) => [c.slug, c._id]));

    // 3. Create Brands
    console.log('[Seed] Creating brands...');
    const brands = await Brand.create([
      {
        name: 'Aethelgard Studio',
        slug: 'aethelgard-studio',
        description: 'Nordic minimalist tailored apparel and textiles.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Nomad Atelier',
        slug: 'nomad-atelier',
        description: 'Handcrafted full-grain leather bags and travel accessories.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Apex Audio',
        slug: 'apex-audio',
        description: 'Audiophile grade studio headphones and acoustic instruments.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Lumina Living',
        slug: 'lumina-living',
        description: 'Architectural ceramics, glassware, and smart ambient lighting.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
    ]);

    const brandMap = new Map(brands.map((b) => [b.slug, b._id]));

    // 4. Create Rich Products with Indian Rupee Prices
    console.log('[Seed] Creating products with Indian Rupee (₹) pricing...');
    const rawProducts = [
      {
        name: 'Tailored Minimalist Wool Overcoat',
        slug: 'tailored-minimalist-wool-overcoat',
        description:
          'Constructed from double-faced 100% Australian virgin wool, this overcoat delivers unmatched thermal warmth and a drape of quiet sophistication. Features horn buttons, cupro lining, unstructured shoulders, and deep welt pockets designed for both elegance and functional ease.',
        shortDescription: 'Double-faced virgin wool overcoat with horn buttons and structured silhouette.',
        category: catMap.get('mens-fashion'),
        brand: brandMap.get('aethelgard-studio'),
        images: [
          { url: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=85', alt: 'Charcoal Wool Overcoat Front', isMain: true },
          { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85', alt: 'Model wearing Charcoal Overcoat' },
          { url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1000&q=85', alt: 'Fabric texture closeup' },
        ],
        price: 18999.0,
        compareAtPrice: 24999.0,
        costPrice: 8500.0,
        sku: 'OVC-WOL-001',
        stock: 24,
        lowStockThreshold: 4,
        variants: [
          { sku: 'OVC-WOL-001-S-BLK', price: 18999.0, stock: 8, images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'S', color: 'Onyx Black', colorHex: '#111827' } },
          { sku: 'OVC-WOL-001-M-BLK', price: 18999.0, stock: 10, images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'M', color: 'Onyx Black', colorHex: '#111827' } },
          { sku: 'OVC-WOL-001-L-CAM', price: 19999.0, stock: 6, images: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'L', color: 'Camel Brown', colorHex: '#92400e' } },
        ],
        attributes: {
          size: ['S', 'M', 'L', 'XL'],
          color: ['Onyx Black', 'Camel Brown', 'Slate Grey'],
          material: ['100% Virgin Wool', 'Cupro Lining'],
        },
        tags: ['coat', 'outerwear', 'wool', 'menswear', 'luxury'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.9,
        reviewCount: 42,
        isActive: true,
      },
      {
        name: 'Apex Studio Wireless ANC Headphones',
        slug: 'apex-studio-wireless-anc-headphones',
        description:
          'Experience spatial acoustics through 45mm custom beryllium dynamic drivers. Features active noise cancellation with transparency mode, 40 hours of continuous playback, aircraft-grade aluminum hinges, and plush lambskin memory foam ear cushions.',
        shortDescription: 'Custom 45mm dynamic drivers, hybrid ANC, 40h battery, beryllium soundstage.',
        category: catMap.get('electronics'),
        brand: brandMap.get('apex-audio'),
        images: [
          { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85', alt: 'Black Studio ANC Headphones', isMain: true },
          { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=85', alt: 'Headphones angle' },
          { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=85', alt: 'Headphones with audio cable' },
        ],
        price: 14999.0,
        compareAtPrice: 19999.0,
        costPrice: 6500.0,
        sku: 'AUD-ANC-002',
        stock: 45,
        lowStockThreshold: 5,
        variants: [
          { sku: 'AUD-ANC-002-BLK', price: 14999.0, stock: 25, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'Matte Obsidian', colorHex: '#18181b' } },
          { sku: 'AUD-ANC-002-SIL', price: 15999.0, stock: 20, images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'Brushed Silver', colorHex: '#cbd5e1' } },
        ],
        attributes: {
          color: ['Matte Obsidian', 'Brushed Silver'],
          connectivity: ['Bluetooth 5.3', '3.5mm Hi-Res Jack', 'USB-C Lossless'],
        },
        tags: ['audio', 'headphones', 'wireless', 'anc', 'gadget'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 4.8,
        reviewCount: 68,
        isActive: true,
      },
      {
        name: 'Heritage Full-Grain Leather Weekender',
        slug: 'heritage-full-grain-leather-weekender',
        description:
          'Handmade from vegetable-tanned Tuscan full-grain leather that deepens in patina over decades of journeying. Features solid brass YKK Excella zippers, reinforced riveted leather handles, an interior laptop sleeve, and a separate shoe compartment.',
        shortDescription: 'Vegetable-tanned Tuscan full-grain leather travel bag with solid brass hardware.',
        category: catMap.get('accessories'),
        brand: brandMap.get('nomad-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85', alt: 'Leather Weekender Duffle', isMain: true },
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85', alt: 'Side view leather bag' },
        ],
        price: 12499.0,
        compareAtPrice: 16999.0,
        costPrice: 5500.0,
        sku: 'BAG-LHR-003',
        stock: 18,
        lowStockThreshold: 3,
        variants: [
          { sku: 'BAG-LHR-003-BRN', price: 12499.0, stock: 10, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'Cognac Brown', colorHex: '#78350f' } },
          { sku: 'BAG-LHR-003-BLK', price: 12499.0, stock: 8, images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'Espresso Black', colorHex: '#18181b' } },
        ],
        attributes: {
          color: ['Cognac Brown', 'Espresso Black'],
          capacity: ['42 Liters'],
        },
        tags: ['leather', 'bag', 'travel', 'weekender', 'accessories'],
        featured: true,
        bestSeller: false,
        newArrival: true,
        rating: 4.9,
        reviewCount: 31,
        isActive: true,
      },
      {
        name: 'Artisan Chelsea Leather Boots',
        slug: 'artisan-chelsea-leather-boots',
        description:
          'Goodyear-welted Chelsea boots handcrafted by master cobblers. Crafted using French calfskin leather with elasticated side gussets, stacked leather heels with Vibram rubber inserts, and cork-filled footbeds that mold to your foot contours.',
        shortDescription: 'Goodyear welted French calfskin Chelsea boots with Vibram rubber heels.',
        category: catMap.get('footwear'),
        brand: brandMap.get('nomad-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85', alt: 'Chelsea Boot Studio Shot', isMain: true },
          { url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1000&q=85', alt: 'Boots Pair' },
        ],
        price: 9999.0,
        compareAtPrice: 12999.0,
        costPrice: 4500.0,
        sku: 'FTW-CHS-004',
        stock: 32,
        lowStockThreshold: 4,
        variants: [
          { sku: 'FTW-CHS-004-41', price: 9999.0, stock: 8, images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'UK 7 / EU 41', color: 'Chestnut', colorHex: '#451a03' } },
          { sku: 'FTW-CHS-004-42', price: 9999.0, stock: 12, images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'UK 8 / EU 42', color: 'Chestnut', colorHex: '#451a03' } },
          { sku: 'FTW-CHS-004-43', price: 9999.0, stock: 12, images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'UK 9 / EU 43', color: 'Chestnut', colorHex: '#451a03' } },
        ],
        attributes: {
          size: ['UK 7 / EU 41', 'UK 8 / EU 42', 'UK 9 / EU 43', 'UK 10 / EU 44'],
          color: ['Chestnut', 'Black Onyx'],
        },
        tags: ['boots', 'footwear', 'chelsea', 'leather', 'shoes'],
        featured: false,
        bestSeller: true,
        newArrival: false,
        rating: 4.7,
        reviewCount: 54,
        isActive: true,
      },
      {
        name: 'Sculptural Ceramic Pour-Over & Kettle Set',
        slug: 'sculptural-ceramic-pour-over-kettle-set',
        description:
          'Wheel-thrown unglazed stoneware exterior paired with a food-safe silky glazed interior. Designed for the discerning coffee ritualist with optimized 60-degree conic interior ribs for uniform extraction and heat retention.',
        shortDescription: 'Unglazed artisanal stoneware pour-over dripper and matching carafe.',
        category: catMap.get('home-living'),
        brand: brandMap.get('lumina-living'),
        images: [
          { url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=85', alt: 'Artisan Ceramic Coffee Carafe', isMain: true },
          { url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85', alt: 'Pouring Coffee in Ceramic Cup' },
        ],
        price: 3499.0,
        compareAtPrice: 4499.0,
        costPrice: 1200.0,
        sku: 'HOM-CER-005',
        stock: 28,
        lowStockThreshold: 5,
        variants: [
          { sku: 'HOM-CER-005-WHT', price: 3499.0, stock: 15, images: ['https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'Sand Dune', colorHex: '#e7e5e4' } },
          { sku: 'HOM-CER-005-CHR', price: 3499.0, stock: 13, images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'Basalt Grey', colorHex: '#475569' } },
        ],
        attributes: {
          color: ['Sand Dune', 'Basalt Grey'],
          volume: ['650 ml'],
        },
        tags: ['home', 'coffee', 'ceramics', 'kitchen', 'minimalist'],
        featured: false,
        bestSeller: true,
        newArrival: true,
        rating: 4.8,
        reviewCount: 29,
        isActive: true,
      },
      {
        name: 'Monochrome Chronograph Wristwatch',
        slug: 'monochrome-chronograph-wristwatch',
        description:
          'Swiss Ronda quartz movement housed in a surgical-grade 316L brushed stainless steel 40mm case. Features domed sapphire crystal glass with anti-reflective coating, quick-release Italian suede strap, and 5ATM water resistance.',
        shortDescription: '316L steel 40mm case, sapphire crystal, and Swiss Ronda movement.',
        category: catMap.get('accessories'),
        brand: brandMap.get('nomad-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85', alt: 'Minimalist Watch Face', isMain: true },
          { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=85', alt: 'Watch on Wrist' },
        ],
        price: 21999.0,
        compareAtPrice: 28999.0,
        costPrice: 9500.0,
        sku: 'ACC-WAT-006',
        stock: 20,
        lowStockThreshold: 3,
        variants: [
          { sku: 'ACC-WAT-006-SLV', price: 21999.0, stock: 12, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'Silver / White Dial', colorHex: '#e2e8f0' } },
          { sku: 'ACC-WAT-006-BLK', price: 22999.0, stock: 8, images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=85'], attributes: { color: 'All Black PVD', colorHex: '#0f172a' } },
        ],
        attributes: {
          color: ['Silver / White Dial', 'All Black PVD'],
          strap: ['Italian Suede', 'Stainless Steel Mesh'],
        },
        tags: ['watch', 'horology', 'accessories', 'minimalist'],
        featured: true,
        bestSeller: false,
        newArrival: true,
        rating: 4.9,
        reviewCount: 38,
        isActive: true,
      },
      {
        name: 'Pure Cashmere Relaxed Crewneck',
        slug: 'pure-cashmere-relaxed-crewneck',
        description:
          'Spun from Grade-A Mongolian cashmere fibers, this crewneck is lightweight yet exceptionally insulating. Ribbed trims at the collar, cuffs, and hem ensure it retains shape through years of wear.',
        shortDescription: '100% Grade-A Mongolian 2-ply cashmere crewneck knit.',
        category: catMap.get('womens-fashion'),
        brand: brandMap.get('aethelgard-studio'),
        images: [
          { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85', alt: 'Cashmere Knit Sweater', isMain: true },
          { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=85', alt: 'Knit fabric texture' },
        ],
        price: 8999.0,
        compareAtPrice: 11999.0,
        costPrice: 3800.0,
        sku: 'WCL-CSH-007',
        stock: 35,
        lowStockThreshold: 5,
        variants: [
          { sku: 'WCL-CSH-007-S-OAT', price: 8999.0, stock: 12, images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'S', color: 'Oatmeal Heather', colorHex: '#d6d3d1' } },
          { sku: 'WCL-CSH-007-M-OAT', price: 8999.0, stock: 15, images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'M', color: 'Oatmeal Heather', colorHex: '#d6d3d1' } },
          { sku: 'WCL-CSH-007-L-CHR', price: 8999.0, stock: 8, images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=85'], attributes: { size: 'L', color: 'Charcoal Melange', colorHex: '#334155' } },
        ],
        attributes: {
          size: ['XS', 'S', 'M', 'L'],
          color: ['Oatmeal Heather', 'Charcoal Melange'],
        },
        tags: ['sweater', 'cashmere', 'knitwear', 'womenswear'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 4.9,
        reviewCount: 52,
        isActive: true,
      },
      {
        name: 'Acoustic Studio Ambient Desk Lamp',
        slug: 'acoustic-studio-ambient-desk-lamp',
        description:
          'Precision CNC-machined brass stem resting upon a solid Carrara marble base. Features warm dimmable LED chips (2200K - 3000K) controlled by a touch-capacitive knurled dial.',
        shortDescription: 'Solid Carrara marble base and brushed brass LED ambient lamp.',
        category: catMap.get('home-living'),
        brand: brandMap.get('lumina-living'),
        images: [
          { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85', alt: 'Modernist Table Lamp', isMain: true },
          { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=85', alt: 'Lamp in Interior Room' },
        ],
        price: 6499.0,
        compareAtPrice: 8499.0,
        costPrice: 2800.0,
        sku: 'HOM-LMP-008',
        stock: 15,
        lowStockThreshold: 3,
        variants: [
          { sku: 'HOM-LMP-008-BRS', price: 6499.0, stock: 10, images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85'], attributes: { finish: 'Brushed Brass', colorHex: '#d97706' } },
          { sku: 'HOM-LMP-008-BLK', price: 6499.0, stock: 5, images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=85'], attributes: { finish: 'Matte Anodized Black', colorHex: '#09090b' } },
        ],
        attributes: {
          finish: ['Brushed Brass', 'Matte Anodized Black'],
        },
        tags: ['lamp', 'lighting', 'interior', 'marble', 'minimalist'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.8,
        reviewCount: 19,
        isActive: true,
      },
    ];

    const products = await Product.create(rawProducts);
    console.log(`[Seed] Successfully created ${products.length} products.`);

    // 5. Create Coupons in Indian Rupees (₹)
    console.log('[Seed] Creating promotional coupons with INR thresholds...');
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(now.getMonth() + 6);

    await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrderAmount: 999,
        maximumDiscount: 1000,
        startDate: now,
        expiryDate: futureDate,
        usageLimit: 1000,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'FIRST500',
        discountType: 'fixed',
        discountValue: 500,
        minimumOrderAmount: 2499,
        startDate: now,
        expiryDate: futureDate,
        usageLimit: 500,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'FESTIVE20',
        discountType: 'percentage',
        discountValue: 20,
        minimumOrderAmount: 4999,
        maximumDiscount: 2500,
        startDate: now,
        expiryDate: futureDate,
        usageLimit: 500,
        perUserLimit: 2,
        isActive: true,
      },
    ]);

    // 6. Create Verified Reviews
    console.log('[Seed] Creating verified customer reviews...');
    await Review.create([
      {
        product: products[0]._id,
        user: customer._id,
        rating: 5,
        title: 'Outstanding tailoring and premium fabric weight',
        comment:
          'The wool drape is magnificent. Unstructured yet holds its shape effortlessly. Wore it during travel to Himachal and kept me wonderfully warm. True Indian luxury craftsmanship.',
        images: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=400&q=80'],
        isVerifiedPurchase: true,
        helpfulVotes: 14,
      },
      {
        product: products[1]._id,
        user: customer._id,
        rating: 5,
        title: 'Studio level fidelity with superb ANC',
        comment:
          'Far exceeds expectations compared to generic plastic consumer headphones. Soundstage is airy and wide with natural instrument separation. Memory foam cups are pure luxury.',
        images: [],
        isVerifiedPurchase: true,
        helpfulVotes: 9,
      },
    ]);

    // 7. Create Demo Orders in INR with Indian Addresses
    console.log('[Seed] Creating demo Indian orders for dashboard metrics...');
    const order1Items = [
      {
        product: products[1]._id,
        name: products[1].name,
        image: products[1].images[0]?.url || '',
        price: products[1].price,
        quantity: 1,
        sku: products[1].sku,
        attributes: { color: 'Matte Obsidian' },
      },
    ];
    const order1Subtotal = 14999;
    const order1Tax = Math.round(order1Subtotal * 0.18 * 100) / 100;
    const order1Total = order1Subtotal + order1Tax;

    await Order.create({
      orderNumber: 'ORD-20260919-8921',
      user: customer._id,
      items: order1Items,
      shippingAddress: {
        fullName: 'Sophia Chen',
        phone: '+91 91234 56789',
        addressLine1: 'Flat 402, Signature Towers, Indiranagar',
        addressLine2: '100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
      },
      subtotal: order1Subtotal,
      discount: 0,
      shippingFee: 0,
      tax: order1Tax,
      total: order1Total,
      paymentMethod: 'stripe',
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      trackingNumber: 'BLUEDART-5592810',
      timeline: [
        {
          status: 'Pending',
          timestamp: new Date(Date.now() - 3600000 * 24),
          note: 'Order placed via UPI / Card',
        },
        {
          status: 'Confirmed',
          timestamp: new Date(Date.now() - 3600000 * 20),
          note: 'Payment verified via Stripe INR',
        },
        {
          status: 'Processing',
          timestamp: new Date(Date.now() - 3600000 * 4),
          note: 'Package prepared at Bengaluru Fulfillment Hub',
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 24),
    });

    const order2Items = [
      {
        product: products[4]._id,
        name: products[4].name,
        image: products[4].images[0]?.url || '',
        price: products[4].price,
        quantity: 1,
        sku: products[4].sku,
        attributes: { color: 'Sand Dune' },
      },
    ];
    const order2Subtotal = 3499;
    const order2Discount = 349.9; // 10% WELCOME10
    const order2Discounted = order2Subtotal - order2Discount;
    const order2Tax = Math.round(order2Discounted * 0.18 * 100) / 100;
    const order2Total = Math.round((order2Discounted + order2Tax) * 100) / 100;

    await Order.create({
      orderNumber: 'ORD-20260918-3419',
      user: customer._id,
      items: order2Items,
      shippingAddress: {
        fullName: 'Sophia Chen',
        phone: '+91 91234 56789',
        addressLine1: 'Flat 402, Signature Towers, Indiranagar',
        addressLine2: '100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
      },
      subtotal: order2Subtotal,
      discount: order2Discount,
      couponCode: 'WELCOME10',
      shippingFee: 0,
      tax: order2Tax,
      total: order2Total,
      paymentMethod: 'stripe',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      trackingNumber: 'DELHIVERY-9948211',
      timeline: [
        {
          status: 'Confirmed',
          timestamp: new Date(Date.now() - 3600000 * 48),
          note: 'Payment verified',
        },
        {
          status: 'Shipped',
          timestamp: new Date(Date.now() - 3600000 * 36),
          note: 'Dispatched via Delhivery Express',
        },
        {
          status: 'Delivered',
          timestamp: new Date(Date.now() - 3600000 * 12),
          note: 'Delivered to recipient in Indiranagar, Bengaluru',
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 48),
    });

    console.log('=============================================');
    console.log('  Database Seeding Completed Successfully!   ');
    console.log('  Currency: Indian Rupee (₹ / INR)          ');
    console.log('  Admin:    admin@ecommerce.com / Admin@123456');
    console.log('  Customer: customer@ecommerce.com / Customer@123456');
    console.log('  Coupons:  WELCOME10, FIRST500, FESTIVE20    ');
    console.log('=============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
