import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import { copyText, formatDate, formatPercent, downloadBlob } from "../helpers";

function CoverageDetails() {
  const { id } = useParams();
  const [check, setCheck] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    Promise.all([client.get(`/coverage/${id}`), client.get(`/coverage/${id}/results`)]).then(([checkResponse, resultsResponse]) => {
      setCheck(checkResponse.data);
      setResults(resultsResponse.data);
    });
  }, [id]);

  const grouped = useMemo(() => {
    const counts = {};
    for (const item of results) {
      counts[item.matchStatus] = (counts[item.matchStatus] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [results]);

  if (!check) {
    return <LoadingState label="Loading coverage details..." />;
  }

  const exportTxt = async () => {
    const response = await client.get("/reports/export/parser-coverage.txt", {
      responseType: "blob",
    });
    downloadBlob(response.data, "parser_coverage_report.txt");
  };

  return (
    <div className="page-grid">
      <Card
        title={`Coverage Details: ${check.source.name}`}
        subtitle={`Checked at ${formatDate(check.checkedAt)}`}
        actions={<Button variant="secondary" onClick={exportTxt}>Export TXT</Button>}
      >
        <div className="detail-grid">
          <div><strong>Status:</strong> <Badge value={check.status} /></div>
          <div><strong>Coverage percent:</strong> {formatPercent(check.coveragePercent)}</div>
          <div><strong>Source items:</strong> {check.sourceItemsCount}</div>
          <div><strong>CSI items:</strong> {check.csiItemsCount}</div>
          <div><strong>Matched:</strong> {check.matchedCount}</div>
          <div><strong>Missing:</strong> {check.missingCount}</div>
          <div><strong>Duplicates:</strong> {check.duplicateCount}</div>
          <div><strong>Mismatches:</strong> {check.mismatchCount}</div>
          <div className="full-span"><strong>Summary:</strong> {check.summary}</div>
        </div>
      </Card>

      <Card title="Coverage Chart">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={grouped}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#1f4f84" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Match Result Table">
        <DataTable
          columns={[
            { key: "sourceTitle", header: "Extracted title", render: (row) => row.extractedNews?.title || "N/A" },
            { key: "csiTitle", header: "CSI title", render: (row) => row.csiRecord?.title || "N/A" },
            { key: "matchStatus", header: "Status", render: (row) => <Badge value={row.matchStatus} /> },
            { key: "matchScore", header: "Score", render: (row) => Number(row.matchScore || 0).toFixed(2) },
            {
              key: "evidence",
              header: "Evidence",
              render: (row) => (
                <Button variant="secondary" onClick={() => copyText(row.evidence || "")}>
                  Copy evidence
                </Button>
              ),
            },
          ]}
          rows={results}
        />
      </Card>
    </div>
  );
}

export default CoverageDetails;
