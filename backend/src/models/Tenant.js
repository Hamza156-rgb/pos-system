import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('Tenant', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },          // shop name
    slug: { type: DataTypes.STRING, unique: true },              // short unique handle
    contactName: { type: DataTypes.STRING },
    contactPhone: { type: DataTypes.STRING },
    contactEmail: { type: DataTypes.STRING },
    plan: { type: DataTypes.ENUM('trial', 'basic', 'pro'), defaultValue: 'trial' },
    status: { type: DataTypes.ENUM('active', 'suspended'), defaultValue: 'active' },
    expiresAt: { type: DataTypes.DATE },                         // null = no expiry
  });
