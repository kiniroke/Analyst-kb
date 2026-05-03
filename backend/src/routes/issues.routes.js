const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/issues.controller");

const router = express.Router();

router.use(auth);

router.get("/", asyncHandler(controller.listIssues));
router.get("/:id", asyncHandler(controller.getIssue));
router.post("/", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.createIssue));
router.put("/:id", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.updateIssue));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.deleteIssue));
router.post("/:id/create-task", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.createTaskFromIssue));

module.exports = router;
