const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const { requireFields } = require("../utils/validation");
const { logAudit } = require("../utils/auditLogger");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const { search, watcher, region, status } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { fullName: { contains: search } },
      ];
    }
    if (watcher) {
      where.watcher = { contains: watcher };
    }
    if (region) {
      where.region = { contains: region };
    }
    if (status) {
      where.status = status;
    }

    const accounts = await prisma.socialAccount.findMany({
      where,
      orderBy: { followers: "desc" },
    });
    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const account = await prisma.socialAccount.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!account) {
      return res.status(404).json({ message: "Social account not found." });
    }
    res.json(account);
  } catch (error) {
    next(error);
  }
});

router.post("/", allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const missing = requireFields(req.body, ["username"]);
    if (missing.length) {
      return res.status(400).json({ message: `Required fields: ${missing.join(", ")}` });
    }

    const account = await prisma.socialAccount.create({
      data: {
        username: req.body.username,
        fullName: req.body.fullName || "",
        watcher: req.body.watcher || "",
        region: req.body.region || "",
        followers: Number(req.body.followers || 0),
        autoUpdate: Boolean(req.body.autoUpdate),
        status: req.body.status || "ACTIVE",
        notes: req.body.notes || "",
      },
    });

    await logAudit({
      userId: req.user.id,
      action: "CREATE",
      entity: "SOCIAL_ACCOUNT",
      entityId: account.id,
      details: { username: account.username },
    });

    res.status(201).json(account);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "A social account with this username already exists." });
    }
    next(error);
  }
});

router.put("/:id", allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const accountId = Number(req.params.id);
    const existingAccount = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!existingAccount) {
      return res.status(404).json({ message: "Social account not found." });
    }

    const updatedAccount = await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        username: req.body.username ?? existingAccount.username,
        fullName: req.body.fullName ?? existingAccount.fullName,
        watcher: req.body.watcher ?? existingAccount.watcher,
        region: req.body.region ?? existingAccount.region,
        followers: req.body.followers !== undefined ? Number(req.body.followers) : existingAccount.followers,
        autoUpdate: req.body.autoUpdate !== undefined ? Boolean(req.body.autoUpdate) : existingAccount.autoUpdate,
        status: req.body.status ?? existingAccount.status,
        notes: req.body.notes ?? existingAccount.notes,
      },
    });

    await logAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "SOCIAL_ACCOUNT",
      entityId: accountId,
      details: { username: updatedAccount.username },
    });

    res.json(updatedAccount);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const accountId = Number(req.params.id);
    const existingAccount = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!existingAccount) {
      return res.status(404).json({ message: "Social account not found." });
    }

    await prisma.socialAccount.delete({ where: { id: accountId } });
    await logAudit({
      userId: req.user.id,
      action: "DELETE",
      entity: "SOCIAL_ACCOUNT",
      entityId: accountId,
      details: { username: existingAccount.username },
    });

    res.json({ message: "Social account deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
