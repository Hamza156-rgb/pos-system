import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('PurchaseReturn', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    returnNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, // value of goods returned to supplier
    reason: { type: DataTypes.STRING },
    PurchaseId: { type: DataTypes.INTEGER },
    SupplierId: { type: DataTypes.INTEGER },
    UserId: { type: DataTypes.INTEGER },
  });
