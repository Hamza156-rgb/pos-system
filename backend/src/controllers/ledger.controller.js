import {
  Customer, Sale, CustomerPayment, SaleReturn,
  Supplier, Purchase, PurchaseReturn, SupplierPayment,
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const sumBy = (arr, key) => arr.reduce((s, e) => s + Number(e[key] || 0), 0);

// Customer ledger — receivables. Debit = they owe more, Credit = they paid / returned.
export const customerLedger = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');

  const [sales, payments, returns] = await Promise.all([
    Sale.findAll({ where: { CustomerId: customer.id, isCredit: true } }),
    CustomerPayment.findAll({ where: { CustomerId: customer.id } }),
    SaleReturn.findAll({ where: { CustomerId: customer.id } }),
  ]);

  const entries = [];
  for (const s of sales) entries.push({ date: s.createdAt, ref: s.invoiceNumber, description: 'Credit sale', debit: Number(s.creditDue), credit: 0 });
  for (const p of payments) entries.push({ date: p.createdAt, ref: 'PMT', description: p.note || 'Payment received', debit: 0, credit: Number(p.amount) });
  for (const r of returns) if (Number(r.creditAdjusted) > 0) entries.push({ date: r.createdAt, ref: r.returnNumber, description: 'Sale return (credit adjusted)', debit: 0, credit: Number(r.creditAdjusted) });

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  for (const e of entries) { running += e.debit - e.credit; e.balance = +running.toFixed(2); }

  ok(res, {
    type: 'customer',
    party: { id: customer.id, name: customer.name, phone: customer.phone },
    currentBalance: Number(customer.outstandingBalance),
    totals: { debit: +sumBy(entries, 'debit').toFixed(2), credit: +sumBy(entries, 'credit').toFixed(2) },
    entries,
  });
});

// Supplier (party) ledger — payables. Credit = we owe more, Debit = we paid / returned.
export const supplierLedger = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByPk(req.params.id);
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const [purchases, returns, payments] = await Promise.all([
    Purchase.findAll({ where: { SupplierId: supplier.id, status: 'received' } }),
    PurchaseReturn.findAll({ where: { SupplierId: supplier.id } }),
    SupplierPayment.findAll({ where: { SupplierId: supplier.id } }),
  ]);

  const entries = [];
  for (const po of purchases) entries.push({ date: po.createdAt, ref: po.orderNumber, description: 'Purchase received', debit: 0, credit: Number(po.totalAmount) });
  for (const r of returns) entries.push({ date: r.createdAt, ref: r.returnNumber, description: 'Purchase return', debit: Number(r.totalAmount), credit: 0 });
  for (const p of payments) entries.push({ date: p.createdAt, ref: 'PMT', description: p.note || 'Payment made', debit: Number(p.amount), credit: 0 });

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  for (const e of entries) { running += e.credit - e.debit; e.balance = +running.toFixed(2); }

  ok(res, {
    type: 'supplier',
    party: { id: supplier.id, name: supplier.name, phone: supplier.phone },
    currentBalance: Number(supplier.outstandingBalance),
    totals: { debit: +sumBy(entries, 'debit').toFixed(2), credit: +sumBy(entries, 'credit').toFixed(2) },
    entries,
  });
});
