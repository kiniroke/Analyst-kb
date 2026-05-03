const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const controller = require("../controllers/reports.controller");

const router = express.Router();

router.use(auth);

router.get("/summary", asyncHandler(controller.getSummary));
router.get("/parser-coverage", asyncHandler(controller.getParserCoverage));
router.get("/missing-news", asyncHandler(controller.getMissingNews));
router.get("/duplicates", asyncHandler(controller.getDuplicates));
router.get("/export/sources.csv", asyncHandler(controller.exportSources));
router.get("/export/extraction-runs.csv", asyncHandler(controller.exportExtractionRuns));
router.get("/export/extracted-news.csv", asyncHandler(controller.exportExtractedNews));
router.get("/export/csi-records.csv", asyncHandler(controller.exportCsiRecords));
router.get("/export/coverage-results.csv", asyncHandler(controller.exportCoverageResults));
router.get("/export/issues.csv", asyncHandler(controller.exportIssues));
router.get("/export/tasks.csv", asyncHandler(controller.exportTasks));
router.get("/export/parser-coverage.txt", asyncHandler(controller.exportParserCoverageTxt));

module.exports = router;
