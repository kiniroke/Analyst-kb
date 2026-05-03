const prisma = require("../prisma");
const { runExtractionBySourceId, executeExtraction } = require("../services/newsExtractor.service");
const { writeAuditLog } = require("../services/auditLogger.service");

async function runExtraction(req, res) {
  const result = await runExtractionBySourceId(req.params.sourceId, {
    createdById: req.user.id,
    persist: true,
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "RUN",
    entity: "EXTRACTION_RUN",
    entityId: result.run?.id,
    details: { sourceId: req.params.sourceId, status: result.status },
  });

  res.json(result);
}

async function testSelectors(req, res) {
  const source = await prisma.newsSource.findUnique({ where: { id: Number(req.body.sourceId) } });
  if (!source) {
    return res.status(404).json({ message: "Source not found." });
  }

  const result = await executeExtraction(source, {
    createdById: req.user.id,
    persist: false,
    overrideSelectors: {
      containerSelector: req.body.containerSelector,
      titleSelector: req.body.titleSelector,
      linkSelector: req.body.linkSelector,
      dateSelector: req.body.dateSelector,
    },
  });

  return res.json(result);
}

async function listRuns(req, res) {
  const runs = await prisma.extractionRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      source: true,
    },
  });
  res.json(runs);
}

async function getRun(req, res) {
  const run = await prisma.extractionRun.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      source: true,
      extractedItems: true,
    },
  });

  if (!run) {
    return res.status(404).json({ message: "Extraction run not found." });
  }

  res.json(run);
}

async function getRunsBySource(req, res) {
  const runs = await prisma.extractionRun.findMany({
    where: { sourceId: Number(req.params.sourceId) },
    orderBy: { createdAt: "desc" },
    include: {
      source: true,
    },
  });
  res.json(runs);
}

async function getRunItems(req, res) {
  const items = await prisma.extractedNewsItem.findMany({
    where: { extractionRunId: Number(req.params.runId) },
    orderBy: { position: "asc" },
  });
  res.json(items);
}

module.exports = {
  runExtraction,
  testSelectors,
  listRuns,
  getRun,
  getRunsBySource,
  getRunItems,
};
