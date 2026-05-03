const prisma = require("../prisma");
const createCsv = require("../utils/createCsv");
const { buildDashboardSummary, buildParserCoverageTextReport } = require("../services/reportBuilder.service");

async function getSummary(req, res) {
  const summary = await buildDashboardSummary();
  res.json(summary);
}

async function getParserCoverage(req, res) {
  const checks = await prisma.coverageCheck.findMany({
    orderBy: { checkedAt: "desc" },
    include: {
      source: true,
      csiBatch: true,
    },
  });
  res.json(checks);
}

async function getMissingNews(req, res) {
  const rows = await prisma.coverageMatchResult.findMany({
    where: { matchStatus: "MISSING_IN_CSI" },
    include: {
      extractedNews: true,
      coverageCheck: {
        include: { source: true },
      },
    },
  });
  res.json(rows);
}

async function getDuplicates(req, res) {
  const rows = await prisma.coverageMatchResult.findMany({
    where: { matchStatus: "DUPLICATE_IN_CSI" },
    include: {
      extractedNews: true,
      csiRecord: true,
      coverageCheck: {
        include: { source: true },
      },
    },
  });
  res.json(rows);
}

async function exportSources(req, res) {
  const rows = await prisma.newsSource.findMany({ orderBy: { name: "asc" } });
  const csv = createCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="sources.csv"');
  res.send(csv);
}

async function exportExtractionRuns(req, res) {
  const rows = await prisma.extractionRun.findMany({
    orderBy: { createdAt: "desc" },
    include: { source: true },
  });
  const csv = createCsv(
    rows.map((row) => ({
      id: row.id,
      sourceName: row.source.name,
      status: row.status,
      pageUrl: row.pageUrl,
      httpStatus: row.httpStatus,
      responseTimeMs: row.responseTimeMs,
      itemsFound: row.itemsFound,
      createdAt: row.createdAt.toISOString(),
    }))
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="extraction_runs.csv"');
  res.send(csv);
}

async function exportExtractedNews(req, res) {
  const rows = await prisma.extractedNewsItem.findMany({
    orderBy: { createdAt: "desc" },
  });
  const csv = createCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="extracted_news.csv"');
  res.send(csv);
}

async function exportCsiRecords(req, res) {
  const rows = await prisma.csiRecord.findMany({
    orderBy: { createdAt: "desc" },
  });
  const csv = createCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="csi_records.csv"');
  res.send(csv);
}

async function exportCoverageResults(req, res) {
  const rows = await prisma.coverageMatchResult.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      extractedNews: true,
      csiRecord: true,
    },
  });
  const csv = createCsv(
    rows.map((row) => ({
      id: row.id,
      matchStatus: row.matchStatus,
      matchScore: row.matchScore,
      extractedTitle: row.extractedNews?.title || "",
      extractedUrl: row.extractedNews?.url || "",
      csiTitle: row.csiRecord?.title || "",
      csiUrl: row.csiRecord?.url || "",
      evidence: row.evidence || "",
    }))
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="coverage_results.csv"');
  res.send(csv);
}

async function exportIssues(req, res) {
  const rows = await prisma.dataIssue.findMany({ orderBy: { createdAt: "desc" } });
  const csv = createCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="issues.csv"');
  res.send(csv);
}

async function exportTasks(req, res) {
  const rows = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  const csv = createCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="tasks.csv"');
  res.send(csv);
}

async function exportParserCoverageTxt(req, res) {
  const latestCoverage = await prisma.coverageCheck.findFirst({
    orderBy: { checkedAt: "desc" },
    select: { id: true },
  });

  if (!latestCoverage) {
    return res.status(404).json({ message: "No coverage checks available." });
  }

  const text = await buildParserCoverageTextReport(latestCoverage.id);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="parser_coverage_report.txt"');
  res.send(text);
}

module.exports = {
  getSummary,
  getParserCoverage,
  getMissingNews,
  getDuplicates,
  exportSources,
  exportExtractionRuns,
  exportExtractedNews,
  exportCsiRecords,
  exportCoverageResults,
  exportIssues,
  exportTasks,
  exportParserCoverageTxt,
};
