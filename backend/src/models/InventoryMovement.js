import { DataTypes } from 'sequelize';
export default (sequelize) =>
  sequelize.define('InventoryMovement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.ENUM('in', 'out', 'adjustment'), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    balanceAfter: { type: DataTypes.INTEGER },
    reason: { type: DataTypes.STRING },
    reference: { type: DataTypes.STRING }, // e.g. SALE-123, PUR-45
    ProductId: { type: DataTypes.INTEGER },
    UserId: { type: DataTypes.INTEGER },
  });
