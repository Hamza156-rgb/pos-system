import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Sale', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    grandTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    amountPaid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    changeReturn: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    paymentMethod: { type: DataTypes.ENUM('cash', 'card', 'mixed', 'credit'), defaultValue: 'cash' },
    // For mixed payments
    cashAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    cardAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    // Credit / Udhaar
    isCredit: { type: DataTypes.BOOLEAN, defaultValue: false },
    creditDue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('completed', 'refunded'), defaultValue: 'completed' },
    // Offline sync support
    offlineId: { type: DataTypes.STRING },
    syncedAt: { type: DataTypes.DATE },
    CustomerId: { type: DataTypes.INTEGER },
    UserId: { type: DataTypes.INTEGER },
  });
