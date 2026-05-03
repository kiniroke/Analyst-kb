const express = require("express");
const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/csiData.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

router.post("/import/preview", requireRole("ADMIN", "ANALYST"), upload.single("file"), asyncHandler(controller.previewImportController));
router.post("/import/confirm", requireRole("ADMIN", "ANALYST"), upload.single("file"), asyncHandler(controller.confirmImportController));
router.post("/api/load", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.loadApiController));
router.post("/manual", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.manualController));
router.get("/batches", asyncHandler(controller.listBatches));
router.get("/batches/:id", asyncHandler(controller.getBatch));
router.get("/records/:batchId", asyncHandler(controller.getBatchRecords));

module.exports = router;
