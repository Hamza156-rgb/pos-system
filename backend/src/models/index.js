import sequelize from '../config/database.js';
import UserModel from './User.js';
import CategoryModel from './Category.js';
import ProductModel from './Product.js';
import SupplierModel from './Supplier.js';
import CustomerModel from './Customer.js';
import PurchaseModel from './Purchase.js';
import PurchaseItemModel from './PurchaseItem.js';
import SaleModel from './Sale.js';
import SaleItemModel from './SaleItem.js';
import InventoryMovementModel from './InventoryMovement.js';
import SettingModel from './Setting.js';
import AuditLogModel from './AuditLog.js';
import SaleReturnModel from './SaleReturn.js';
import SaleReturnItemModel from './SaleReturnItem.js';
import PurchaseReturnModel from './PurchaseReturn.js';
import PurchaseReturnItemModel from './PurchaseReturnItem.js';
import SupplierPaymentModel from './SupplierPayment.js';
import CustomerPaymentModel from './CustomerPayment.js';

const User = UserModel(sequelize);
const Category = CategoryModel(sequelize);
const Product = ProductModel(sequelize);
const Supplier = SupplierModel(sequelize);
const Customer = CustomerModel(sequelize);
const Purchase = PurchaseModel(sequelize);
const PurchaseItem = PurchaseItemModel(sequelize);
const Sale = SaleModel(sequelize);
const SaleItem = SaleItemModel(sequelize);
const InventoryMovement = InventoryMovementModel(sequelize);
const Setting = SettingModel(sequelize);
const AuditLog = AuditLogModel(sequelize);
const SaleReturn = SaleReturnModel(sequelize);
const SaleReturnItem = SaleReturnItemModel(sequelize);
const PurchaseReturn = PurchaseReturnModel(sequelize);
const PurchaseReturnItem = PurchaseReturnItemModel(sequelize);
const SupplierPayment = SupplierPaymentModel(sequelize);
const CustomerPayment = CustomerPaymentModel(sequelize);

// ---------- Associations ----------
Category.hasMany(Product, { foreignKey: 'CategoryId' });
Product.belongsTo(Category, { foreignKey: 'CategoryId' });

Supplier.hasMany(Purchase, { foreignKey: 'SupplierId' });
Purchase.belongsTo(Supplier, { foreignKey: 'SupplierId' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'PurchaseId', as: 'items', onDelete: 'CASCADE' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'PurchaseId' });
Product.hasMany(PurchaseItem, { foreignKey: 'ProductId' });
PurchaseItem.belongsTo(Product, { foreignKey: 'ProductId' });
User.hasMany(Purchase, { foreignKey: 'UserId' });
Purchase.belongsTo(User, { foreignKey: 'UserId' });

Customer.hasMany(Sale, { foreignKey: 'CustomerId' });
Sale.belongsTo(Customer, { foreignKey: 'CustomerId' });
Sale.hasMany(SaleItem, { foreignKey: 'SaleId', as: 'items', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'SaleId' });
Product.hasMany(SaleItem, { foreignKey: 'ProductId' });
SaleItem.belongsTo(Product, { foreignKey: 'ProductId' });
User.hasMany(Sale, { foreignKey: 'UserId' });
Sale.belongsTo(User, { foreignKey: 'UserId' });

Product.hasMany(InventoryMovement, { foreignKey: 'ProductId' });
InventoryMovement.belongsTo(Product, { foreignKey: 'ProductId' });
User.hasMany(InventoryMovement, { foreignKey: 'UserId' });
InventoryMovement.belongsTo(User, { foreignKey: 'UserId' });

User.hasMany(AuditLog, { foreignKey: 'UserId' });
AuditLog.belongsTo(User, { foreignKey: 'UserId' });

// Sale returns
Sale.hasMany(SaleReturn, { foreignKey: 'SaleId' });
SaleReturn.belongsTo(Sale, { foreignKey: 'SaleId' });
SaleReturn.hasMany(SaleReturnItem, { foreignKey: 'SaleReturnId', as: 'items', onDelete: 'CASCADE' });
SaleReturnItem.belongsTo(SaleReturn, { foreignKey: 'SaleReturnId' });
Product.hasMany(SaleReturnItem, { foreignKey: 'ProductId' });
SaleReturnItem.belongsTo(Product, { foreignKey: 'ProductId' });
Customer.hasMany(SaleReturn, { foreignKey: 'CustomerId' });
SaleReturn.belongsTo(Customer, { foreignKey: 'CustomerId' });
User.hasMany(SaleReturn, { foreignKey: 'UserId' });
SaleReturn.belongsTo(User, { foreignKey: 'UserId' });

// Purchase returns
Purchase.hasMany(PurchaseReturn, { foreignKey: 'PurchaseId' });
PurchaseReturn.belongsTo(Purchase, { foreignKey: 'PurchaseId' });
PurchaseReturn.hasMany(PurchaseReturnItem, { foreignKey: 'PurchaseReturnId', as: 'items', onDelete: 'CASCADE' });
PurchaseReturnItem.belongsTo(PurchaseReturn, { foreignKey: 'PurchaseReturnId' });
Product.hasMany(PurchaseReturnItem, { foreignKey: 'ProductId' });
PurchaseReturnItem.belongsTo(Product, { foreignKey: 'ProductId' });
Supplier.hasMany(PurchaseReturn, { foreignKey: 'SupplierId' });
PurchaseReturn.belongsTo(Supplier, { foreignKey: 'SupplierId' });
User.hasMany(PurchaseReturn, { foreignKey: 'UserId' });
PurchaseReturn.belongsTo(User, { foreignKey: 'UserId' });

// Payments (ledgers)
Supplier.hasMany(SupplierPayment, { foreignKey: 'SupplierId' });
SupplierPayment.belongsTo(Supplier, { foreignKey: 'SupplierId' });
Customer.hasMany(CustomerPayment, { foreignKey: 'CustomerId' });
CustomerPayment.belongsTo(Customer, { foreignKey: 'CustomerId' });

const db = {
  sequelize,
  User, Category, Product, Supplier, Customer,
  Purchase, PurchaseItem, Sale, SaleItem,
  InventoryMovement, Setting, AuditLog,
  SaleReturn, SaleReturnItem, PurchaseReturn, PurchaseReturnItem,
  SupplierPayment, CustomerPayment,
};

export default db;
export {
  sequelize, User, Category, Product, Supplier, Customer,
  Purchase, PurchaseItem, Sale, SaleItem, InventoryMovement, Setting, AuditLog,
  SaleReturn, SaleReturnItem, PurchaseReturn, PurchaseReturnItem,
  SupplierPayment, CustomerPayment,
};
