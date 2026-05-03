const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const sourcesRoutes = require("./routes/sources.routes");
const extractionRoutes = require("./routes/extraction.routes");
const csiRoutes = require("./routes/csiData.routes");
const coverageRoutes = require("./routes/coverage.routes");
const issuesRoutes = require("./routes/issues.routes");
const tasksRoutes = require("./routes/tasks.routes");
const knowledgeRoutes = require("./routes/knowledge.routes");
const reportsRoutes = require("./routes/reports.routes");
const auditRoutes = require("./routes/audit.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sources", sourcesRoutes);
app.use("/api/extraction", extractionRoutes);
app.use("/api/csi", csiRoutes);
app.use("/api/coverage", coverageRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

app.use(errorHandler);

module.exports = app;
