import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Supplier', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, validate: { isEmail: true } },
    address: { type: DataTypes.TEXT },
  });
