import { Product, InventoryMovement } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Adjust product stock and write a movement log. Runs inside a transaction.
 * @param {object} opts
 * @param {number} opts.productId
 * @param {'in'|'out'|'adjustment'} opts.type
 * @param {number} opts.quantity  positive number
 * @param {string} opts.reason
 * @param {string} opts.reference
 * @param {number} opts.userId
 * @param {object} t Sequelize transaction
 */
export const adjustStock = async ({ productId, type, quantity, reason, reference, userId }, t) => {
  const product = await Product.findByPk(productId, { transaction: t, lock: t?.LOCK?.UPDATE });
  if (!product) throw ApiError.notFound(`Product ${productId} not found`);

  let newQty = product.stockQuantity;
  if (type === 'in') newQty += quantity;
  else if (type === 'out') {
    if (product.stockQuantity < quantity) {
      throw ApiError.badRequest(`Insufficient stock for "${product.name}" (have ${product.stockQuantity}, need ${quantity})`);
    }
    newQty -= quantity;
  } else if (type === 'adjustment') {
    newQty = quantity; // absolute set
  }

  product.stockQuantity = newQty;
  await product.save({ transaction: t });

  await InventoryMovement.create(
    {
      ProductId: productId,
      type,
      quantity: type === 'adjustment' ? newQty : quantity,
      balanceAfter: newQty,
      reason,
      reference,
      UserId: userId,
    },
    { transaction: t }
  );

  return product;
};
