import { useEffect, useState } from "react";
import client from "../api/client";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";
import SelectInput from "../components/common/SelectInput";
import TextInput from "../components/common/TextInput";
import { createSampleCsv, downloadText, formatDate } from "../helpers";
import { useAuth } from "../context/AuthContext";

const sampleRows = [
  {
    source: "zakon.kz",
    title: "Government approves regional transport update",
    url: "http://zakon.kz/news/transport-update-1",
    date: "2026-05-02 11:00",
    author: "Reporter Desk",
    platform: "SMI",
    tone: "neutral",
    region: "National",
  },
];

function CsiDataImport() {
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [mode, setMode] = useState("EXPORT");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [manualJson, setManualJson] = useState(JSON.stringify(sampleRows, null, 2));
  const [apiForm, setApiForm] = useState({
    apiEndpoint: "",
    method: "GET",
    token: "",
    cookie: "",
    payload: "",
  });

  const loadHistory = async () => {
    const { data } = await client.get("/csi/batches");
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const previewFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await client.post("/csi/import/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setPreview(data);
  };

  const confirmFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    await client.post("/csi/import/confirm", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setPreview(null);
    setFile(null);
    loadHistory();
  };

  const submitApi = async () => {
    await client.post("/csi/api/load", {
      ...apiForm,
      payload: apiForm.payload ? JSON.parse(apiForm.payload) : undefined,
    });
    loadHistory();
  };

  const submitManual = async () => {
    await client.post("/csi/manual", {
      records: JSON.parse(manualJson),
    });
    loadHistory();
  };

  const downloadSample = () => {
    downloadText(createSampleCsv(sampleRows), "csi_socmedia_export_sample.csv", "text/csv");
  };

  return (
    <div className="page-grid">
      <Card
        title="CSI Data Import"
        subtitle="Upload CSI export files, load CSI API data with provided credentials or paste manual JSON records."
        actions={<Button variant="secondary" onClick={downloadSample}>Download sample CSI export CSV</Button>}
      >
        <div className="form-grid">
          <SelectInput
            label="Mode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            options={[{ value: "EXPORT", label: "Export" }, { value: "API", label: "API" }, { value: "MANUAL", label: "Manual JSON" }]}
          />
        </div>

        {mode === "EXPORT" ? (
          <div className="form-grid">
            <div className="form-field">
              <span>Export file</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </div>
            {canEdit ? (
              <div className="row-actions full-span">
                <Button onClick={previewFile} disabled={!file}>Preview import</Button>
                {preview ? <Button variant="secondary" onClick={confirmFile}>Confirm import</Button> : null}
              </div>
            ) : null}
            {preview ? (
              <div className="full-span">
                <Card title="Preview" className="embedded-card">
                  <div className="detail-grid">
                    <div><strong>File:</strong> {preview.fileName}</div>
                    <div><strong>Total rows:</strong> {preview.totalRows}</div>
                    <div className="full-span"><strong>Mapping:</strong> {JSON.stringify(preview.mapping)}</div>
                  </div>
                  <DataTable
                    columns={[
                      { key: "sourceName", header: "Source" },
                      { key: "title", header: "Title" },
                      { key: "url", header: "URL" },
                      { key: "rawDate", header: "Date" },
                    ]}
                    rows={preview.previewRows}
                  />
                </Card>
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "API" ? (
          <div className="form-grid">
            <TextInput label="API endpoint URL" value={apiForm.apiEndpoint} onChange={(event) => setApiForm({ ...apiForm, apiEndpoint: event.target.value })} />
            <SelectInput label="Method" value={apiForm.method} onChange={(event) => setApiForm({ ...apiForm, method: event.target.value })} options={[{ value: "GET", label: "GET" }, { value: "POST", label: "POST" }]} />
            <TextInput label="Token" value={apiForm.token} onChange={(event) => setApiForm({ ...apiForm, token: event.target.value })} />
            <TextInput label="Cookie" value={apiForm.cookie} onChange={(event) => setApiForm({ ...apiForm, cookie: event.target.value })} />
            <TextInput className="full-span" label="Payload JSON (optional)" textarea rows={5} value={apiForm.payload} onChange={(event) => setApiForm({ ...apiForm, payload: event.target.value })} />
            {canEdit ? <Button onClick={submitApi}>Load CSI API data</Button> : null}
          </div>
        ) : null}

        {mode === "MANUAL" ? (
          <div className="form-grid">
            <TextInput className="full-span" label="Manual JSON array" textarea rows={12} value={manualJson} onChange={(event) => setManualJson(event.target.value)} />
            {canEdit ? <Button onClick={submitManual}>Create manual CSI batch</Button> : null}
          </div>
        ) : null}
      </Card>

      <Card title="Import History" subtitle="Shows total rows, successful rows, failed rows and data source mode.">
        <DataTable
          columns={[
            { key: "mode", header: "Mode" },
            { key: "sourceLabel", header: "Source of data" },
            { key: "fileName", header: "File name" },
            { key: "totalRows", header: "Total rows" },
            { key: "successfulRows", header: "Successful rows" },
            { key: "failedRows", header: "Failed rows" },
            { key: "createdAt", header: "Imported at", render: (row) => formatDate(row.createdAt) },
          ]}
          rows={history}
        />
      </Card>
    </div>
  );
}

export default CsiDataImport;
