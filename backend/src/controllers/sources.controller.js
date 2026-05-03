const prisma = require("../prisma");
const normalizeUrl = require("../utils/normalizeUrl");
const createCsv = require("../utils/createCsv");
const { writeAuditLog } = require("../services/auditLogger.service");

async function listSources(req, res) {
  const { search, status, sourceType, region, exportCsv } = req.query;
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { baseUrl: { contains: search } },
      { newsListUrl: { contains: search } },
    ];
  }
  if (status) {
    where.status = status;
  }
  if (sourceType) {
    where.sourceType = sourceType;
  }
  if (region) {
    where.region = { contains: region };
  }

  const sources = await prisma.newsSource.findMany({
    where,
    orderBy: { name: "asc" },
  });

  if (exportCsv === "true") {
    const csv = createCsv(
      sources.map((source) => ({
        name: source.name,
        baseUrl: source.baseUrl,
        newsListUrl: source.newsListUrl,
        sourceType: source.sourceType,
        region: source.region,
        status: source.status,
        lastExtractionStatus: source.lastExtractionStatus,
      }))
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="sources.csv"');
    return res.send(csv);
  }

  return res.json(sources);
}

async function getSource(req, res) {
  const source = await prisma.newsSource.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      extractionRuns: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      coverageChecks: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      issues: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!source) {
    return res.status(404).json({ message: "Source not found." });
  }

  return res.json(source);
}

async function createSource(req, res) {
  const { name, baseUrl } = req.body;
  if (!name || !baseUrl) {
    return res.status(400).json({ message: "name and baseUrl are required." });
  }

  const source = await prisma.newsSource.create({
    data: {
      name,
      baseUrl,
      newsListUrl: req.body.newsListUrl || baseUrl,
      normalizedUrl: normalizeUrl(req.body.newsListUrl || baseUrl),
      sourceType: req.body.sourceType || "OTHER",
      aggregationLevel: req.body.aggregationLevel || "UNKNOWN",
      region: req.body.region || "",
      language: req.body.language || "",
      watcher: req.body.watcher || "",
      status: req.body.status || "ACTIVE",
      titleSelector: req.body.titleSelector || "",
      linkSelector: req.body.linkSelector || "",
      dateSelector: req.body.dateSelector || "",
      containerSelector: req.body.containerSelector || "",
      notes: req.body.notes || "",
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "CREATE",
    entity: "NEWS_SOURCE",
    entityId: source.id,
    details: { name: source.name },
  });

  return res.status(201).json(source);
}

async function updateSource(req, res) {
  const sourceId = Number(req.params.id);
  const existing = await prisma.newsSource.findUnique({ where: { id: sourceId } });
  if (!existing) {
    return res.status(404).json({ message: "Source not found." });
  }

  const source = await prisma.newsSource.update({
    where: { id: sourceId },
    data: {
      name: req.body.name ?? existing.name,
      baseUrl: req.body.baseUrl ?? existing.baseUrl,
      newsListUrl: req.body.newsListUrl ?? existing.newsListUrl,
      normalizedUrl: normalizeUrl(req.body.newsListUrl ?? existing.newsListUrl ?? req.body.baseUrl ?? existing.baseUrl),
      sourceType: req.body.sourceType ?? existing.sourceType,
      aggregationLevel: req.body.aggregationLevel ?? existing.aggregationLevel,
      region: req.body.region ?? existing.region,
      language: req.body.language ?? existing.language,
      watcher: req.body.watcher ?? existing.watcher,
      status: req.body.status ?? existing.status,
      titleSelector: req.body.titleSelector ?? existing.titleSelector,
      linkSelector: req.body.linkSelector ?? existing.linkSelector,
      dateSelector: req.body.dateSelector ?? existing.dateSelector,
      containerSelector: req.body.containerSelector ?? existing.containerSelector,
      notes: req.body.notes ?? existing.notes,
    },
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "UPDATE",
    entity: "NEWS_SOURCE",
    entityId: source.id,
    details: { name: source.name },
  });

  return res.json(source);
}

async function deleteSource(req, res) {
  const sourceId = Number(req.params.id);
  const existing = await prisma.newsSource.findUnique({ where: { id: sourceId } });
  if (!existing) {
    return res.status(404).json({ message: "Source not found." });
  }

  await prisma.newsSource.delete({ where: { id: sourceId } });
  await writeAuditLog({
    userId: req.user.id,
    action: "DELETE",
    entity: "NEWS_SOURCE",
    entityId: sourceId,
    details: { name: existing.name },
  });

  return res.json({ message: "Source deleted successfully." });
}

module.exports = {
  listSources,
  getSource,
  createSource,
  updateSource,
  deleteSource,
};
