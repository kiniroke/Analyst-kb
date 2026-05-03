const prisma = require("../prisma");

async function logAudit({ userId, action, entity, entityId, details }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
  }
}

module.exports = {
  logAudit,
};
