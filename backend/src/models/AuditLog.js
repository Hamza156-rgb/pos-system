import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    action: { type: DataTypes.STRING, allowNull: false }, // LOGIN, PRODUCT_UPDATE...
    entity: { type: DataTypes.STRING },
    entityId: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    ipAddress: { type: DataTypes.STRING },
    UserId: { type: DataTypes.INTEGER },
  });
