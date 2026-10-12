import { Product } from '../models/Product.js';

export interface InventoryItemToDecrement {
  product: any;
  variantId?: string;
  quantity: number;
  name?: string;
}

export interface DecrementResult {
  success: boolean;
  failedItem?: string;
  errorMessage?: string;
}

/**
 * Atomically decrements product and variant inventory with strict non-negative conditions (stock >= qty).
 * If any item cannot be decremented due to concurrent depletion, all previously decremented
 * items in this batch are rolled back immediately, guaranteeing consistency and zero overselling.
 */
export async function decrementInventoryAtomic(
  items: InventoryItemToDecrement[]
): Promise<DecrementResult> {
  const decrementedSoFar: InventoryItemToDecrement[] = [];

  for (const item of items) {
    const qty = Math.max(1, item.quantity);
    const productId = item.product?._id || item.product;

    // 1. If variant is present, decrement variant stock atomically
    if (item.variantId) {
      const updatedVariant = await Product.findOneAndUpdate(
        {
          _id: productId,
          'variants._id': item.variantId,
          'variants.stock': { $gte: qty },
        },
        {
          $inc: { 'variants.$.stock': -qty },
        },
        { new: true }
      );

      if (!updatedVariant) {
        // Rollback previously decremented items
        await rollbackInventory(decrementedSoFar);
        return {
          success: false,
          failedItem: item.name || String(productId),
          errorMessage: `Insufficient stock for variant "${item.name || productId}"`,
        };
      }
    }

    // 2. Decrement main product stock atomically
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gte: qty },
      },
      {
        $inc: { stock: -qty },
      },
      { new: true }
    );

    if (!updatedProduct) {
      // If variant was decremented in this step, roll back variant first
      if (item.variantId) {
        await Product.updateOne(
          { _id: productId, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': qty } }
        );
      }
      // Rollback previously decremented items
      await rollbackInventory(decrementedSoFar);
      return {
        success: false,
        failedItem: item.name || String(productId),
        errorMessage: `Insufficient stock for product "${item.name || productId}"`,
      };
    }

    decrementedSoFar.push(item);
  }

  return { success: true };
}

/**
 * Reverts decremented inventory if an order creation or checkout step fails.
 */
export async function rollbackInventory(items: InventoryItemToDecrement[]): Promise<void> {
  for (const item of items) {
    const qty = Math.max(1, item.quantity);
    const productId = item.product?._id || item.product;

    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: qty },
    });

    if (item.variantId) {
      await Product.updateOne(
        { _id: productId, 'variants._id': item.variantId },
        { $inc: { 'variants.$.stock': qty } }
      );
    }
  }
}
