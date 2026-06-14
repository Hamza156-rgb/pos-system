import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Setting', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shopName: { type: DataTypes.STRING, defaultValue: 'My Stationery Store' },
    address: { type: DataTypes.TEXT },
    phone: { type: DataTypes.STRING },
    logoUrl: { type: DataTypes.STRING },
    taxPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING, defaultValue: 'PKR' },
    receiptFooter: { type: DataTypes.STRING, defaultValue: 'Thank you for shopping!' },
    receiptTemplate: { type: DataTypes.ENUM('58mm', '80mm'), defaultValue: '80mm' },
  });
