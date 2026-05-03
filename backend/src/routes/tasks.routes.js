const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/tasks.controller");

const router = express.Router();

router.use(auth);

router.get("/", asyncHandler(controller.listTasks));
router.post("/", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.createTask));
router.put("/:id", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.updateTask));
router.delete("/:id", requireRole("ADMIN", "ANALYST"), asyncHandler(controller.deleteTask));

module.exports = router;
