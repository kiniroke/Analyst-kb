const prisma = require("../prisma");
const { runCoverageCheck } = require("../services/coverageMatcher.service");
const { createIssuesFromCoverage } = require("../services/issueGenerator.service");
const { writeAuditLog } = require("../services/auditLogger.service");

async function runCoverage(req, res) {
  if (!req.body.extractionRunId) {
    return res.status(400).json({ message: "extractionRunId is required." });
  }

  const result = await runCoverageCheck({
    sourceId: req.body.sourceId,
    extractionRunId: req.body.extractionRunId,
    csiBatchId: req.body.csiBatchId || null,
    periodFrom: req.body.periodFrom,
    periodTo: req.body.periodTo,
    createdById: req.user.id,
    sourceNameFilter: req.body.sourceNameFilter,
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "RUN",
    entity: "COVERAGE_CHECK",
    entityId: result.id,
    details: { status: result.status, coveragePercent: result.coveragePercent },
  });

  res.status(201).json(result);
}

async function listCoverage(req, res) {
  const checks = await prisma.coverageCheck.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      source: true,
      extractionRun: true,
      csiBatch: true,
    },
  });
  res.json(checks);
}

async function getCoverage(req, res) {
  const check = await prisma.coverageCheck.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      source: true,
      extractionRun: true,
      csiBatch: true,
      issues: true,
    },
  });
  if (!check) {
    return res.status(404).json({ message: "Coverage check not found." });
  }
  res.json(check);
}

async function getCoverageResults(req, res) {
  const results = await prisma.coverageMatchResult.findMany({
    where: { coverageCheckId: Number(req.params.id) },
    orderBy: { createdAt: "asc" },
    include: {
      extractedNews: true,
      csiRecord: true,
    },
  });
  res.json(results);
}

async function createIssues(req, res) {
  const created = await createIssuesFromCoverage({
    coverageCheckId: req.params.id,
    createdById: req.user.id,
    assignedToId: req.body.assignedToId || null,
    selectedStatuses: req.body.selectedStatuses || [],
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "CREATE",
    entity: "DATA_ISSUE",
    entityId: req.params.id,
    details: { createdCount: created.length, fromCoverageCheckId: req.params.id },
  });

  res.status(201).json(created);
}

module.exports = {
  runCoverage,
  listCoverage,
  getCoverage,
  getCoverageResults,
  createIssues,
};
