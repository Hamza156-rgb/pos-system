import { AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';

// Fire-and-forget audit logger
export const logAudit = async ({ userId, action, entity, entityId, description, ip }) => {
  try {
    await AuditLog.create({
      UserId: userId || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      description,
      ipAddress: ip,
    });
  } catch (e) {
    logger.warn(`Audit log failed: ${e.message}`);
  }
};
