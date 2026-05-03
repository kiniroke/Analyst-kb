import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";

const endpoints = [
  ["POST", "/api/auth/register", "Register a new viewer account", "No", "Public"],
  ["POST", "/api/auth/login", "Authenticate and receive JWT token", "No", "Public"],
  ["GET", "/api/auth/me", "Get current authenticated user", "Yes", "Any authenticated user"],
  ["GET", "/api/users", "List users", "Yes", "ADMIN"],
  ["POST", "/api/users", "Create user", "Yes", "ADMIN"],
  ["PUT", "/api/users/:id", "Update user", "Yes", "ADMIN"],
  ["DELETE", "/api/users/:id", "Delete user", "Yes", "ADMIN"],
  ["GET", "/api/sources", "List sources", "Yes", "Any authenticated user"],
  ["GET", "/api/sources/:id", "Get source details", "Yes", "Any authenticated user"],
  ["POST", "/api/sources", "Create source", "Yes", "ADMIN, ANALYST"],
  ["PUT", "/api/sources/:id", "Update source", "Yes", "ADMIN, ANALYST"],
  ["DELETE", "/api/sources/:id", "Delete source", "Yes", "ADMIN"],
  ["POST", "/api/extraction/run/:sourceId", "Run extraction for source", "Yes", "ADMIN, ANALYST"],
  ["POST", "/api/extraction/test-selectors", "Test selectors without saving run", "Yes", "ADMIN, ANALYST"],
  ["GET", "/api/extraction/runs", "List extraction runs", "Yes", "Any authenticated user"],
  ["GET", "/api/extraction/runs/:id", "Get extraction run details", "Yes", "Any authenticated user"],
  ["GET", "/api/extraction/source/:sourceId", "List extraction runs for one source", "Yes", "Any authenticated user"],
  ["GET", "/api/extraction/items/:runId", "Get extracted items for run", "Yes", "Any authenticated user"],
  ["POST", "/api/csi/import/preview", "Preview CSI export file mapping", "Yes", "ADMIN, ANALYST"],
  ["POST", "/api/csi/import/confirm", "Confirm CSI export import", "Yes", "ADMIN, ANALYST"],
  ["POST", "/api/csi/api/load", "Load CSI data through provided API credentials", "Yes", "ADMIN, ANALYST"],
  ["POST", "/api/csi/manual", "Create manual CSI batch from JSON array", "Yes", "ADMIN, ANALYST"],
  ["GET", "/api/csi/batches", "List CSI data batches", "Yes", "Any authenticated user"],
  ["GET", "/api/csi/batches/:id", "Get CSI batch details", "Yes", "Any authenticated user"],
  ["GET", "/api/csi/records/:batchId", "Get CSI records for one batch", "Yes", "Any authenticated user"],
  ["POST", "/api/coverage/run", "Run coverage check", "Yes", "ADMIN, ANALYST"],
  ["GET", "/api/coverage", "List coverage checks", "Yes", "Any authenticated user"],
  ["GET", "/api/coverage/:id", "Get coverage check details", "Yes", "Any authenticated user"],
  ["GET", "/api/coverage/:id/results", "Get coverage match results", "Yes", "Any authenticated user"],
  ["POST", "/api/coverage/:id/create-issues", "Create issues from coverage problems", "Yes", "ADMIN, ANALYST"],
  ["GET", "/api/issues", "List issues", "Yes", "Any authenticated user"],
  ["GET", "/api/issues/:id", "Get issue details", "Yes", "Any authenticated user"],
  ["POST", "/api/issues", "Create issue", "Yes", "ADMIN, ANALYST"],
  ["PUT", "/api/issues/:id", "Update issue", "Yes", "ADMIN, ANALYST"],
  ["DELETE", "/api/issues/:id", "Delete issue", "Yes", "ADMIN"],
  ["POST", "/api/issues/:id/create-task", "Create task from issue", "Yes", "ADMIN, ANALYST"],
  ["GET", "/api/tasks", "List tasks", "Yes", "Any authenticated user"],
  ["POST", "/api/tasks", "Create task", "Yes", "ADMIN, ANALYST"],
  ["PUT", "/api/tasks/:id", "Update task", "Yes", "ADMIN, ANALYST"],
  ["DELETE", "/api/tasks/:id", "Delete task", "Yes", "ADMIN, ANALYST"],
  ["GET", "/api/knowledge", "List knowledge articles", "Yes", "Any authenticated user"],
  ["GET", "/api/knowledge/:id", "Get knowledge article", "Yes", "Any authenticated user"],
  ["POST", "/api/knowledge", "Create knowledge article", "Yes", "ADMIN, ANALYST"],
  ["PUT", "/api/knowledge/:id", "Update knowledge article", "Yes", "ADMIN, ANALYST"],
  ["DELETE", "/api/knowledge/:id", "Delete knowledge article", "Yes", "ADMIN, ANALYST"],
  ["GET", "/api/reports/summary", "Get dashboard summary", "Yes", "Any authenticated user"],
  ["GET", "/api/reports/parser-coverage", "Get parser coverage summary report", "Yes", "Any authenticated user"],
  ["GET", "/api/reports/missing-news", "Get missing news report", "Yes", "Any authenticated user"],
  ["GET", "/api/reports/duplicates", "Get duplicate news report", "Yes", "Any authenticated user"],
  ["GET", "/api/reports/export/*.csv", "Download CSV operational reports", "Yes", "Any authenticated user"],
  ["GET", "/api/reports/export/parser-coverage.txt", "Download TXT parser coverage report", "Yes", "Any authenticated user"],
  ["GET", "/api/audit-logs", "Read audit logs", "Yes", "ADMIN"],
];

function ApiDocs() {
  return (
    <div className="page-grid">
      <Card title="API Documentation" subtitle="Backend reference used by the local frontend and the included Postman collection.">
        <DataTable
          columns={[
            { key: "method", header: "Method" },
            { key: "endpoint", header: "Endpoint" },
            { key: "description", header: "Description" },
            { key: "auth", header: "Auth required" },
            { key: "role", header: "Role required" },
          ]}
          rows={endpoints.map(([method, endpoint, description, auth, role], index) => ({
            id: index + 1,
            method,
            endpoint,
            description,
            auth,
            role,
          }))}
        />
      </Card>

      <Card title="Postman Collection">
        <p className="muted-text">
          Collection path: <code>postman/Parser_Coverage_Validator.postman_collection.json</code>
        </p>
        <p className="muted-text">
          Environment variables: <code>{"{{baseUrl}}"}</code> = <code>http://localhost:5000</code>, <code>{"{{token}}"}</code> = JWT token from login.
        </p>
      </Card>
    </div>
  );
}

export default ApiDocs;
