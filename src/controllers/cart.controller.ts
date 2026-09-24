import { Response, NextFunction } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guestId = (req.headers['x-guest-id'] as string) || (req.query.guestId as string);
    let cart = null;

    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
      }
    } else if (guestId) {
      cart = await Cart.findOne({ guestId }).populate('items.product');
      if (!cart) {
        cart = await Cart.create({ guestId, items: [] });
      }
    } else {
      sendSuccess(res, 'Cart retrieved', { items: [] });
      return;
    }

    sendSuccess(res, 'Cart retrieved successfully', cart);
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const guestId = (req.headers['x-guest-id'] as string) || req.body.guestId;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      sendError(res, 'Product not found or unavailable', 404);
      return;
    }

    let availableStock = product.stock;
    let itemPrice = product.price;
    let itemSku = product.sku;
    let itemImage = product.images[0]?.url || '';
    let itemAttributes: any = {};

    if (variantId) {
      const variant = product.variants.find((v) => v._id?.toString() === variantId);
      if (variant) {
        availableStock = variant.stock;
        itemPrice = variant.price;
        itemSku = variant.sku;
        if (variant.images && variant.images.length > 0) {
          itemImage = variant.images[0];
        }
        itemAttributes = variant.attributes;
      }
    }

    if (availableStock < quantity) {
      sendError(res, `Only ${availableStock} items available in stock`, 400);
      return;
    }

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }
    } else if (guestId) {
      cart = await Cart.findOne({ guestId });
      if (!cart) {
        cart = new Cart({ guestId, items: [] });
      }
    } else {
      sendError(res, 'User identification required (guest ID or login)', 400);
      return;
    }

    // Check if same product & variant already in cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.variantId || '') === (variantId || '')
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > availableStock) {
        sendError(res, `Cannot add more than ${availableStock} units to cart`, 400);
        return;
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = itemPrice; // update with latest price
    } else {
      cart.items.push({
        product: product._id,
        variantId,
        name: product.name,
        image: itemImage,
        price: itemPrice,
        sku: itemSku,
        attributes: itemAttributes,
        quantity,
      });
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');
    sendSuccess(res, 'Item added to cart', populated);
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const guestId = (req.headers['x-guest-id'] as string) || (req.query.guestId as string);

    if (!quantity || quantity < 1) {
      sendError(res, 'Quantity must be at least 1', 400);
      return;
    }

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (guestId) {
      cart = await Cart.findOne({ guestId });
    }

    if (!cart) {
      sendError(res, 'Cart not found', 404);
      return;
    }

    const item = cart.items.find((i) => (i as any)._id.toString() === itemId);
    if (!item) {
      sendError(res, 'Cart item not found', 404);
      return;
    }

    const product = await Product.findById(item.product);
    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    let availableStock = product.stock;
    if (item.variantId) {
      const variant = product.variants.find((v) => v._id?.toString() === item.variantId);
      if (variant) {
        availableStock = variant.stock;
      }
    }

    if (quantity > availableStock) {
      sendError(res, `Cannot set quantity greater than available stock (${availableStock})`, 400);
      return;
    }

    item.quantity = quantity;
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product');
    sendSuccess(res, 'Cart item updated', populated);
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { itemId } = req.params;
    const guestId = (req.headers['x-guest-id'] as string) || (req.query.guestId as string);

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user: req.user._id });
    } else if (guestId) {
      cart = await Cart.findOne({ guestId });
    }

    if (!cart) {
      sendError(res, 'Cart not found', 404);
      return;
    }

    cart.items = cart.items.filter((i) => (i as any)._id.toString() !== itemId);
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product');
    sendSuccess(res, 'Item removed from cart', populated);
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guestId = (req.headers['x-guest-id'] as string) || (req.query.guestId as string);

    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    } else if (guestId) {
      await Cart.findOneAndUpdate({ guestId }, { items: [] });
    }

    sendSuccess(res, 'Cart cleared successfully', { items: [] });
  } catch (error) {
    next(error);
  }
};

export const mergeGuestCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { guestId } = req.body;
    if (!guestId || !req.user) {
      sendError(res, 'User authentication and guest ID are required for merging', 400);
      return;
    }

    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart || guestCart.items.length === 0) {
      const userCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      sendSuccess(res, 'No guest cart items to merge', userCart);
      return;
    }

    let userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      userCart = new Cart({ user: req.user._id, items: [] });
    }

    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex(
        (item) =>
          item.product.toString() === guestItem.product.toString() &&
          (item.variantId || '') === (guestItem.variantId || '')
      );

      if (existingIndex > -1) {
        userCart.items[existingIndex].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }

    await userCart.save();
    // Remove the guest cart after successful merge
    await Cart.findByIdAndDelete(guestCart._id);

    const populated = await Cart.findById(userCart._id).populate('items.product');
    sendSuccess(res, 'Guest cart merged successfully', populated);
  } catch (error) {
    next(error);
  }
};
