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

    // 1. Create Demo Users
    console.log('[Seed] Creating demo users...');
    const admin = await User.create({
      firstName: 'Alaguraj',
      lastName: 'Admin',
      email: 'admin@ecommerce.com',
      phone: '+91 78712 07631',
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

    // 2. Create the Featured Categories matching NALMARA FASHION Design
    console.log('[Seed] Creating categories...');
    const categories = await Category.create([
      {
        name: 'Sarees',
        slug: 'sarees',
        description: 'Exquisite silk, organza, and festive handloom sarees woven with pure zari.',
        image: '/images/nalmara/category_sarees_stack.jpg',
        isActive: true,
      },
      {
        name: 'Semi Kanchivaram',
        slug: 'semi-kanchivaram',
        description: 'Regal semi Kanchivaram silk sarees with rich golden pallus and radiant zari borders.',
        image: '/images/nalmara/category_semi_kanchivaram.jpg',
        isActive: true,
      },
      {
        name: 'Cotton Sarees',
        slug: 'cotton-sarees',
        description: 'Authentic pure cotton, Chettinadu, and lightweight handloom weaves for effortless elegance.',
        image: '/images/nalmara/cotton_saree_stack.jpg',
        isActive: true,
      },
      {
        name: 'Party Wear',
        slug: 'party-wear',
        description: 'Opulent tissue sarees, embellished silhouettes, and evening drapes.',
        image: '/images/nalmara/category_party_wear.jpg',
        isActive: true,
      },
      {
        name: 'Kidswear',
        slug: 'kids-wear',
        description: 'Charming festive butterfly gowns, lehenga cholis, and ethnic sets for young royals.',
        image: '/images/nalmara/kidswear_butterfly_gown.jpg',
        isActive: true,
      },
      {
        name: 'Lehengas',
        slug: 'lehengas',
        description: 'Handcrafted bridal lehengas, tiered flared skirts, and embellished cholis.',
        image: '/images/categories/lehengas.jpg',
        isActive: true,
      },
      {
        name: 'Salwar Suits',
        slug: 'salwar-suits',
        description: 'Intricately embroidered salwar kameez, palazzo suits, and shararas.',
        image: '/images/categories/salwar-suits.jpg',
        isActive: true,
      },
      {
        name: 'Kurtis',
        slug: 'kurtis',
        description: 'Breathable straight kurti sets, flared tunics, and daily ethnic chic.',
        image: '/images/categories/kurtis.jpg',
        isActive: true,
      },
      {
        name: 'Anarkali',
        slug: 'anarkali',
        description: 'Flowy floor-length anarkalis, festive kalidars, and party gowns.',
        image: '/images/categories/anarkali.jpg',
        isActive: true,
      },
      {
        name: "Men's Wear",
        slug: 'mens-wear',
        description: 'Royal festive kurtas, silk bundi jackets, and wedding sherwanis.',
        image: '/images/categories/mens-wear.jpg',
        isActive: true,
      },
    ]);

    const catMap = new Map(categories.map((c) => [c.slug, c._id]));

    // 3. Create Brands
    console.log('[Seed] Creating studio brands...');
    const brands = await Brand.create([
      {
        name: 'NALMARA FASHION Heritage',
        slug: 'effidoo-heritage',
        description: 'Pure handloom silks, antique zari weaving, and heirloom classics.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'NALMARA FASHION Atelier',
        slug: 'effidoo-atelier',
        description: 'Contemporary bridal silhouettes and made-to-measure masterpieces.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'NALMARA FASHION Couture',
        slug: 'effidoo-couture',
        description: 'Luxury festive ensembles and statement occasion wear.',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=200&q=80',
      },
    ]);

    const brandMap = new Map(brands.map((b) => [b.slug, b._id]));

    const standardSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Custom'];
    const createSizesVariants = (baseSku: string, basePrice: number) => {
      return standardSizes.map((size) => ({
        sku: `${baseSku}-${size}`,
        price: ['3XL', 'Custom'].includes(size) ? basePrice + 350 : basePrice,
        stock: 12,
        images: [],
        attributes: { size },
      }));
    };

    // 4. Create Products from the Screenshot
    console.log('[Seed] Creating products matching design...');
    const rawProducts = [
      // NALMARA DESIGN PRODUCTS (Mockup exact items)
      {
        name: 'Semi Kanchivaram Silk Saree',
        slug: 'semi-kanchivaram-silk-saree',
        description: 'Exquisite semi Kanchivaram silk saree with opulent golden floral motifs, radiant magenta body, and contrast temple border. Includes matching unstitched blouse piece.',
        shortDescription: 'Designer semi Kanchivaram silk saree with antique zari borders.',
        category: catMap.get('semi-kanchivaram') || catMap.get('sarees'),
        brand: brandMap.get('effidoo-heritage'),
        images: [
          { url: '/images/nalmara/category_semi_kanchivaram.jpg', alt: 'Semi Kanchivaram Silk Saree', isMain: true },
          { url: '/images/nalmara/hero_maroon_saree.jpg', alt: 'Drape view' },
        ],
        price: 1299,
        compareAtPrice: 1999,
        costPrice: 700,
        sku: 'NAL-SK-01',
        stock: 50,
        variants: [{ sku: 'NAL-SK-01-FREE', price: 1299, stock: 50, images: [], attributes: { size: 'Free Size', color: 'Rani Pink' } }],
        tags: ['New Arrivals', 'Semi Kanchivaram', 'Silk Saree', 'Bestseller'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.8,
        reviewCount: 115,
        isActive: true,
      },
      {
        name: 'Cotton Saree',
        slug: 'cotton-saree',
        description: 'Authentic pure Chettinadu cotton saree with contrast woven temple borders and lightweight breathable feel. Perfect for daily grace and festive rituals.',
        shortDescription: 'Pure Chettinadu cotton saree with traditional border.',
        category: catMap.get('cotton-sarees') || catMap.get('sarees'),
        brand: brandMap.get('effidoo-heritage'),
        images: [
          { url: '/images/nalmara/cotton_saree_stack.jpg', alt: 'Cotton Saree', isMain: true },
        ],
        price: 799,
        compareAtPrice: 1199,
        costPrice: 400,
        sku: 'NAL-COT-02',
        stock: 65,
        variants: [{ sku: 'NAL-COT-02-FREE', price: 799, stock: 65, images: [], attributes: { size: 'Free Size', color: 'Teal Green' } }],
        tags: ['New Arrivals', 'Cotton Saree', 'Chettinadu', 'Under 799'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.9,
        reviewCount: 89,
        isActive: true,
      },
      {
        name: 'Party Wear Saree',
        slug: 'party-wear-saree',
        description: 'Ethereal pastel lavender and gold semi tissue saree embellished with subtle sequin embroidery and delicate zari scallop edging.',
        shortDescription: 'Pastel lavender party wear semi tissue saree.',
        category: catMap.get('party-wear') || catMap.get('sarees'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: '/images/nalmara/category_party_wear.jpg', alt: 'Party Wear Saree', isMain: true },
        ],
        price: 1489,
        compareAtPrice: 1999,
        costPrice: 600,
        sku: 'NAL-TIS-03',
        stock: 40,
        variants: [{ sku: 'NAL-TIS-03-FREE', price: 1489, stock: 40, images: [], attributes: { size: 'Free Size', color: 'Lavender' } }],
        tags: ['New Arrivals', 'Party Wear', 'Tissue Saree'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.7,
        reviewCount: 72,
        isActive: true,
      },
      {
        name: 'Art Silk Saree',
        slug: 'art-silk-saree',
        description: 'Lustrous silver and royal blue dual-tone silk cotton saree crafted for festive evenings and traditional ceremonies.',
        shortDescription: 'Silver silk cotton saree with fine silver zari border.',
        category: catMap.get('sarees'),
        brand: brandMap.get('effidoo-heritage'),
        images: [
          { url: '/images/bestsellers/traditional_silk_saree.jpg', alt: 'Art Silk Saree', isMain: true },
        ],
        price: 909,
        compareAtPrice: 1499,
        costPrice: 480,
        sku: 'NAL-SC-04',
        stock: 35,
        variants: [{ sku: 'NAL-SC-04-FREE', price: 909, stock: 35, images: [], attributes: { size: 'Free Size', color: 'Silver Blue' } }],
        tags: ['New Arrivals', 'Silk Cotton', 'Festive'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.8,
        reviewCount: 95,
        isActive: true,
      },
      {
        name: 'Kids Butterfly Gown',
        slug: 'kids-butterfly-gown',
        description: 'Charming festive yellow butterfly gown for young girls, featuring circular tiers, sequined gold bodice, and lightweight twirling silhouette.',
        shortDescription: 'Festive yellow ethnic butterfly gown for kids.',
        category: catMap.get('kids-wear'),
        brand: brandMap.get('effidoo-atelier'),
        images: [
          { url: '/images/nalmara/kidswear_butterfly_gown.jpg', alt: 'Kids Butterfly Gown', isMain: true },
        ],
        price: 369,
        compareAtPrice: 699,
        costPrice: 180,
        sku: 'NAL-KID-05',
        stock: 60,
        variants: createSizesVariants('NAL-KID-05', 369),
        tags: ['New Arrivals', 'Kidswear', 'Gown', 'Under 799'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.9,
        reviewCount: 64,
        isActive: true,
      },
      {
        name: 'Kanchivaram Saree',
        slug: 'kanchivaram-saree',
        description: 'Peerless royal Kanchivaram silk saree with heavy antique temple gold zari border and rich contrast pallu.',
        shortDescription: 'Royal Kanchivaram silk saree with rich antique temple gold zari.',
        category: catMap.get('sarees'),
        brand: brandMap.get('effidoo-heritage'),
        images: [
          { url: '/images/bestsellers/traditional_silk_saree.jpg', alt: 'Kanchivaram Saree', isMain: true },
        ],
        price: 1499,
        compareAtPrice: 2499,
        costPrice: 500,
        sku: 'NAL-KAN-06',
        stock: 75,
        variants: [{ sku: 'NAL-KAN-06-FREE', price: 1499, stock: 75, images: [], attributes: { size: 'Free Size', color: 'Wine Maroon' } }],
        tags: ['Bestsellers', 'Most Loved', 'Kanchivaram', 'Silk Saree'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 5.0,
        reviewCount: 135,
        isActive: true,
      },
      {
        name: 'Fancy Saree',
        slug: 'fancy-saree',
        description: 'Vibrant and modern fancy georgette saree with digital floral prints and sleek satin border.',
        shortDescription: 'Lightweight fancy printed festive saree.',
        category: catMap.get('sarees'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: '/images/categories/sarees.jpg', alt: 'Fancy Saree', isMain: true },
        ],
        price: 749,
        compareAtPrice: 1299,
        costPrice: 380,
        sku: 'NAL-FNC-07',
        stock: 55,
        variants: [{ sku: 'NAL-FNC-07-FREE', price: 749, stock: 55, images: [], attributes: { size: 'Free Size', color: 'Crimson' } }],
        tags: ['Bestsellers', 'Under 799', 'Fancy Saree'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 4.8,
        reviewCount: 118,
        isActive: true,
      },

      // BEST SELLERS ROW
      {
        name: 'Traditional Silk Saree',
        slug: 'traditional-silk-saree',
        description:
          'Royal magenta and wine handloom pure silk saree with heavy antique gold zari border and rich pallu motifs. Includes matching unstitched silk blouse piece.',
        shortDescription: 'Pure handloom silk saree with rich antique gold zari borders.',
        category: catMap.get('sarees'),
        brand: brandMap.get('effidoo-heritage'),
        images: [
          { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85', alt: 'Traditional Silk Saree', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Silk Zari Pallu Detail' },
        ],
        price: 2999,
        compareAtPrice: 4999,
        costPrice: 1500,
        sku: 'EFF-SLK-01',
        stock: 45,
        variants: [{ sku: 'EFF-SLK-01-FREE', price: 2999, stock: 45, images: [], attributes: { size: 'Free Size' } }],
        tags: ['Best Seller', 'Silk Saree', 'Traditional', 'Zari'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 4.8,
        reviewCount: 124,
        isActive: true,
      },
      {
        name: 'Bridal Lehenga',
        slug: 'bridal-lehenga',
        description:
          'Opulent crimson red and gold bridal lehenga adorned with zardozi embroidery, 8-meter circular flair, double can-can lining, and a sheer embroidered dupatta.',
        shortDescription: 'Heavy embroidered crimson bridal lehenga set with double can-can.',
        category: catMap.get('lehengas'),
        brand: brandMap.get('effidoo-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Bridal Lehenga Front', isMain: true },
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Zardozi Embroidery Closeup' },
        ],
        price: 8999,
        compareAtPrice: 11999,
        costPrice: 4500,
        sku: 'EFF-LHG-02',
        stock: 25,
        variants: createSizesVariants('EFF-LHG-02', 8999),
        tags: ['New', 'Bridal', 'Lehenga', 'Zardozi'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.9,
        reviewCount: 96,
        isActive: true,
      },
      {
        name: 'Embroidered Salwar Suit',
        slug: 'embroidered-salwar-suit',
        description:
          'Elegant ivory and gold threadwork straight salwar kameez set with matching palazzo pants and a hand-loomed tissue organza dupatta.',
        shortDescription: 'Hand-embroidered ivory festive salwar suit with organza dupatta.',
        category: catMap.get('salwar-suits'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Embroidered Salwar Suit', isMain: true },
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85', alt: 'Ivory Threadwork Detail' },
        ],
        price: 3499,
        compareAtPrice: 5999,
        costPrice: 1800,
        sku: 'EFF-SLW-03',
        stock: 38,
        variants: createSizesVariants('EFF-SLW-03', 3499),
        tags: ['Hot', 'Salwar Suit', 'Ivory', 'Festive'],
        featured: true,
        bestSeller: true,
        newArrival: false,
        rating: 4.7,
        reviewCount: 76,
        isActive: true,
      },
      {
        name: 'Anarkali Dress',
        slug: 'anarkali-dress',
        description:
          'Deep midnight navy royal anarkali gown crafted from fluid georgette with metallic foil buttis, high-waist yoke embroidery, and a matching tassel dupatta.',
        shortDescription: 'Regal navy blue flared georgette anarkali gown with gold work.',
        category: catMap.get('anarkali'),
        brand: brandMap.get('effidoo-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1000&q=85', alt: 'Navy Blue Anarkali Dress', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Anarkali Flared Gathers' },
        ],
        price: 4999,
        compareAtPrice: 7999,
        costPrice: 2400,
        sku: 'EFF-ANK-04',
        stock: 30,
        variants: createSizesVariants('EFF-ANK-04', 4999),
        tags: ['New', 'Anarkali', 'Party Wear', 'Navy Blue'],
        featured: true,
        bestSeller: true,
        newArrival: true,
        rating: 4.8,
        reviewCount: 112,
        isActive: true,
      },

      // NEW ARRIVALS ROW
      {
        name: 'Designer Silk Saree',
        slug: 'designer-silk-saree',
        description:
          'Peacock green and gold dual-tone Kanjeevaram designer silk saree. Woven with authentic zari temple borders, perfect for muhurthams and wedding soirees.',
        shortDescription: 'Peacock green & gold dual-tone designer Kanjeevaram silk saree.',
        category: catMap.get('sarees'),
        brand: brandMap.get('effidoo-heritage'),
        images: [
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Designer Silk Saree in Peacock Green', isMain: true },
          { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=85', alt: 'Zari Border Detail' },
        ],
        price: 3499,
        compareAtPrice: 5999,
        costPrice: 1700,
        sku: 'EFF-SLK-05',
        stock: 35,
        variants: [{ sku: 'EFF-SLK-05-FREE', price: 3499, stock: 35, images: [], attributes: { size: 'Free Size' } }],
        tags: ['New', 'Silk Saree', 'Designer', 'Green'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.8,
        reviewCount: 95,
        isActive: true,
      },
      {
        name: 'Straight Kurti Set',
        slug: 'straight-kurti-set',
        description:
          'Pink floral printed pure cotton straight kurti paired with tailored straight-fit trousers and a printed chiffon dupatta with tassel borders.',
        shortDescription: 'Breezy pink pure cotton straight kurti set with printed dupatta.',
        category: catMap.get('kurtis'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85', alt: 'Pink Straight Kurti Set', isMain: true },
          { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85', alt: 'Cotton Kurti Fabric Closeup' },
        ],
        price: 2199,
        compareAtPrice: 3499,
        costPrice: 950,
        sku: 'EFF-KRT-06',
        stock: 50,
        variants: createSizesVariants('EFF-KRT-06', 2199),
        tags: ['Hot', 'Kurti Set', 'Cotton', 'Pink'],
        featured: false,
        bestSeller: true,
        newArrival: true,
        rating: 4.7,
        reviewCount: 52,
        isActive: true,
      },
      {
        name: 'Lehenga Choli',
        slug: 'lehenga-choli',
        description:
          'Sage green and gold foil embellished party-wear lehenga choli set with matching netted dupatta and sweetheart neck designer blouse.',
        shortDescription: 'Pastel sage green party-wear lehenga choli with sweetheart blouse.',
        category: catMap.get('lehengas'),
        brand: brandMap.get('effidoo-atelier'),
        images: [
          { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85', alt: 'Sage Green Lehenga Choli', isMain: true },
          { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85', alt: 'Lehenga Flare Detail' },
        ],
        price: 7999,
        compareAtPrice: 9999,
        costPrice: 3800,
        sku: 'EFF-LHG-07',
        stock: 20,
        variants: createSizesVariants('EFF-LHG-07', 7999),
        tags: ['New', 'Lehenga Choli', 'Sage Green', 'Party Wear'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.9,
        reviewCount: 87,
        isActive: true,
      },
      {
        name: "Men's Kurta",
        slug: 'mens-kurta',
        description:
          'Sky blue textured jacquard festive kurta for men with mandarin collar, concealed button placket, and churidar pajama bottoms.',
        shortDescription: 'Sky blue textured jacquard kurta pajama set for men.',
        category: catMap.get('mens-wear'),
        brand: brandMap.get('effidoo-couture'),
        images: [
          { url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=1000&q=85', alt: "Sky Blue Men's Kurta", isMain: true },
          { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=85', alt: 'Mandarin Collar Detail' },
        ],
        price: 1999,
        compareAtPrice: 3099,
        costPrice: 900,
        sku: 'EFF-MEN-08',
        stock: 40,
        variants: createSizesVariants('EFF-MEN-08', 1999),
        tags: ['Trend', 'Men Kurta', 'Festive', 'Sky Blue'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.6,
        reviewCount: 63,
        isActive: true,
      },
      {
        name: 'Kids Festive Wear',
        slug: 'kids-festive-wear',
        description:
          'Charming yellow and red embroidered pattu pavadai lehenga set for young girls, crafted with breathable soft lining and lightweight gold borders.',
        shortDescription: 'Yellow & red traditional pattu pavadai lehenga set for girls.',
        category: catMap.get('kids-wear'),
        brand: brandMap.get('effidoo-heritage'),
        images: [
          { url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=1000&q=85', alt: 'Kids Yellow Festive Lehenga', isMain: true },
          { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85', alt: 'Kids Lehenga Detail' },
        ],
        price: 1499,
        compareAtPrice: 2499,
        costPrice: 650,
        sku: 'EFF-KID-09',
        stock: 45,
        variants: createSizesVariants('EFF-KID-09', 1499),
        tags: ['New', 'Kids Wear', 'Yellow', 'Pavada'],
        featured: false,
        bestSeller: false,
        newArrival: true,
        rating: 4.8,
        reviewCount: 72,
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
        code: 'FLAT20',
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
        title: 'Breathtaking silk saree, pure gold zari luster!',
        comment:
          'Wore this for my family reception in Chennai. The silk drape is heavy and regal, and the gold zari border has an antique heirloom sheen. Truly royal craftsmanship!',
        images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80'],
        isVerifiedPurchase: true,
        helpfulVotes: 34,
      },
      {
        product: products[1]._id,
        user: customer._id,
        rating: 5,
        title: 'Stunning bridal lehenga, exact fit',
        comment:
          'The zardozi work and the 8-meter circular flare look spectacular in person. Double can-can gave the exact bounce seen in designer runways. Completely in love with it!',
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80'],
        isVerifiedPurchase: true,
        helpfulVotes: 28,
      },
    ]);

    // 7. Create Demo Indian Orders
    console.log('[Seed] Creating demo Indian orders...');
    const order1Items = [
      {
        product: products[0]._id,
        name: products[0].name,
        image: products[0].images[0]?.url || '',
        price: products[0].price,
        quantity: 1,
        sku: 'EFF-SLK-01-FREE',
        attributes: { size: 'Free Size' },
      },
    ];
    const order1Subtotal = 2999;
    const order1Tax = Math.round(order1Subtotal * 0.05 * 100) / 100;
    const order1Total = order1Subtotal + order1Tax;

    await Order.create({
      orderNumber: 'ORD-20260925-1088',
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
      orderStatus: 'Confirmed',
      trackingNumber: 'DELHIVERY-9921448',
      timeline: [
        {
          status: 'Confirmed',
          timestamp: new Date(),
          note: 'Order confirmed and ready for dispatch',
        },
      ],
      createdAt: new Date(),
    });

    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
