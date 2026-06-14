import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('CustomerPayment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    method: { type: DataTypes.ENUM('cash', 'card', 'bank'), defaultValue: 'cash' },
    note: { type: DataTypes.STRING },
    CustomerId: { type: DataTypes.INTEGER },
    UserId: { type: DataTypes.INTEGER },
  });
