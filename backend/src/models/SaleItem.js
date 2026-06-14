import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('SaleItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productName: { type: DataTypes.STRING },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    lineTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    SaleId: { type: DataTypes.INTEGER },
    ProductId: { type: DataTypes.INTEGER },
  });
