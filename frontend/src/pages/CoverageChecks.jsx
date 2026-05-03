import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";
import SelectInput from "../components/common/SelectInput";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatPercent } from "../helpers";

function CoverageChecks() {
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [searchParams] = useSearchParams();
  const [sources, setSources] = useState([]);
  const [runs, setRuns] = useState([]);
  const [batches, setBatches] = useState([]);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    sourceId: searchParams.get("sourceId") || "",
    extractionRunId: "",
    csiBatchId: "",
    periodFrom: "",
    periodTo: "",
    sourceNameFilter: "",
  });

  const loadBase = async () => {
    const [sourcesResponse, batchesResponse, coverageResponse] = await Promise.all([
      client.get("/sources"),
      client.get("/csi/batches"),
      client.get("/coverage"),
    ]);
    setSources(sourcesResponse.data);
    setBatches(batchesResponse.data);
    setHistory(coverageResponse.data);
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (!form.sourceId) return;
    client.get(`/extraction/source/${form.sourceId}`).then(({ data }) => setRuns(data));
  }, [form.sourceId]);

  const sourceOptions = useMemo(() => [{ value: "", label: "Select source" }, ...sources.map((source) => ({ value: source.id, label: source.name }))], [sources]);
  const runOptions = useMemo(() => [{ value: "", label: "Select extraction run" }, ...runs.map((run) => ({ value: run.id, label: `${run.status} - ${formatDate(run.createdAt)}` }))], [runs]);
  const batchOptions = useMemo(() => [{ value: "", label: "CSI data required for coverage check" }, ...batches.map((batch) => ({ value: batch.id, label: `${batch.mode} - ${batch.sourceLabel || batch.fileName || batch.id}` }))], [batches]);

  const runCoverage = async () => {
    const { data } = await client.post("/coverage/run", {
      ...form,
      sourceId: Number(form.sourceId),
      extractionRunId: Number(form.extractionRunId),
      csiBatchId: form.csiBatchId ? Number(form.csiBatchId) : null,
    });
    setResult(data);
    loadBase();
  };

  const createIssues = async () => {
    if (!result?.id) return;
    await client.post(`/coverage/${result.id}/create-issues`, {});
    loadBase();
  };

  return (
    <div className="page-grid">
      <Card title="Coverage Checks" subtitle="Compare extracted source news with CSI export/API/manual data and save auditable match results.">
        <div className="form-grid">
          <SelectInput label="Source" value={form.sourceId} onChange={(event) => setForm({ ...form, sourceId: event.target.value, extractionRunId: "" })} options={sourceOptions} />
          <SelectInput label="Extraction run" value={form.extractionRunId} onChange={(event) => setForm({ ...form, extractionRunId: event.target.value })} options={runOptions} />
          <SelectInput label="CSI data batch" value={form.csiBatchId} onChange={(event) => setForm({ ...form, csiBatchId: event.target.value })} options={batchOptions} />
          <TextInput label="Source name filter (optional)" value={form.sourceNameFilter} onChange={(event) => setForm({ ...form, sourceNameFilter: event.target.value })} />
          <TextInput label="Period from" type="date" value={form.periodFrom} onChange={(event) => setForm({ ...form, periodFrom: event.target.value })} />
          <TextInput label="Period to" type="date" value={form.periodTo} onChange={(event) => setForm({ ...form, periodTo: event.target.value })} />
        </div>
        <div className="row-actions">
          {canEdit ? <Button onClick={runCoverage} disabled={!form.sourceId || !form.extractionRunId}>Run coverage check</Button> : null}
          {canEdit && result?.id ? <Button variant="secondary" onClick={createIssues}>Create issues from selected problems</Button> : null}
        </div>
      </Card>

      {result ? (
        <>
          <Card title="Coverage Result">
            <div className="stats-grid compact">
              <div className="stat-card"><div className="stat-label">Source items</div><div className="stat-value">{result.sourceItemsCount}</div></div>
              <div className="stat-card"><div className="stat-label">CSI items</div><div className="stat-value">{result.csiItemsCount}</div></div>
              <div className="stat-card"><div className="stat-label">Matched</div><div className="stat-value">{result.matchedCount}</div></div>
              <div className="stat-card"><div className="stat-label">Missing</div><div className="stat-value">{result.missingCount}</div></div>
              <div className="stat-card"><div className="stat-label">Duplicates</div><div className="stat-value">{result.duplicateCount}</div></div>
              <div className="stat-card"><div className="stat-label">Mismatches</div><div className="stat-value">{result.mismatchCount}</div></div>
              <div className="stat-card"><div className="stat-label">Coverage</div><div className="stat-value">{formatPercent(result.coveragePercent)}</div></div>
              <div className="stat-card"><div className="stat-label">Status</div><div className="stat-value small"><Badge value={result.status} /></div></div>
            </div>
          </Card>

          <Card title="Match Results">
            <DataTable
              columns={[
                { key: "extractedNews", header: "Extracted title", render: (row) => row.extractedNews?.title || "N/A" },
                { key: "extractedUrl", header: "Extracted URL", render: (row) => row.extractedNews?.url || "N/A" },
                { key: "csiTitle", header: "CSI title", render: (row) => row.csiRecord?.title || "N/A" },
                { key: "csiUrl", header: "CSI URL", render: (row) => row.csiRecord?.url || "N/A" },
                { key: "matchStatus", header: "Match status", render: (row) => <Badge value={row.matchStatus} /> },
                { key: "matchScore", header: "Match score", render: (row) => Number(row.matchScore || 0).toFixed(2) },
                { key: "evidence", header: "Evidence" },
              ]}
              rows={result.matchResults}
            />
          </Card>
        </>
      ) : null}

      <Card title="Coverage History">
        <DataTable
          columns={[
            { key: "source", header: "Source", render: (row) => <Link to={`/coverage-checks/${row.id}`}>{row.source.name}</Link> },
            { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
            { key: "coveragePercent", header: "Coverage", render: (row) => formatPercent(row.coveragePercent) },
            { key: "matchedCount", header: "Matched" },
            { key: "missingCount", header: "Missing" },
            { key: "checkedAt", header: "Checked at", render: (row) => formatDate(row.checkedAt) },
          ]}
          rows={history}
        />
      </Card>
    </div>
  );
}

export default CoverageChecks;
