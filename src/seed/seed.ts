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
      firstName: 'Alaguraj',
      lastName: 'Admin',
      email: 'admin@ecommerce.com',
      phone: '+91 93619 23406',
      password: 'Admin@123456',
      role: 'admin',
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });

    const customer = await User.create({
      firstName: 'Preethi',
      lastName: 'Sundaram',
      email: 'customer@ecommerce.com',
      phone: '+91 99525 37388',
      password: 'Customer@123456',
      role: 'customer',
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    });

    // 2. Create Categories (Matching Sculpted.in)
    console.log('[Seed] Creating categories...');
    const categories = await Category.create([
      {
        name: 'Lehenga & Half Saree',
        slug: 'lehenga-half-saree',
        description: 'Handcrafted bridal and occasion lehengas, pure zari half sarees, and bespoke flared sets.',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Sarees',
        slug: 'saree',
        description: 'Exquisite Kanjeevarams, handwoven Chanderi silks, lightweight organza, and festive drapes.',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Maxi Cotton',
        slug: 'maxi-cotton',
        description: 'Breathable pure mulmul cotton tiered maxi dresses, day gowns, and comfort-first silhouettes.',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Classy Casuals',
        slug: 'classy-casuals',
        description: 'Elevated everyday ethnic co-ords, fusion tunics, and modern artisanal workwear.',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Festive Edit',
        slug: 'festive-edit',
        description: 'Celebratory jewel-toned anarkalis, festive shararas, and occasion wear with intricate embroidery.',
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
      {
        name: 'Comfy Cotton',
        slug: 'comfy-cotton',
        description: 'Hand-block printed cotton kurtis, breezy suits, and effortless relaxed-fit ensembles.',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
        isActive: true,
      },
    ]);

    const catMap = new Map(categories.map((c) => [c.slug, c._id]));

    // 3. Create Brands / Studio Labels
    console.log('[Seed] Creating studio brands...');
    const brands = await Brand.create([
      {
        name: 'Sculpted Atelier',
        slug: 'sculpted-atelier',
        description: 'Flagship bespoke ethnic couture and made-to-measure masterpieces.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Effidoo Couture',
        slug: 'effidoo-couture',
        description: 'Modern silhouettes honoring traditional Indian weaving legacies.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Preethika Heritage',
        slug: 'preethika-heritage',
        description: 'Handloom Kanjeevarams, antique gold zari borders, and heirloom half-sarees.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Zari & Bloom',
        slug: 'zari-bloom',
        description: 'Fresh floral hand-block prints, pure mulmul, and breezy cotton craftsmanship.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
    ]);

    const brandMap = new Map(brands.map((b) => [b.slug, b._id]));

    // Helper to generate 12 standard sizes like Sculpted.in
    const standardSizes = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'Custom'];
    const createSizesVariants = (baseSku: string, basePrice: number, stockPerSize = 8) => {
      return standardSizes.map((size) => ({
        sku: `${baseSku}-${size}`,
        price: ['3XL', '4XL', '5XL', 'Custom'].includes(size) ? basePrice + 350 : basePrice,
        stock: stockPerSize,
        images: [],
        attributes: { size },
      }));
    };

    // 4. Create Rich Ethnic Fashion Products with INR Pricing
    console.log('[Seed] Creating ethnic fashion products...');
    const rawProducts = [
      {
        name: '4 in 1 Dreamy Layers Purple & Wine Maxi Anarkali SC091',
        slug: '4-in-1-dreamy-layers-purple-and-wine-sc091',
        description:
          'Our signature multi-way convertible outfit designed to be styled as a regal Flared Maxi, an Anarkali Gown, or layered with festive dupattas. Tailored from featherlight pure georgette with tiered cascading frills, hand-crafted bodice, and delicate wine ombre accents. Fully customizable necklines and heights available.',
        shortDescription: 'Signature 4-in-1 convertible purple & wine layered maxi anarkali in pure georgette.',
        category: catMap.get('maxi-cotton'),
        brand: brandMap.get('sculpted-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Purple and Wine Dreamy Layers Front', isMain: true },
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85', alt: 'Flowing Maxi Hem Detail' },
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Bodice Craftsmanship Detail' },
        ],
        price: 4650,
        compareAtPrice: 5950,
        costPrice: 2200,
        sku: 'SC091',
        stock: 55,
        variants: createSizesVariants('SC091', 4650),
        tags: ['Best Seller', 'Multi-Way', 'Georgette', 'Party Wear', 'Customizable'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.9,
        reviewCount: 48,
        isActive: true,
      },
      {
        name: 'Royal Wine & Gold Zari Handloom Half Saree Set SC104',
        slug: 'royal-wine-gold-zari-handloom-half-saree-sc104',
        description:
          'A tribute to timeless South Indian heritage. Woven with rich mulberry silk in an opulent wine palette, accented by 3-inch pure antique gold zari borders on the pleated lehenga skirt. Includes an intricately embroidered raw silk blouse and a lightweight contrasting zari dhavani dupatta.',
        shortDescription: 'Heirloom handloom half saree set featuring gold zari borders and embroidered blouse.',
        category: catMap.get('lehenga-half-saree'),
        brand: brandMap.get('preethika-heritage'),
        images: [
          { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85', alt: 'Wine and Gold Half Saree Front', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Zari Border Detail' },
          { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=85', alt: 'Model Drape View' },
        ],
        price: 6850,
        compareAtPrice: 8499,
        costPrice: 3400,
        sku: 'SC104',
        stock: 32,
        variants: createSizesVariants('SC104', 6850),
        tags: ['Bridal', 'Half Saree', 'Handloom', 'Silk', 'Best Seller'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 5.0,
        reviewCount: 36,
        isActive: true,
      },
      {
        name: 'Emerald Bloom Pure Georgette Flared Lehenga SC112',
        slug: 'emerald-bloom-pure-georgette-flared-lehenga-sc112',
        description:
          'A show-stopping emerald green flared lehenga adorned with subtle mirror work, sequin embroidery, and an 8-meter circular flair. Comes complete with double lining, built-in can-can support options, and a sweetheart neck designer blouse.',
        shortDescription: '8-meter flair pure georgette emerald lehenga with sequin & mirror accents.',
        category: catMap.get('lehenga-half-saree'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Emerald Green Flared Lehenga', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Embroidery Detail' },
        ],
        price: 7950,
        compareAtPrice: 9999,
        costPrice: 3900,
        sku: 'SC112',
        stock: 24,
        variants: createSizesVariants('SC112', 7950),
        tags: ['New Arrival', 'Lehenga', 'Emerald', 'Party Wear'],
        featured: true,
        bestSeller: false,
        newArrival: true,
        rating: 4.8,
        reviewCount: 19,
        isActive: true,
      },
      {
        name: 'Mulmul Hand-Block Floral Tiered Cotton Maxi Dress SC045',
        slug: 'mulmul-hand-block-floral-tiered-cotton-maxi-sc045',
        description:
          'Crafted from 100% fine Rajasthan mulmul cotton. Hand-block printed using natural azo-free dyes. Features tiered gathers, breathable soft inner lining, elbow-length flutter sleeves, and practical deep side pockets. Effortless summer dressing with an artisan soul.',
        shortDescription: '100% pure mulmul tiered cotton maxi with hand-block botanical prints.',
        category: catMap.get('maxi-cotton'),
        brand: brandMap.get('zari-bloom'),
        images: [
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85', alt: 'Floral Tiered Mulmul Maxi', isMain: true },
          { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85', alt: 'Soft Cotton Fabric Detail' },
        ],
        price: 2850,
        compareAtPrice: 3650,
        costPrice: 1200,
        sku: 'SC045',
        stock: 60,
        variants: createSizesVariants('SC045', 2850),
        tags: ['Mulmul Cotton', 'Hand Block', 'Pockets', 'Everyday Comfort', 'Best Seller'],
        featured: false,
        bestSeller: true,
        newArrival: false,
        rating: 4.9,
        reviewCount: 52,
        isActive: true,
      },
      {
        name: 'Kanjeevaram Woven Border Temple Motif Silk Saree SC201',
        slug: 'kanjeevaram-woven-border-temple-motif-silk-saree-sc201',
        description:
          'An authentic tribute to traditional Tamil craftsmanship. Woven with pure silk threads and featuring intricate temple border motifs (korvai technique). Features a grand contrast zari pallu with peacock and floral buttis, paired with an unstitched contrast silk blouse piece.',
        shortDescription: 'Pure silk Kanjeevaram saree with temple korvai border and zari pallu.',
        category: catMap.get('saree'),
        brand: brandMap.get('preethika-heritage'),
        images: [
          { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85', alt: 'Kanjeevaram Temple Border Saree', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Pallu Zari Weave' },
        ],
        price: 5450,
        compareAtPrice: 6990,
        costPrice: 2800,
        sku: 'SC201',
        stock: 18,
        variants: [{ sku: 'SC201-FREE', price: 5450, stock: 18, images: [], attributes: { size: 'Free Size (6.3m with blouse)' } }],
        tags: ['Saree', 'Kanjeevaram', 'Silk', 'Festive', 'Traditional'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 5.0,
        reviewCount: 29,
        isActive: true,
      },
      {
        name: 'Pastel Lilac Embroidered Organza Saree SC215',
        slug: 'pastel-lilac-embroidered-organza-saree-sc215',
        description:
          'Ethereal and ultra-lightweight organza in soothing lilac, embellished with cut-work scalloped borders and hand-stitched floral threadwork. Drapes with modern grace for summer weddings, receptions, and festive day soirees.',
        shortDescription: 'Lightweight pastel lilac organza saree with scalloped embroidered borders.',
        category: catMap.get('saree'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=85', alt: 'Pastel Lilac Organza Saree', isMain: true },
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Scallop Border Closeup' },
        ],
        price: 3990,
        compareAtPrice: 4990,
        costPrice: 1900,
        sku: 'SC215',
        stock: 28,
        variants: [{ sku: 'SC215-FREE', price: 3990, stock: 28, images: [], attributes: { size: 'Free Size (6.3m with blouse)' } }],
        tags: ['Organza', 'Pastel', 'Modern Saree', 'New Arrival'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.7,
        reviewCount: 15,
        isActive: true,
      },
      {
        name: 'Crimson Heritage Tiered Cotton Flared Maxi SC078',
        slug: 'crimson-heritage-tiered-cotton-flared-maxi-sc078',
        description:
          'Deep crimson red cotton tiered dress accented with delicate gota patti lace on the sleeves and neckline. Features a high waist elasticated back for a flattering bespoke silhouette that moves beautifully.',
        shortDescription: 'Tiered crimson flared cotton maxi with subtle gota patti border embellishments.',
        category: catMap.get('classy-casuals'),
        brand: brandMap.get('zari-bloom'),
        images: [
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85', alt: 'Crimson Heritage Flared Maxi', isMain: true },
          { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85', alt: 'Gota Lace Work' },
        ],
        price: 3250,
        compareAtPrice: 4150,
        costPrice: 1450,
        sku: 'SC078',
        stock: 40,
        variants: createSizesVariants('SC078', 3250),
        tags: ['Cotton', 'Classy Casuals', 'Gota Patti', 'Maxi'],
        featured: false,
        bestSeller: true,
        newArrival: false,
        rating: 4.8,
        reviewCount: 31,
        isActive: true,
      },
      {
        name: 'Peacock Blue Banarasi Brocade Bridal Lehenga SC305',
        slug: 'peacock-blue-banarasi-brocade-bridal-lehenga-sc305',
        description:
          'A royal masterpiece woven in Varanasi. Rich peacock blue brocade lehenga skirt featuring kadwa weave jaal work in warm antique gold. Accompanied by a heavy zardozi embroidered blouse and a sheer organza dupatta with scalloped borders.',
        shortDescription: 'Regal peacock blue Banarasi brocade lehenga with antique gold zari work.',
        category: catMap.get('lehenga-half-saree'),
        brand: brandMap.get('sculpted-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Banarasi Brocade Lehenga', isMain: true },
          { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85', alt: 'Gold Brocade Pattern Closeup' },
        ],
        price: 9450,
        compareAtPrice: 12500,
        costPrice: 4900,
        sku: 'SC305',
        stock: 15,
        variants: createSizesVariants('SC305', 9450),
        tags: ['Bridal', 'Banarasi', 'Brocade', 'Royal', 'Featured'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 5.0,
        reviewCount: 22,
        isActive: true,
      },
      {
        name: 'Sunlit Ochre Haldi Anarkali Suit with Dupatta SC099',
        slug: 'sunlit-ochre-haldi-anarkali-suit-sc099',
        description:
          'Radiant ochre yellow anarkali suit tailor-made for Haldi and Mehendi rituals. Features hand-embroidered mirrorwork on the yoke, flared kalis in flowy georgette, and a matching bandhani print dupatta with tassel accents.',
        shortDescription: 'Festive ochre yellow mirrorwork anarkali suit with bandhani dupatta.',
        category: catMap.get('festive-edit'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=85', alt: 'Ochre Haldi Anarkali Front', isMain: true },
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Mirror Yoke Detail' },
        ],
        price: 4200,
        compareAtPrice: 5200,
        costPrice: 2000,
        sku: 'SC099',
        stock: 35,
        variants: createSizesVariants('SC099', 4200),
        tags: ['Haldi', 'Mehendi', 'Anarkali', 'Festive', 'New Arrival'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.9,
        reviewCount: 18,
        isActive: true,
      },
      {
        name: 'Vintage Rose Chanderi Silk Saree with Zari Pallu SC230',
        slug: 'vintage-rose-chanderi-silk-saree-sc230',
        description:
          'Breezy, lustrous handloom Chanderi silk in a romantic vintage rose tint. Features delicate gold zari tissue pallu and floral buttis hand-woven across the body. Featherlight weight with a subtle festive sheen.',
        shortDescription: 'Lustrous vintage rose Chanderi silk saree with gold tissue pallu.',
        category: catMap.get('saree'),
        brand: brandMap.get('preethika-heritage'),
        images: [
          { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85', alt: 'Chanderi Saree in Rose Tint', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Zari Tissue Detail' },
        ],
        price: 4850,
        compareAtPrice: 5999,
        costPrice: 2400,
        sku: 'SC230',
        stock: 22,
        variants: [{ sku: 'SC230-FREE', price: 4850, stock: 22, images: [], attributes: { size: 'Free Size (6.3m with blouse)' } }],
        tags: ['Chanderi', 'Handloom', 'Silk Saree', 'Pastel Elegance'],
        featured: true,
        bestSeller: false,
        newArrival: false,
        rating: 4.8,
        reviewCount: 27,
        isActive: true,
      },
      {
        name: 'Midnight Navy Velvet Cocktail Half Saree SC118',
        slug: 'midnight-navy-velvet-cocktail-half-saree-sc118',
        description:
          'Rich midnight navy micro-velvet blouse paired with a metallic pleated shimmer skirt and pre-pleated drape dhavani. Modern, glamorous, and structured for wedding receptions and evening sangeets.',
        shortDescription: 'Modern velvet & metallic shimmer cocktail half saree ensemble.',
        category: catMap.get('lehenga-half-saree'),
        brand: brandMap.get('sculpted-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Midnight Navy Velvet Set', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Metallic Shimmer Skirt Detail' },
        ],
        price: 7250,
        compareAtPrice: 8990,
        costPrice: 3600,
        sku: 'SC118',
        stock: 19,
        variants: createSizesVariants('SC118', 7250),
        tags: ['Velvet', 'Cocktail', 'Half Saree', 'Sangeet'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.9,
        reviewCount: 14,
        isActive: true,
      },
      {
        name: 'Ivory & Gold Pearl Embellished Festive Kurti Set SC062',
        slug: 'ivory-gold-pearl-embellished-festive-kurti-sc062',
        description:
          'Pure handwoven cotton silk straight kurti in ivory, finished with pearl neck embroidery, matching straight pants, and a gold foil printed chiffon dupatta. Comfortable elegance for family poojas and intimate gatherings.',
        shortDescription: 'Ivory cotton silk kurti set with delicate pearl hand embroidery.',
        category: catMap.get('comfy-cotton'),
        brand: brandMap.get('zari-bloom'),
        images: [
          { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85', alt: 'Ivory Pearl Kurti Set', isMain: true },
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85', alt: 'Pearl Work Closeup' },
        ],
        price: 3600,
        compareAtPrice: 4500,
        costPrice: 1700,
        sku: 'SC062',
        stock: 45,
        variants: createSizesVariants('SC062', 3600),
        tags: ['Cotton Silk', 'Pearl Work', 'Ivory', 'Comfy Cotton', 'Festive'],
        featured: false,
        bestSeller: true,
        newArrival: false,
        rating: 4.8,
        reviewCount: 38,
        isActive: true,
      },
    ];

    const products = await Product.create(rawProducts);

    // 5. Create Promotional Coupons
    console.log('[Seed] Creating promotional coupons...');
    const now = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(now.getFullYear() + 2);

    await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrderAmount: 999,
        maximumDiscount: 1500,
        startDate: now,
        expiryDate: futureDate,
        usageLimit: 10000,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'SCULPTED20',
        discountType: 'percentage',
        discountValue: 20,
        minimumOrderAmount: 4999,
        maximumDiscount: 3000,
        startDate: now,
        expiryDate: futureDate,
        usageLimit: 500,
        perUserLimit: 2,
        isActive: true,
      },
      {
        code: 'FREESHIP',
        discountType: 'fixed',
        discountValue: 200,
        minimumOrderAmount: 1499,
        maximumDiscount: 200,
        startDate: now,
        expiryDate: futureDate,
        usageLimit: 2000,
        perUserLimit: 3,
        isActive: true,
      },
    ]);

    // 6. Create Verified Customer Reviews
    console.log('[Seed] Creating verified customer reviews...');
    await Review.create([
      {
        product: products[0]._id,
        user: customer._id,
        rating: 5,
        title: 'The fit is absolutely magical! 4 in 1 layers are incredible',
        comment:
          'I ordered this for my sister’s engagement reception. The custom height option was spot on — no alterations needed at all! The georgette fabric is soft, fluid, and very light to wear all evening. Will definitely purchase again!',
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80'],
        isVerifiedPurchase: true,
        helpfulVotes: 28,
      },
      {
        product: products[1]._id,
        user: customer._id,
        rating: 5,
        title: 'Pure traditional elegance, stunning zari work',
        comment:
          'The wine color with real antique gold border looks 10x richer in person than in pictures. The dhavani pleats beautifully. Express shipping arrived in Chennai in just 3 days.',
        images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80'],
        isVerifiedPurchase: true,
        helpfulVotes: 19,
      },
    ]);

    // 7. Create Demo Indian Orders for Admin Metrics
    console.log('[Seed] Creating demo Indian orders...');
    const order1Items = [
      {
        product: products[0]._id,
        name: products[0].name,
        image: products[0].images[0]?.url || '',
        price: products[0].price,
        quantity: 1,
        sku: 'SC091-M',
        attributes: { size: 'M', height: "5'4\"", neckDesign: 'Sweet Heart', addOns: ['Can Can (+₹650)'] },
      },
    ];
    const order1Subtotal = 4650 + 650;
    const order1Tax = Math.round(order1Subtotal * 0.05 * 100) / 100;
    const order1Total = order1Subtotal + order1Tax;

    await Order.create({
      orderNumber: 'ORD-20260924-1042',
      user: customer._id,
      items: order1Items,
      shippingAddress: {
        fullName: 'Preethi Sundaram',
        phone: '+91 99525 37388',
        addressLine1: 'No. 42, Anna Nagar 2nd Avenue',
        addressLine2: 'Near Roundtana',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600040',
        country: 'India',
      },
      subtotal: order1Subtotal,
      discount: 0,
      shippingFee: 0,
      tax: order1Tax,
      total: order1Total,
      paymentMethod: 'UPI / PayU',
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      trackingNumber: 'DELHIVERY-7749219',
      notes: 'Custom height 5\'4" with Sweetheart neckline and added Can Can for evening flare.',
      timeline: [
        {
          status: 'Pending',
          timestamp: new Date(Date.now() - 3600000 * 20),
          note: 'Order placed via UPI',
        },
        {
          status: 'Confirmed',
          timestamp: new Date(Date.now() - 3600000 * 18),
          note: 'Payment verified and measurements reviewed by master tailor',
        },
        {
          status: 'Processing',
          timestamp: new Date(Date.now() - 3600000 * 6),
          note: 'Pattern cut and custom Can Can stitching in progress at Atelier',
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 20),
    });

    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
