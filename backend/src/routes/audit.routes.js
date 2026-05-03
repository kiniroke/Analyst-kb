const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/audit.controller");

const router = express.Router();

router.use(auth, requireRole("ADMIN"));

router.get("/", asyncHandler(controller.listAuditLogs));

module.exports = router;
