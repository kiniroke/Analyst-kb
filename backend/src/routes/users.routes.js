const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const controller = require("../controllers/users.controller");

const router = express.Router();

router.use(auth, requireRole("ADMIN"));

router.get("/", asyncHandler(controller.listUsers));
router.post("/", asyncHandler(controller.createUser));
router.put("/:id", asyncHandler(controller.updateUser));
router.delete("/:id", asyncHandler(controller.deleteUser));

module.exports = router;
