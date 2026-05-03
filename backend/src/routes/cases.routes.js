const express = require("express");
const prisma = require("../prisma");
const auth = require("../middleware/auth");
const allowRoles = require("../middleware/role");
const { requireFields } = require("../utils/validation");
const { logAudit } = require("../utils/auditLogger");

const router = express.Router();

router.use(auth);

async function generateCaseNumber() {
  const count = await prisma.verificationCase.count();
  return `CASE-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
}

router.get("/", async (req, res, next) => {
  try {
    const { search, issueCategory, priority, status } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { caseNumber: { contains: search } },
        { title: { contains: search } },
        { sourceName: { contains: search } },
      ];
    }
    if (issueCategory) {
      where.issueCategory = issueCategory;
    }
    if (priority) {
      where.priority = priority;
    }
    if (status) {
      where.status = status;
    }

    const cases = await prisma.verificationCase.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, fullName: true, role: true },
        },
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(cases);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const item = await prisma.verificationCase.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, role: true },
        },
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });
    if (!item) {
      return res.status(404).json({ message: "Case not found." });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/", allowRoles("ADMIN", "ANALYST"), async (req, res, next) => {
  try {
    const missing = requireFields(req.body, [
      "title",
      "sourceName",
      "sourceType",
      "issueCategory",
      "description",
    ]);
    if (missing.length) {
      return res.status(400).json({ message: `Required fields: ${missing.join(", ")}` });
    }

    const assigneeId =
      req.user.role === "ADMIN" && req.body.assignedToId
        ? Number(req.body.assignedToId)
        : req.user.id;

    const newCase = await prisma.verificationCase.create({
      data: {
        caseNumber: req.body.caseNumber || (await generateCaseNumber()),
        title: req.body.title,
        sourceName: req.body.sourceName,
        sourceType: req.body.sourceType,
        issueCategory: req.body.issueCategory,
        priority: req.body.priority || "MEDIUM",
        status: req.body.status || "NEW",
        description: req.body.description,
        recommendation: req.body.recommendation || "",
        itComment: req.body.itComment || "",
        reportNote: req.body.reportNote || "",
        assignedToId: assigneeId,
        createdById: req.user.id,
      },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, role: true },
        },
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    await logAudit({
      userId: req.user.id,
      action: "CREATE",
      entity: "CASE",
      entityId: newCase.id,
      details: { caseNumber: newCase.caseNumber, title: newCase.title },
    });

    res.status(201).json(newCase);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", allowRoles("ADMIN", "ANALYST"), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const existingCase = await prisma.verificationCase.findUnique({ where: { id: caseId } });
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found." });
    }

    const assignedToId =
      req.user.role === "ADMIN" && req.body.assignedToId !== undefined
        ? Number(req.body.assignedToId)
        : existingCase.assignedToId;

    const updatedCase = await prisma.verificationCase.update({
      where: { id: caseId },
      data: {
        title: req.body.title ?? existingCase.title,
        sourceName: req.body.sourceName ?? existingCase.sourceName,
        sourceType: req.body.sourceType ?? existingCase.sourceType,
        issueCategory: req.body.issueCategory ?? existingCase.issueCategory,
        priority: req.body.priority ?? existingCase.priority,
        status: req.body.status ?? existingCase.status,
        description: req.body.description ?? existingCase.description,
        recommendation: req.body.recommendation ?? existingCase.recommendation,
        itComment: req.body.itComment ?? existingCase.itComment,
        reportNote: req.body.reportNote ?? existingCase.reportNote,
        assignedToId,
      },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, role: true },
        },
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    await logAudit({
      userId: req.user.id,
      action: "UPDATE",
      entity: "CASE",
      entityId: caseId,
      details: { status: updatedCase.status, priority: updatedCase.priority },
    });

    res.json(updatedCase);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const caseId = Number(req.params.id);
    const existingCase = await prisma.verificationCase.findUnique({ where: { id: caseId } });
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found." });
    }

    await prisma.verificationCase.delete({ where: { id: caseId } });
    await logAudit({
      userId: req.user.id,
      action: "DELETE",
      entity: "CASE",
      entityId: caseId,
      details: { caseNumber: existingCase.caseNumber },
    });

    res.json({ message: "Case deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
