import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Purchase', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending', 'received', 'cancelled'), defaultValue: 'pending' },
    notes: { type: DataTypes.TEXT },
    SupplierId: { type: DataTypes.INTEGER },
    UserId: { type: DataTypes.INTEGER },
  });
