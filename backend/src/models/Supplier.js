import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Supplier', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, validate: { isEmail: true } },
    address: { type: DataTypes.TEXT },
    // Amount we owe this supplier (payable). Increases on received purchases,
    // decreases on payments and purchase returns.
    outstandingBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  });
