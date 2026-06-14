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

const db = {
  sequelize,
  User, Category, Product, Supplier, Customer,
  Purchase, PurchaseItem, Sale, SaleItem,
  InventoryMovement, Setting, AuditLog,
};

export default db;
export {
  sequelize, User, Category, Product, Supplier, Customer,
  Purchase, PurchaseItem, Sale, SaleItem, InventoryMovement, Setting, AuditLog,
};
