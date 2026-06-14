import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('PurchaseReturnItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    purchasePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    lineTotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    PurchaseReturnId: { type: DataTypes.INTEGER },
    ProductId: { type: DataTypes.INTEGER },
  });
