import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    outstandingBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  });
