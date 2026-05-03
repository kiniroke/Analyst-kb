const prisma = require("../prisma");

async function listAuditLogs(req, res) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      user: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  });
  res.json(logs);
}

module.exports = {
  listAuditLogs,
};
