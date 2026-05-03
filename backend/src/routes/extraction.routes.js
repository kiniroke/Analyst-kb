const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/extraction.controller");

const router = express.Router();

router.use(auth);

router.post("/run/:sourceId", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.runExtraction));
router.post("/test-selectors", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.testSelectors));
router.get("/runs", asyncHandler(controller.listRuns));
router.get("/runs/:id", asyncHandler(controller.getRun));
router.get("/source/:sourceId", asyncHandler(controller.getRunsBySource));
router.get("/items/:runId", asyncHandler(controller.getRunItems));

module.exports = router;
