const prisma = require("../prisma");
const { previewImport, confirmImport, createManualBatch } = require("../services/csiImport.service");
const { loadFromCsiApi } = require("../services/csiApi.service");
const { writeAuditLog } = require("../services/auditLogger.service");

async function previewImportController(req, res) {
  const result = await previewImport(req.file);
  res.json(result);
}

async function confirmImportController(req, res) {
  const batch = await confirmImport({
    file: req.file,
    uploadedById: req.user.id,
    mode: "EXPORT",
    periodFrom: req.body.periodFrom,
    periodTo: req.body.periodTo,
    sourceLabel: "Imported from CSI export file",
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "IMPORT",
    entity: "CSI_BATCH",
    entityId: batch.id,
    details: { mode: "EXPORT", fileName: batch.fileName },
  });

  res.status(201).json(batch);
}

async function loadApiController(req, res) {
  const batch = await loadFromCsiApi({
    uploadedById: req.user.id,
    endpoint: req.body.apiEndpoint,
    method: req.body.method || "GET",
    token: req.body.token,
    cookie: req.body.cookie,
    payload: req.body.payload,
    periodFrom: req.body.periodFrom,
    periodTo: req.body.periodTo,
    sourceLabel: "Loaded from CSI API",
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "IMPORT",
    entity: "CSI_BATCH",
    entityId: batch.id,
    details: { mode: "API", apiEndpoint: req.body.apiEndpoint },
  });

  res.status(201).json(batch);
}

async function manualController(req, res) {
  const batch = await createManualBatch({
    uploadedById: req.user.id,
    records: req.body.records,
    sourceLabel: "Manual JSON input",
    periodFrom: req.body.periodFrom,
    periodTo: req.body.periodTo,
  });

  await writeAuditLog({
    userId: req.user.id,
    action: "IMPORT",
    entity: "CSI_BATCH",
    entityId: batch.id,
    details: { mode: "MANUAL" },
  });

  res.status(201).json(batch);
}

async function listBatches(req, res) {
  const batches = await prisma.csiDataBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
  res.json(batches);
}

async function getBatch(req, res) {
  const batch = await prisma.csiDataBatch.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
  if (!batch) {
    return res.status(404).json({ message: "CSI batch not found." });
  }
  res.json(batch);
}

async function getBatchRecords(req, res) {
  const records = await prisma.csiRecord.findMany({
    where: { batchId: Number(req.params.batchId) },
    orderBy: { createdAt: "desc" },
  });
  res.json(records);
}

module.exports = {
  previewImportController,
  confirmImportController,
  loadApiController,
  manualController,
  listBatches,
  getBatch,
  getBatchRecords,
};
