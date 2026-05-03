const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/sources.controller");

const router = express.Router();

router.use(auth);

router.get("/", asyncHandler(controller.listSources));
router.get("/:id", asyncHandler(controller.getSource));
router.post("/", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.createSource));
router.put("/:id", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.updateSource));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.deleteSource));

module.exports = router;
