const prisma = require("../prisma");
const normalizeTitle = require("../utils/normalizeTitle");
const normalizeUrl = require("../utils/normalizeUrl");
const similarity = require("../utils/similarity");

function datesDiffer(left, right) {
  if (!left || !right) {
    return false;
  }
  return Math.abs(new Date(left).getTime() - new Date(right).getTime()) > 12 * 60 * 60 * 1000;
}

function buildEvidence(payload) {
  return JSON.stringify(payload);
}

function parsePeriodStart(value) {
  if (!value) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  return new Date(value);
}

function parsePeriodEnd(value) {
  if (!value) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return new Date(`${value}T23:59:59.999Z`);
  }
  return new Date(value);
}

async function runCoverageCheck({ sourceId, extractionRunId, csiBatchId, periodFrom, periodTo, createdById, sourceNameFilter }) {
  const source = await prisma.newsSource.findUnique({ where: { id: Number(sourceId) } });
  if (!source) {
    const error = new Error("Source not found.");
    error.status = 404;
    throw error;
  }

  const extractionRun = await prisma.extractionRun.findUnique({
    where: { id: Number(extractionRunId) },
    include: { extractedItems: true },
  });

  if (!extractionRun) {
    const error = new Error("Extraction run not found.");
    error.status = 404;
    throw error;
  }

  if (!csiBatchId) {
    return prisma.coverageCheck.create({
      data: {
        sourceId: source.id,
        extractionRunId: extractionRun.id,
        checkedAt: new Date(),
        periodFrom: parsePeriodStart(periodFrom),
        periodTo: parsePeriodEnd(periodTo),
        status: "CSI_DATA_REQUIRED",
        sourceItemsCount: extractionRun.extractedItems.length,
        csiItemsCount: 0,
        matchedCount: 0,
        missingCount: 0,
        duplicateCount: 0,
        mismatchCount: 0,
        coveragePercent: 0,
        summary: "CSI data required for coverage check.",
        createdById,
      },
    });
  }

  const csiBatch = await prisma.csiDataBatch.findUnique({
    where: { id: Number(csiBatchId) },
    include: { records: true },
  });

  if (!csiBatch) {
    const error = new Error("CSI data batch not found.");
    error.status = 404;
    throw error;
  }

  let records = csiBatch.records;
  if (sourceNameFilter) {
    const filter = sourceNameFilter.toLowerCase();
    records = records.filter((record) => (record.sourceName || "").toLowerCase().includes(filter));
  }
  if (periodFrom) {
    const from = parsePeriodStart(periodFrom).getTime();
    records = records.filter((record) => !record.publishedAt || new Date(record.publishedAt).getTime() >= from);
  }
  if (periodTo) {
    const to = parsePeriodEnd(periodTo).getTime();
    records = records.filter((record) => !record.publishedAt || new Date(record.publishedAt).getTime() <= to);
  }

  const results = [];
  const usedRecordIds = new Set();
  let matchedCount = 0;
  let missingCount = 0;
  let duplicateCount = 0;
  let mismatchCount = 0;

  for (const item of extractionRun.extractedItems) {
    const normalizedItemUrl = normalizeUrl(item.normalizedUrl || item.url);
    const exactUrlMatches = records.filter((record) => record.normalizedUrl && record.normalizedUrl === normalizedItemUrl);

    if (exactUrlMatches.length > 1) {
      duplicateCount += 1;
      exactUrlMatches.forEach((record) => usedRecordIds.add(record.id));
      results.push({
        extractedNewsId: item.id,
        csiRecordId: exactUrlMatches[0].id,
        matchStatus: "DUPLICATE_IN_CSI",
        matchScore: 1,
        evidence: buildEvidence({
          reason: "Multiple CSI records share the same normalized URL.",
          duplicateRecordIds: exactUrlMatches.map((record) => record.id),
        }),
      });
      continue;
    }

    if (exactUrlMatches.length === 1) {
      const record = exactUrlMatches[0];
      usedRecordIds.add(record.id);
      const titleScore = similarity(item.title, record.title);

      if (datesDiffer(item.publishedAt, record.publishedAt)) {
        mismatchCount += 1;
        results.push({
          extractedNewsId: item.id,
          csiRecordId: record.id,
          matchStatus: "DATE_MISMATCH",
          matchScore: titleScore || 1,
          evidence: buildEvidence({
            reason: "Exact URL match but publication date differs significantly.",
            extractedDate: item.publishedAt,
            csiDate: record.publishedAt,
          }),
        });
      } else if (titleScore < 0.65) {
        mismatchCount += 1;
        results.push({
          extractedNewsId: item.id,
          csiRecordId: record.id,
          matchStatus: "TITLE_MISMATCH",
          matchScore: titleScore,
          evidence: buildEvidence({
            reason: "Exact URL match but title similarity is low.",
            extractedTitle: item.title,
            csiTitle: record.title,
          }),
        });
      } else {
        matchedCount += 1;
        results.push({
          extractedNewsId: item.id,
          csiRecordId: record.id,
          matchStatus: "MATCHED",
          matchScore: 1,
          evidence: buildEvidence({
            reason: "Exact normalized URL match.",
            extractedUrl: item.url,
            csiUrl: record.url,
          }),
        });
      }
      continue;
    }

    let bestMatch = null;
    for (const record of records) {
      const score = similarity(item.title, record.title);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { record, score };
      }
    }

    if (bestMatch && bestMatch.score >= 0.85) {
      usedRecordIds.add(bestMatch.record.id);
      const status = bestMatch.record.normalizedUrl && normalizedItemUrl && bestMatch.record.normalizedUrl !== normalizedItemUrl
        ? "URL_MISMATCH"
        : "MATCHED";

      if (status === "MATCHED") {
        matchedCount += 1;
      } else {
        mismatchCount += 1;
      }

      results.push({
        extractedNewsId: item.id,
        csiRecordId: bestMatch.record.id,
        matchStatus: status,
        matchScore: bestMatch.score,
        evidence: buildEvidence({
          reason: "High title similarity match.",
          extractedTitle: item.title,
          csiTitle: bestMatch.record.title,
          extractedUrl: item.url,
          csiUrl: bestMatch.record.url,
        }),
      });
      continue;
    }

    if (bestMatch && bestMatch.score >= 0.7) {
      mismatchCount += 1;
      usedRecordIds.add(bestMatch.record.id);
      results.push({
        extractedNewsId: item.id,
        csiRecordId: bestMatch.record.id,
        matchStatus: "LOW_CONFIDENCE",
        matchScore: bestMatch.score,
        evidence: buildEvidence({
          reason: "Moderate title similarity; manual analyst verification required.",
          extractedTitle: item.title,
          csiTitle: bestMatch.record.title,
        }),
      });
      continue;
    }

    missingCount += 1;
    results.push({
      extractedNewsId: item.id,
      csiRecordId: null,
      matchStatus: "MISSING_IN_CSI",
      matchScore: 0,
      evidence: buildEvidence({
        reason: "No suitable CSI match found for extracted news item.",
        extractedTitle: item.title,
        extractedUrl: item.url,
      }),
    });
  }

  const extraRecords = records.filter((record) => !usedRecordIds.has(record.id));
  for (const record of extraRecords) {
    results.push({
      extractedNewsId: null,
      csiRecordId: record.id,
      matchStatus: "EXTRA_IN_CSI",
      matchScore: 0,
      evidence: buildEvidence({
        reason: "CSI record has no matching extracted source item.",
        csiTitle: record.title,
        csiUrl: record.url,
      }),
    });
  }

  const coveragePercent = extractionRun.extractedItems.length
    ? Number(((matchedCount / extractionRun.extractedItems.length) * 100).toFixed(2))
    : 0;
  const status = coveragePercent >= 80 ? "OK" : coveragePercent >= 40 ? "PARTIAL" : "FAILED";

  const coverageCheck = await prisma.coverageCheck.create({
    data: {
      sourceId: source.id,
      extractionRunId: extractionRun.id,
      csiBatchId: csiBatch.id,
      checkedAt: new Date(),
      periodFrom: parsePeriodStart(periodFrom),
      periodTo: parsePeriodEnd(periodTo),
      status,
      sourceItemsCount: extractionRun.extractedItems.length,
      csiItemsCount: records.length,
      matchedCount,
      missingCount,
      duplicateCount,
      mismatchCount,
      coveragePercent,
      summary: `Coverage check completed for ${source.name}.`,
      createdById,
    },
  });

  await prisma.coverageMatchResult.createMany({
    data: results.map((result) => ({
      coverageCheckId: coverageCheck.id,
      extractedNewsId: result.extractedNewsId,
      csiRecordId: result.csiRecordId,
      matchStatus: result.matchStatus,
      matchScore: result.matchScore,
      evidence: result.evidence,
    })),
  });

  return prisma.coverageCheck.findUnique({
    where: { id: coverageCheck.id },
    include: {
      source: true,
      csiBatch: true,
      extractionRun: true,
      matchResults: {
        include: {
          extractedNews: true,
          csiRecord: true,
        },
      },
    },
  });
}

module.exports = {
  runCoverageCheck,
};
