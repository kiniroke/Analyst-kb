const bcrypt = require("bcrypt");
const prisma = require("../prisma");
const { writeAuditLog } = require("../services/auditLogger.service");

async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(users);
}

async function createUser(req, res) {
  const { fullName, email, password, role, department } = req.body;
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ message: "fullName, email, password and role are required." });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    return res.status(400).json({ message: "A user with this email already exists." });
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role,
      department: department || "",
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "CREATE",
    entity: "USER",
    entityId: user.id,
    details: { email: user.email, role: user.role },
  });

  res.status(201).json(user);
}

async function updateUser(req, res) {
  const userId = Number(req.params.id);
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    return res.status(404).json({ message: "User not found." });
  }

  const data = {
    fullName: req.body.fullName ?? existingUser.fullName,
    email: req.body.email ? req.body.email.toLowerCase() : existingUser.email,
    role: req.body.role ?? existingUser.role,
    department: req.body.department ?? existingUser.department,
  };

  if (req.body.password) {
    data.passwordHash = await bcrypt.hash(req.body.password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "UPDATE",
    entity: "USER",
    entityId: userId,
    details: { email: updatedUser.email, role: updatedUser.role },
  });

  res.json(updatedUser);
}

async function deleteUser(req, res) {
  const userId = Number(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own active user." });
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    return res.status(404).json({ message: "User not found." });
  }

  await prisma.user.delete({ where: { id: userId } });
  await writeAuditLog({
    userId: req.user.id,
    action: "DELETE",
    entity: "USER",
    entityId: userId,
    details: { email: existingUser.email },
  });

  res.json({ message: "User deleted successfully." });
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
