const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { writeAuditLog } = require("../services/auditLogger.service");

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  const { fullName, email, password, department } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email and password are required." });
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
      role: "VIEWER",
      department: department || "Data Analytics Department",
    },
  });

  const token = createToken(user);
  await writeAuditLog({
    userId: user.id,
    action: "REGISTER",
    entity: "USER",
    entityId: user.id,
    details: { email: user.email, role: user.role },
  });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = createToken(user);
  await writeAuditLog({
    userId: user.id,
    action: "LOGIN",
    entity: "AUTH",
    entityId: user.id,
    details: { email: user.email },
  });

  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
}

async function me(req, res) {
  return res.json(req.user);
}

module.exports = {
  register,
  login,
  me,
};
