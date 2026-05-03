const prisma = require("../prisma");
const { writeAuditLog } = require("../services/auditLogger.service");

async function listTasks(req, res) {
  const { assignedToId, priority } = req.query;
  const where = {};
  if (assignedToId) where.assignedToId = Number(assignedToId);
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { id: true, fullName: true, role: true } },
      createdBy: { select: { id: true, fullName: true, role: true } },
      relatedIssue: true,
    },
  });

  res.json(tasks);
}

async function createTask(req, res) {
  if (!req.body.title) {
    return res.status(400).json({ message: "title is required." });
  }

  const task = await prisma.task.create({
    data: {
      title: req.body.title,
      description: req.body.description || "",
      status: req.body.status || "TODO",
      priority: req.body.priority || "MEDIUM",
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      assignedToId: req.body.assignedToId ? Number(req.body.assignedToId) : null,
      createdById: req.user.id,
      relatedIssueId: req.body.relatedIssueId ? Number(req.body.relatedIssueId) : null,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "CREATE",
    entity: "TASK",
    entityId: task.id,
    details: { title: task.title, priority: task.priority },
  });

  res.status(201).json(task);
}

async function updateTask(req, res) {
  const taskId = Number(req.params.id);
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) {
    return res.status(404).json({ message: "Task not found." });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: req.body.title ?? existing.title,
      description: req.body.description ?? existing.description,
      status: req.body.status ?? existing.status,
      priority: req.body.priority ?? existing.priority,
      dueDate: req.body.dueDate !== undefined ? (req.body.dueDate ? new Date(req.body.dueDate) : null) : existing.dueDate,
      assignedToId: req.body.assignedToId !== undefined ? (req.body.assignedToId ? Number(req.body.assignedToId) : null) : existing.assignedToId,
      relatedIssueId: req.body.relatedIssueId !== undefined ? (req.body.relatedIssueId ? Number(req.body.relatedIssueId) : null) : existing.relatedIssueId,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "UPDATE",
    entity: "TASK",
    entityId: task.id,
    details: { title: task.title, status: task.status },
  });

  res.json(task);
}

async function deleteTask(req, res) {
  const taskId = Number(req.params.id);
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) {
    return res.status(404).json({ message: "Task not found." });
  }

  await prisma.task.delete({ where: { id: taskId } });
  await writeAuditLog({
    userId: req.user.id,
    action: "DELETE",
    entity: "TASK",
    entityId: existing.id,
    details: { title: existing.title },
  });

  res.json({ message: "Task deleted successfully." });
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
};
