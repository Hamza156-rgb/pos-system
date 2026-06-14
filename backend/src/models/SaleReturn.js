import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('SaleReturn', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    returnNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, // value of returned goods
    cashRefunded: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    creditAdjusted: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 }, // reduced from customer's Udhaar
    refundMethod: { type: DataTypes.ENUM('cash', 'credit', 'mixed'), defaultValue: 'cash' },
    reason: { type: DataTypes.STRING },
    SaleId: { type: DataTypes.INTEGER },
    CustomerId: { type: DataTypes.INTEGER },
    UserId: { type: DataTypes.INTEGER },
  });
