const { parse } = require("csv-parse/sync");
const xlsx = require("xlsx");
const prisma = require("../prisma");
const normalizeUrl = require("../utils/normalizeUrl");
const normalizeTitle = require("../utils/normalizeTitle");
const { parseDateValue } = require("../utils/dateParser");

const columnAliases = {
  title: ["title", "publication", "text", "caption", "headline", "заголовок"],
  url: ["url", "sourceurl", "link", "ссылка"],
  date: ["date", "publishedat", "publicationdate", "datetime", "дата"],
  sourceName: ["source", "smi", "author", "sourceName", "источник"],
  platform: ["platform", "socialplatform", "платформа"],
  tone: ["tone", "sentiment", "тональность"],
  region: ["region", "регион"],
  author: ["author", "автор"],
};

function normalizeColumnName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-zа-я0-9]/gi, "");
}

function detectMapping(headers) {
  const normalized = headers.map((header) => ({
    original: header,
    normalized: normalizeColumnName(header),
  }));

  const mapping = {};
  for (const [field, aliases] of Object.entries(columnAliases)) {
    const match = normalized.find((header) => aliases.includes(header.normalized));
    mapping[field] = match?.original || null;
  }
  return mapping;
}

function mapRow(row, mapping) {
  const title = mapping.title ? row[mapping.title] : "";
  const url = mapping.url ? row[mapping.url] : "";
  const rawDate = mapping.date ? row[mapping.date] : "";

  return {
    sourceName: mapping.sourceName ? String(row[mapping.sourceName] || "").trim() : "",
    title: String(title || "").trim(),
    normalizedTitle: normalizeTitle(title),
    url: String(url || "").trim(),
    normalizedUrl: normalizeUrl(url),
    publishedAt: parseDateValue(rawDate),
    rawDate: rawDate ? String(rawDate).trim() : "",
    author: mapping.author ? String(row[mapping.author] || "").trim() : "",
    platform: mapping.platform ? String(row[mapping.platform] || "").trim() : "",
    tone: mapping.tone ? String(row[mapping.tone] || "").trim() : "",
    region: mapping.region ? String(row[mapping.region] || "").trim() : "",
  };
}

function parseBuffer(file) {
  const extension = file.originalname.split(".").pop().toLowerCase();
  if (extension === "csv") {
    const text = file.buffer.toString("utf-8");
    return parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true });
  }

  const workbook = xlsx.read(file.buffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(firstSheet, { defval: "" });
}

async function previewImport(file) {
  if (!file) {
    const error = new Error("Export file is required.");
    error.status = 400;
    throw error;
  }

  const rows = parseBuffer(file);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const mapping = detectMapping(headers);
  const mappedRows = rows.map((row) => mapRow(row, mapping));

  return {
    fileName: file.originalname,
    headers,
    mapping,
    totalRows: mappedRows.length,
    previewRows: mappedRows.slice(0, 10),
    acceptedColumns: columnAliases,
  };
}

async function confirmImport({ file, uploadedById, mode = "EXPORT", apiEndpoint = null, periodFrom = null, periodTo = null, sourceLabel = null }) {
  const preview = await previewImport(file);
  const rows = parseBuffer(file);
  const mappedRows = rows.map((row) => mapRow(row, preview.mapping));

  const batch = await prisma.csiDataBatch.create({
    data: {
      mode,
      fileName: file.originalname,
      apiEndpoint,
      periodFrom: periodFrom ? new Date(periodFrom) : null,
      periodTo: periodTo ? new Date(periodTo) : null,
      totalRows: mappedRows.length,
      successfulRows: mappedRows.filter((row) => row.title).length,
      failedRows: mappedRows.filter((row) => !row.title).length,
      sourceLabel: sourceLabel || "Imported from CSI export file",
      uploadedById,
    },
  });

  const records = mappedRows
    .filter((row) => row.title)
    .map((row) => ({
      batchId: batch.id,
      sourceName: row.sourceName,
      title: row.title,
      url: row.url || null,
      normalizedUrl: row.normalizedUrl || null,
      publishedAt: row.publishedAt,
      rawDate: row.rawDate || null,
      author: row.author || null,
      platform: row.platform || null,
      tone: row.tone || null,
      region: row.region || null,
      importedAt: new Date(),
    }));

  if (records.length) {
    await prisma.csiRecord.createMany({ data: records });
  }

  return prisma.csiDataBatch.findUnique({
    where: { id: batch.id },
    include: {
      records: {
        take: 10,
      },
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

async function createManualBatch({ uploadedById, records, sourceLabel, periodFrom, periodTo }) {
  const rows = Array.isArray(records) ? records : [];
  const mappedRows = rows.map((row) => ({
    sourceName: String(row.sourceName || row.source || "").trim(),
    title: String(row.title || "").trim(),
    url: String(row.url || row.link || "").trim(),
    normalizedUrl: normalizeUrl(row.url || row.link || ""),
    publishedAt: parseDateValue(row.publishedAt || row.date || row.publicationDate),
    rawDate: String(row.publishedAt || row.date || row.publicationDate || "").trim(),
    author: String(row.author || "").trim(),
    platform: String(row.platform || "").trim(),
    tone: String(row.tone || "").trim(),
    region: String(row.region || "").trim(),
  }));

  const batch = await prisma.csiDataBatch.create({
    data: {
      mode: "MANUAL",
      fileName: "manual.json",
      periodFrom: periodFrom ? new Date(periodFrom) : null,
      periodTo: periodTo ? new Date(periodTo) : null,
      totalRows: mappedRows.length,
      successfulRows: mappedRows.filter((row) => row.title).length,
      failedRows: mappedRows.filter((row) => !row.title).length,
      sourceLabel: sourceLabel || "Manual JSON input",
      uploadedById,
    },
  });

  await prisma.csiRecord.createMany({
    data: mappedRows
      .filter((row) => row.title)
      .map((row) => ({
        ...row,
        batchId: batch.id,
        url: row.url || null,
        normalizedUrl: row.normalizedUrl || null,
        importedAt: new Date(),
      })),
  });

  return prisma.csiDataBatch.findUnique({
    where: { id: batch.id },
    include: {
      records: true,
    },
  });
}

module.exports = {
  previewImport,
  confirmImport,
  createManualBatch,
  detectMapping,
  mapRow,
};
