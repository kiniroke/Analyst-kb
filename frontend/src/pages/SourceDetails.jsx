import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../context/AuthContext";
import { formatDate, copyText } from "../helpers";

function SourceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [source, setSource] = useState(null);

  const loadSource = async () => {
    const { data } = await client.get(`/sources/${id}`);
    setSource(data);
  };

  useEffect(() => {
    loadSource();
  }, [id]);

  if (!source) {
    return <LoadingState label="Loading source details..." />;
  }

  return (
    <div className="page-grid">
      <Card
        title={source.name}
        subtitle="Source metadata, selectors, extraction history, coverage history and related issues."
        actions={
          <div className="row-actions">
            {canEdit ? (
              <>
                <Button variant="secondary" onClick={() => client.post(`/extraction/run/${source.id}`).then(loadSource)}>
                  Test extraction
                </Button>
                <Link to={`/extraction-lab?sourceId=${source.id}`} className="button button-secondary">
                  Edit selectors
                </Link>
                <Link to={`/coverage-checks?sourceId=${source.id}`} className="button button-secondary">
                  Run coverage check
                </Link>
              </>
            ) : null}
          </div>
        }
      >
        <div className="detail-grid">
          <div><strong>Base URL:</strong> {source.baseUrl}</div>
          <div><strong>News list URL:</strong> {source.newsListUrl || source.baseUrl}</div>
          <div><strong>Type:</strong> {source.sourceType}</div>
          <div><strong>Aggregation level:</strong> {source.aggregationLevel}</div>
          <div><strong>Region:</strong> {source.region || "Not set"}</div>
          <div><strong>Language:</strong> {source.language || "Not set"}</div>
          <div><strong>Watcher:</strong> {source.watcher || "Not set"}</div>
          <div><strong>Status:</strong> <Badge value={source.status} /></div>
          <div><strong>Last extraction status:</strong> <Badge value={source.lastExtractionStatus} /></div>
          <div><strong>Last extracted at:</strong> {formatDate(source.lastExtractedAt)}</div>
          <div className="full-span"><strong>Notes:</strong> {source.notes || "No notes."}</div>
        </div>
      </Card>

      <Card title="Selectors">
        <div className="detail-grid">
          <div><strong>Container:</strong> {source.containerSelector || "Not set"}</div>
          <div><strong>Title:</strong> {source.titleSelector || "Not set"}</div>
          <div><strong>Link:</strong> {source.linkSelector || "Not set"}</div>
          <div><strong>Date:</strong> {source.dateSelector || "Not set"}</div>
        </div>
      </Card>

      <Card title="Extraction History">
        <DataTable
          columns={[
            { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
            { key: "itemsFound", header: "Items found" },
            { key: "itemsWithDate", header: "Items with date" },
            { key: "httpStatus", header: "HTTP status" },
            { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
          ]}
          rows={source.extractionRuns}
        />
      </Card>

      <Card title="Coverage History">
        <DataTable
          columns={[
            { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
            { key: "coveragePercent", header: "Coverage %" },
            { key: "matchedCount", header: "Matched" },
            { key: "missingCount", header: "Missing" },
            { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
          ]}
          rows={source.coverageChecks}
        />
      </Card>

      <Card title="Related Issues">
        <DataTable
          columns={[
            { key: "title", header: "Issue" },
            { key: "issueType", header: "Type" },
            { key: "severity", header: "Severity", render: (row) => <Badge value={row.severity} /> },
            { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <Button variant="secondary" onClick={() => copyText(row.evidence || "")}>
                  Copy evidence
                </Button>
              ),
            },
          ]}
          rows={source.issues}
        />
      </Card>
    </div>
  );
}

export default SourceDetails;
