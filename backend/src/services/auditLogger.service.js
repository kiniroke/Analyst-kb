const prisma = require("../prisma");

async function writeAuditLog({ userId, action, entity, entityId, details }) {
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
    console.error("Audit log error:", error.message);
  }
}

module.exports = {
  writeAuditLog,
};
