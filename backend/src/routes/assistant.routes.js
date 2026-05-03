const express = require("express");
const auth = require("../middleware/auth");
const { generateCase } = require("../utils/generateCase");
const { requireFields } = require("../utils/validation");

const router = express.Router();

router.use(auth);

router.post("/generate", async (req, res, next) => {
  try {
    const missing = requireFields(req.body, [
      "sourceName",
      "sourceType",
      "issueCategory",
      "shortDescription",
    ]);
    if (missing.length) {
      return res.status(400).json({ message: `Required fields: ${missing.join(", ")}` });
    }

    const result = generateCase(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
