import { sequelize, Sale, SaleItem, Product, Customer } from '../models/index.js';
import { adjustStock } from './inventory.service.js';
import ApiError from '../utils/ApiError.js';

const genInvoiceNumber = () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${stamp}-${rand}`;
};

/**
 * Create a sale atomically: validates stock, decrements inventory,
 * logs movements, updates customer credit balance.
 */
export const createSale = async (payload, user) => {
  const {
    items = [],
    discount = 0,
    taxPercentage = 0,
    paymentMethod = 'cash',
    amountPaid = 0,
    cashAmount = 0,
    cardAmount = 0,
    customerId = null,
    isCredit = false,
    offlineId = null,
  } = payload;

  if (!items.length) throw ApiError.badRequest('Sale must contain at least one item');

  return sequelize.transaction(async (t) => {
    let subtotal = 0;
    const resolvedItems = [];

    for (const it of items) {
      const product = await Product.findByPk(it.productId, { transaction: t });
      if (!product) throw ApiError.notFound(`Product ${it.productId} not found`);
      const qty = Number(it.quantity);
      const unitPrice = it.unitPrice != null ? Number(it.unitPrice) : Number(product.sellingPrice);
      const lineDiscount = Number(it.discount || 0);
      const lineTotal = unitPrice * qty - lineDiscount;
      subtotal += lineTotal;
      resolvedItems.push({ product, qty, unitPrice, lineDiscount, lineTotal });
    }

    const taxableBase = subtotal - Number(discount);
    const tax = +(taxableBase * (Number(taxPercentage) / 100)).toFixed(2);
    const grandTotal = +(taxableBase + tax).toFixed(2);
    const paid = isCredit ? Number(amountPaid) : (paymentMethod === 'mixed' ? Number(cashAmount) + Number(cardAmount) : Number(amountPaid));
    const changeReturn = paid > grandTotal ? +(paid - grandTotal).toFixed(2) : 0;
    const creditDue = isCredit ? +(grandTotal - paid).toFixed(2) : 0;

    const sale = await Sale.create(
      {
        invoiceNumber: genInvoiceNumber(),
        subtotal,
        discount,
        tax,
        grandTotal,
        amountPaid: paid,
        changeReturn,
        paymentMethod: isCredit ? 'credit' : paymentMethod,
        cashAmount,
        cardAmount,
        isCredit,
        creditDue,
        offlineId,
        syncedAt: offlineId ? new Date() : null,
        CustomerId: customerId,
        UserId: user.id,
      },
      { transaction: t }
    );

    for (const ri of resolvedItems) {
      await SaleItem.create(
        {
          SaleId: sale.id,
          ProductId: ri.product.id,
          productName: ri.product.name,
          quantity: ri.qty,
          unitPrice: ri.unitPrice,
          discount: ri.lineDiscount,
          lineTotal: ri.lineTotal,
        },
        { transaction: t }
      );
      await adjustStock(
        { productId: ri.product.id, type: 'out', quantity: ri.qty, reason: 'Sale', reference: sale.invoiceNumber, userId: user.id },
        t
      );
    }

    if (isCredit && customerId && creditDue > 0) {
      const customer = await Customer.findByPk(customerId, { transaction: t });
      if (customer) {
        customer.outstandingBalance = +(Number(customer.outstandingBalance) + creditDue).toFixed(2);
        await customer.save({ transaction: t });
      }
    }

    return sale;
  });
};
