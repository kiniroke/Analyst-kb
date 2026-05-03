const prisma = require("../prisma");
const { writeAuditLog } = require("../services/auditLogger.service");

async function listKnowledge(req, res) {
  const { search, category } = req.query;
  const where = {};
  if (search) {
    where.OR = [{ title: { contains: search } }, { summary: { contains: search } }, { content: { contains: search } }];
  }
  if (category) {
    where.category = category;
  }

  const articles = await prisma.knowledgeArticle.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: {
        select: { id: true, fullName: true },
      },
    },
  });

  res.json(
    articles.map((article) => ({
      ...article,
      steps: JSON.parse(article.steps || "[]"),
    }))
  );
}

async function getKnowledge(req, res) {
  const article = await prisma.knowledgeArticle.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      createdBy: {
        select: { id: true, fullName: true },
      },
    },
  });
  if (!article) {
    return res.status(404).json({ message: "Knowledge article not found." });
  }
  res.json({ ...article, steps: JSON.parse(article.steps || "[]") });
}

async function createKnowledge(req, res) {
  const { title, category, summary, content, steps } = req.body;
  if (!title || !category || !summary || !content || !steps) {
    return res.status(400).json({ message: "title, category, summary, content and steps are required." });
  }

  const article = await prisma.knowledgeArticle.create({
    data: {
      title,
      category,
      summary,
      content,
      steps: JSON.stringify(Array.isArray(steps) ? steps : String(steps).split("\n").filter(Boolean)),
      createdById: req.user.id,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "CREATE",
    entity: "KNOWLEDGE_ARTICLE",
    entityId: article.id,
    details: { title: article.title },
  });

  res.status(201).json(article);
}

async function updateKnowledge(req, res) {
  const articleId = Number(req.params.id);
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id: articleId } });
  if (!existing) {
    return res.status(404).json({ message: "Knowledge article not found." });
  }

  const article = await prisma.knowledgeArticle.update({
    where: { id: articleId },
    data: {
      title: req.body.title ?? existing.title,
      category: req.body.category ?? existing.category,
      summary: req.body.summary ?? existing.summary,
      content: req.body.content ?? existing.content,
      steps: req.body.steps !== undefined ? JSON.stringify(Array.isArray(req.body.steps) ? req.body.steps : String(req.body.steps).split("\n").filter(Boolean)) : existing.steps,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "UPDATE",
    entity: "KNOWLEDGE_ARTICLE",
    entityId: article.id,
    details: { title: article.title },
  });

  res.json(article);
}

async function deleteKnowledge(req, res) {
  const articleId = Number(req.params.id);
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id: articleId } });
  if (!existing) {
    return res.status(404).json({ message: "Knowledge article not found." });
  }

  await prisma.knowledgeArticle.delete({ where: { id: articleId } });
  await writeAuditLog({
    userId: req.user.id,
    action: "DELETE",
    entity: "KNOWLEDGE_ARTICLE",
    entityId: articleId,
    details: { title: existing.title },
  });

  res.json({ message: "Knowledge article deleted successfully." });
}

module.exports = {
  listKnowledge,
  getKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
};
