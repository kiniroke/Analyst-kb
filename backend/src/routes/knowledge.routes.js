const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/knowledge.controller");

const router = express.Router();

router.use(auth);

router.get("/", asyncHandler(controller.listKnowledge));
router.get("/:id", asyncHandler(controller.getKnowledge));
router.post("/", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.createKnowledge));
router.put("/:id", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.updateKnowledge));
router.delete("/:id", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.deleteKnowledge));

module.exports = router;
