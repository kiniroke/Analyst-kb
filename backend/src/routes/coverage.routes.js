const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/coverage.controller");

const router = express.Router();

router.use(auth);

router.post("/run", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.runCoverage));
router.get("/", asyncHandler(controller.listCoverage));
router.get("/:id", asyncHandler(controller.getCoverage));
router.get("/:id/results", asyncHandler(controller.getCoverageResults));
router.post("/:id/create-issues", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.createIssues));

module.exports = router;
