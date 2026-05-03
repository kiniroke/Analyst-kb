const prisma = require("../prisma");

const issueRuleMap = {
  MISSING_IN_CSI: {
    title: "Missing news in CSI coverage",
    severity: "HIGH",
    recommendation: "Check parser schedule, selectors and source mapping for this website.",
  },
  DUPLICATE_IN_CSI: {
    title: "Duplicate CSI records detected",
    severity: "MEDIUM",
    recommendation: "Check deduplication logic and unique key based on URL/title.",
  },
  DATE_MISMATCH: {
    title: "Date mismatch between source and CSI",
    severity: "MEDIUM",
    recommendation: "Check date normalization and timezone handling.",
  },
  TITLE_MISMATCH: {
    title: "Title mismatch between source and CSI",
    severity: "MEDIUM",
    recommendation: "Check title extraction and text cleaning logic.",
  },
  URL_MISMATCH: {
    title: "URL mismatch between source and CSI",
    severity: "MEDIUM",
    recommendation: "Check canonical URL normalization and parser link extraction.",
  },
  CSI_DATA_REQUIRED: {
    title: "CSI data required for coverage check",
    severity: "LOW",
    recommendation: "Provide CSI export, CSI API credentials or manual JSON data.",
  },
  EXTRACTION_FAILED: {
    title: "Extraction failed for source",
    severity: "HIGH",
    recommendation: "Check selectors, request blocking and source page availability.",
  },
};

async function createIssueFromResult({ sourceId, coverageCheckId, createdById, assignedToId = null, matchResult }) {
  const rule = issueRuleMap[matchResult.matchStatus] || {
    title: "Coverage validation issue",
    severity: "MEDIUM",
    recommendation: "Review evidence and validate source parsing configuration.",
  };

  return prisma.dataIssue.create({
    data: {
      sourceId,
      coverageCheckId,
      entityId: matchResult.extractedNewsId ? String(matchResult.extractedNewsId) : matchResult.csiRecordId ? String(matchResult.csiRecordId) : null,
      title: rule.title,
      issueType: matchResult.matchStatus,
      severity: rule.severity,
      status: "NEW",
      evidence: matchResult.evidence || null,
      recommendation: rule.recommendation,
      createdById,
      assignedToId,
    },
  });
}

async function createIssuesFromCoverage({ coverageCheckId, createdById, assignedToId = null, selectedStatuses = [] }) {
  const coverageCheck = await prisma.coverageCheck.findUnique({
    where: { id: Number(coverageCheckId) },
    include: {
      matchResults: true,
    },
  });

  if (!coverageCheck) {
    const error = new Error("Coverage check not found.");
    error.status = 404;
    throw error;
  }

  const targetStatuses = selectedStatuses.length
    ? selectedStatuses
    : ["MISSING_IN_CSI", "DUPLICATE_IN_CSI", "DATE_MISMATCH", "TITLE_MISMATCH", "URL_MISMATCH", "CSI_DATA_REQUIRED"];

  const created = [];
  for (const result of coverageCheck.matchResults.filter((item) => targetStatuses.includes(item.matchStatus))) {
    created.push(
      await createIssueFromResult({
        sourceId: coverageCheck.sourceId,
        coverageCheckId: coverageCheck.id,
        createdById,
        assignedToId,
        matchResult: result,
      })
    );
  }

  return created;
}

module.exports = {
  createIssuesFromCoverage,
};
