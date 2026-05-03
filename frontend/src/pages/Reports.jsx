import { useEffect, useState } from "react";
import client from "../api/client";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import StatCard from "../components/common/StatCard";
import { downloadBlob, formatPercent } from "../helpers";

function Reports() {
  const [summary, setSummary] = useState(null);
  const [coverageChecks, setCoverageChecks] = useState([]);
  const [missingNews, setMissingNews] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      client.get("/reports/summary"),
      client.get("/reports/parser-coverage"),
      client.get("/reports/missing-news"),
      client.get("/reports/duplicates"),
    ])
      .then(([summaryResponse, coverageResponse, missingResponse, duplicatesResponse]) => {
        setSummary(summaryResponse.data);
        setCoverageChecks(coverageResponse.data);
        setMissingNews(missingResponse.data);
        setDuplicates(duplicatesResponse.data);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Failed to load reports."));
  }, []);

  const exportFile = async (endpoint, filename) => {
    const response = await client.get(endpoint, { responseType: "blob" });
    downloadBlob(response.data, filename);
  };

  if (error) {
    return <Card title="Reports"><div className="error-text">{error}</div></Card>;
  }

  if (!summary) {
    return <LoadingState label="Loading reports..." />;
  }

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard label="Coverage checks" value={summary.cards.coverageChecks} />
        <StatCard label="Average coverage" value={formatPercent(summary.cards.averageCoveragePercent)} />
        <StatCard label="Missing in CSI" value={summary.cards.missingInCsiCount} />
        <StatCard label="Open issues" value={summary.cards.openIssues} />
      </div>

      <Card
        title="Report Exports"
        subtitle="Operational reports focused on extraction quality, CSI coverage gaps and follow-up workload."
        actions={
          <div className="row-actions">
            <Button variant="secondary" onClick={() => exportFile("/reports/export/sources.csv", "sources.csv")}>
              sources.csv
            </Button>
            <Button variant="secondary" onClick={() => exportFile("/reports/export/extraction-runs.csv", "extraction_runs.csv")}>
              extraction_runs.csv
            </Button>
            <Button variant="secondary" onClick={() => exportFile("/reports/export/extracted-news.csv", "extracted_news.csv")}>
              extracted_news.csv
            </Button>
            <Button variant="secondary" onClick={() => exportFile("/reports/export/csi-records.csv", "csi_records.csv")}>
              csi_records.csv
            </Button>
            <Button variant="secondary" onClick={() => exportFile("/reports/export/coverage-results.csv", "coverage_results.csv")}>
              coverage_results.csv
            </Button>
            <Button variant="secondary" onClick={() => exportFile("/reports/export/issues.csv", "issues.csv")}>
              issues.csv
            </Button>
            <Button variant="secondary" onClick={() => exportFile("/reports/export/tasks.csv", "tasks.csv")}>
              tasks.csv
            </Button>
            <Button onClick={() => exportFile("/reports/export/parser-coverage.txt", "parser_coverage_report.txt")}>
              parser_coverage_report.txt
            </Button>
          </div>
        }
      >
        <p className="muted-text">
          Use these files to prepare internship evidence, demonstrate parser QA workflow, and show coverage validation results.
        </p>
      </Card>

      <Card title="Parser Coverage Summary">
        <DataTable
          columns={[
            { key: "source", header: "Source", render: (row) => row.source?.name || "Unknown" },
            { key: "status", header: "Status" },
            { key: "coveragePercent", header: "Coverage percent", render: (row) => formatPercent(row.coveragePercent) },
            { key: "matchedCount", header: "Matched" },
            { key: "missingCount", header: "Missing" },
            { key: "duplicateCount", header: "Duplicates" },
            { key: "mismatchCount", header: "Mismatches" },
          ]}
          rows={coverageChecks}
        />
      </Card>

      <div className="table-grid">
        <Card title="Missing News Report">
          <DataTable
            columns={[
              { key: "source", header: "Source", render: (row) => row.coverageCheck?.source?.name || "Unknown" },
              { key: "title", header: "Extracted title", render: (row) => row.extractedNews?.title || "N/A" },
              { key: "url", header: "Extracted URL", render: (row) => row.extractedNews?.url || "N/A" },
              { key: "evidence", header: "Evidence" },
            ]}
            rows={missingNews}
          />
        </Card>

        <Card title="Duplicate In CSI Report">
          <DataTable
            columns={[
              { key: "source", header: "Source", render: (row) => row.coverageCheck?.source?.name || "Unknown" },
              { key: "title", header: "Extracted title", render: (row) => row.extractedNews?.title || "N/A" },
              { key: "csiTitle", header: "CSI title", render: (row) => row.csiRecord?.title || "N/A" },
              { key: "evidence", header: "Evidence" },
            ]}
            rows={duplicates}
          />
        </Card>
      </div>
    </div>
  );
}

export default Reports;
