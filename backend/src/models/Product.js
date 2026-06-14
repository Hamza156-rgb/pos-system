import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    barcode: { type: DataTypes.STRING, unique: true },
    brand: { type: DataTypes.STRING },
    purchasePrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    sellingPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    stockQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    reorderLevel: { type: DataTypes.INTEGER, defaultValue: 5 },
    unit: { type: DataTypes.STRING, defaultValue: 'pcs' },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    CategoryId: { type: DataTypes.INTEGER },
  });
