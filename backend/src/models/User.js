import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('superadmin', 'admin', 'cashier'), defaultValue: 'cashier' },
    // Screen-access allowlist for cashiers, e.g. ["pos","products","reports"].
    // Admins bypass this and have access to everything.
    permissions: { type: DataTypes.JSON, defaultValue: [] },
    phone: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    refreshToken: { type: DataTypes.TEXT },
    lastLogin: { type: DataTypes.DATE },
  });

  User.beforeCreate(async (user) => {
    if (user.password) user.password = await bcrypt.hash(user.password, 10);
  });
  User.beforeUpdate(async (user) => {
    if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10);
  });
  User.prototype.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
  };
  User.prototype.toSafeJSON = function () {
    const { password, refreshToken, ...rest } = this.toJSON();
    return rest;
  };
  return User;
};
