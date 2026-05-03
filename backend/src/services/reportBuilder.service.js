const prisma = require("../prisma");
const createCsv = require("../utils/createCsv");

async function buildDashboardSummary() {
  const [
    totalSources,
    sourcesNeedingReview,
    sourcesTestedToday,
    errorExtractionRuns,
    latestExtractionRuns,
    csiBatchesUploaded,
    coverageChecks,
    averageCoverage,
    missingInCsiCount,
    openIssues,
    openTasks,
    issuesByType,
    tasksByStatus,
    extractionStatuses,
    sourceStatuses,
    coverageStatuses,
    latestCoverageChecks,
    criticalIssues,
    latestIssues,
  ] = await Promise.all([
    prisma.newsSource.count(),
    prisma.newsSource.count({ where: { status: "NEEDS_REVIEW" } }),
    prisma.extractionRun.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.extractionRun.count({ where: { status: "ERROR" } }),
    prisma.extractionRun.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { source: true },
    }),
    prisma.csiDataBatch.count(),
    prisma.coverageCheck.count(),
    prisma.coverageCheck.aggregate({ _avg: { coveragePercent: true } }),
    prisma.coverageMatchResult.count({ where: { matchStatus: "MISSING_IN_CSI" } }),
    prisma.dataIssue.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.dataIssue.groupBy({ by: ["issueType"], _count: { issueType: true } }),
    prisma.task.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.extractionRun.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.newsSource.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.coverageCheck.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.coverageCheck.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { source: true, csiBatch: true },
    }),
    prisma.dataIssue.findMany({
      where: { severity: "CRITICAL" },
      include: { source: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.dataIssue.findMany({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
      include: { source: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const coverageBySource = await prisma.coverageCheck.findMany({
    orderBy: { checkedAt: "desc" },
    distinct: ["sourceId"],
    include: { source: true },
  });

  const matchStatuses = await prisma.coverageMatchResult.groupBy({
    by: ["matchStatus"],
    _count: { matchStatus: true },
  });

  return {
    cards: {
      totalSources,
      sourcesNeedingReview,
      sourcesTestedToday,
      errorExtractionRuns,
      latestExtractionRuns: latestExtractionRuns.length,
      csiBatchesUploaded,
      coverageChecks,
      averageCoveragePercent: Number((averageCoverage._avg.coveragePercent || 0).toFixed(2)),
      missingInCsiCount,
      openIssues,
      openTasks,
    },
    charts: {
      coverageBySource: coverageBySource.map((item) => ({
        source: item.source.name,
        coveragePercent: item.coveragePercent,
      })),
      extractionStatuses: extractionStatuses.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      sourceStatuses: sourceStatuses.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      coverageStatuses: coverageStatuses.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      matchStatuses: matchStatuses.map((item) => ({
        status: item.matchStatus,
        count: item._count.matchStatus,
      })),
      issuesByType: issuesByType.map((item) => ({
        issueType: item.issueType,
        count: item._count.issueType,
      })),
      tasksByStatus: tasksByStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
    },
    recentExtractionRuns: latestExtractionRuns,
    recentCoverageChecks: latestCoverageChecks,
    criticalIssues,
    recentIssues: latestIssues,
  };
}

async function buildParserCoverageTextReport(coverageCheckId) {
  const coverageCheck = await prisma.coverageCheck.findUnique({
    where: { id: Number(coverageCheckId) },
    include: {
      source: true,
      extractionRun: true,
      csiBatch: true,
      matchResults: {
        include: {
          extractedNews: true,
          csiRecord: true,
        },
      },
    },
  });

  if (!coverageCheck) {
    const error = new Error("Coverage check not found.");
    error.status = 404;
    throw error;
  }

  const missing = coverageCheck.matchResults.filter((item) => item.matchStatus === "MISSING_IN_CSI");
  const duplicates = coverageCheck.matchResults.filter((item) => item.matchStatus === "DUPLICATE_IN_CSI");
  const mismatches = coverageCheck.matchResults.filter((item) => ["TITLE_MISMATCH", "URL_MISMATCH", "DATE_MISMATCH", "LOW_CONFIDENCE"].includes(item.matchStatus));

  return [
    "Parser Coverage Validator Report",
    `Generated: ${new Date().toISOString()}`,
    `Source name: ${coverageCheck.source.name}`,
    `Period: ${coverageCheck.periodFrom ? coverageCheck.periodFrom.toISOString() : "Not set"} to ${coverageCheck.periodTo ? coverageCheck.periodTo.toISOString() : "Not set"}`,
    `Extraction run timestamp: ${coverageCheck.extractionRun.createdAt.toISOString()}`,
    `CSI batch source: ${coverageCheck.csiBatch?.sourceLabel || "CSI data required"}`,
    `Source items count: ${coverageCheck.sourceItemsCount}`,
    `CSI items count: ${coverageCheck.csiItemsCount}`,
    `Coverage percent: ${coverageCheck.coveragePercent}`,
    `Missing items: ${coverageCheck.missingCount}`,
    `Duplicates: ${coverageCheck.duplicateCount}`,
    `Mismatches: ${coverageCheck.mismatchCount}`,
    "",
    "Missing items:",
    ...missing.map((item) => `- ${item.extractedNews?.title || "Unknown item"}`),
    "",
    "Duplicates:",
    ...duplicates.map((item) => `- ${item.extractedNews?.title || "Unknown item"}`),
    "",
    "Mismatches:",
    ...mismatches.map((item) => `- ${item.matchStatus}: ${item.extractedNews?.title || item.csiRecord?.title || "Unknown item"}`),
    "",
    "Recommendations:",
    "- Check parser schedule, selectors and source mapping for missing items.",
    "- Check deduplication logic for duplicates.",
    "- Check title cleaning and timezone handling for mismatches.",
  ].join("\n");
}

function toCsvResponse(rows) {
  return createCsv(rows);
}

module.exports = {
  buildDashboardSummary,
  buildParserCoverageTextReport,
  toCsvResponse,
};
