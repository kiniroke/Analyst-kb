const prisma = require("../prisma");
const { writeAuditLog } = require("../services/auditLogger.service");

async function listIssues(req, res) {
  const { search, issueType, severity, status } = req.query;
  const where = {};
  if (search) {
    where.OR = [{ title: { contains: search } }, { recommendation: { contains: search } }];
  }
  if (issueType) where.issueType = issueType;
  if (severity) where.severity = severity;
  if (status) where.status = status;

  const issues = await prisma.dataIssue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      source: true,
      assignedTo: { select: { id: true, fullName: true, role: true } },
      createdBy: { select: { id: true, fullName: true, role: true } },
    },
  });
  res.json(issues);
}

async function getIssue(req, res) {
  const issue = await prisma.dataIssue.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      source: true,
      coverageCheck: true,
      assignedTo: { select: { id: true, fullName: true, role: true } },
      createdBy: { select: { id: true, fullName: true, role: true } },
      tasks: true,
    },
  });
  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }
  res.json(issue);
}

async function createIssue(req, res) {
  const { sourceId, title, issueType, severity } = req.body;
  if (!sourceId || !title || !issueType || !severity) {
    return res.status(400).json({ message: "sourceId, title, issueType and severity are required." });
  }

  const issue = await prisma.dataIssue.create({
    data: {
      sourceId: Number(sourceId),
      coverageCheckId: req.body.coverageCheckId ? Number(req.body.coverageCheckId) : null,
      entityId: req.body.entityId || null,
      title,
      issueType,
      severity,
      status: req.body.status || "NEW",
      evidence: req.body.evidence || null,
      recommendation: req.body.recommendation || null,
      createdById: req.user.id,
      assignedToId: req.body.assignedToId ? Number(req.body.assignedToId) : null,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "CREATE",
    entity: "DATA_ISSUE",
    entityId: issue.id,
    details: { issueType: issue.issueType, severity: issue.severity },
  });

  res.status(201).json(issue);
}

async function updateIssue(req, res) {
  const issueId = Number(req.params.id);
  const existing = await prisma.dataIssue.findUnique({ where: { id: issueId } });
  if (!existing) {
    return res.status(404).json({ message: "Issue not found." });
  }

  const issue = await prisma.dataIssue.update({
    where: { id: issueId },
    data: {
      title: req.body.title ?? existing.title,
      issueType: req.body.issueType ?? existing.issueType,
      severity: req.body.severity ?? existing.severity,
      status: req.body.status ?? existing.status,
      evidence: req.body.evidence ?? existing.evidence,
      recommendation: req.body.recommendation ?? existing.recommendation,
      assignedToId: req.body.assignedToId !== undefined ? (req.body.assignedToId ? Number(req.body.assignedToId) : null) : existing.assignedToId,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "UPDATE",
    entity: "DATA_ISSUE",
    entityId: issue.id,
    details: { issueType: issue.issueType, severity: issue.severity, status: issue.status },
  });

  res.json(issue);
}

async function deleteIssue(req, res) {
  const issueId = Number(req.params.id);
  const existing = await prisma.dataIssue.findUnique({ where: { id: issueId } });
  if (!existing) {
    return res.status(404).json({ message: "Issue not found." });
  }

  await prisma.dataIssue.delete({ where: { id: issueId } });
  await writeAuditLog({
    userId: req.user.id,
    action: "DELETE",
    entity: "DATA_ISSUE",
    entityId: issueId,
    details: { title: existing.title },
  });

  res.json({ message: "Issue deleted successfully." });
}

async function createTaskFromIssue(req, res) {
  const issue = await prisma.dataIssue.findUnique({ where: { id: Number(req.params.id) } });
  if (!issue) {
    return res.status(404).json({ message: "Issue not found." });
  }

  const task = await prisma.task.create({
    data: {
      title: req.body.title || `Follow up: ${issue.title}`,
      description: req.body.description || issue.recommendation || "",
      status: req.body.status || "TODO",
      priority: req.body.priority || "MEDIUM",
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      assignedToId: req.body.assignedToId ? Number(req.body.assignedToId) : null,
      createdById: req.user.id,
      relatedIssueId: issue.id,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "CREATE",
    entity: "TASK",
    entityId: task.id,
    details: { relatedIssueId: issue.id },
  });

  res.status(201).json(task);
}

module.exports = {
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  createTaskFromIssue,
};
