import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DataTable from "../components/common/DataTable";
import SelectInput from "../components/common/SelectInput";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../helpers";

function ExtractionLab() {
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [searchParams] = useSearchParams();
  const [sources, setSources] = useState([]);
  const [sourceId, setSourceId] = useState(searchParams.get("sourceId") || "");
  const [source, setSource] = useState(null);
  const [form, setForm] = useState({
    containerSelector: "",
    titleSelector: "",
    linkSelector: "",
    dateSelector: "",
  });
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    client.get("/sources").then(({ data }) => setSources(data));
  }, []);

  useEffect(() => {
    if (!sourceId) return;
    client.get(`/sources/${sourceId}`).then(({ data }) => {
      setSource(data);
      setForm({
        containerSelector: data.containerSelector || "",
        titleSelector: data.titleSelector || "",
        linkSelector: data.linkSelector || "",
        dateSelector: data.dateSelector || "",
      });
    });
  }, [sourceId]);

  const sourceOptions = useMemo(
    () => [{ value: "", label: "Select source" }, ...sources.map((item) => ({ value: item.id, label: item.name }))],
    [sources]
  );

  const runTest = async () => {
    const { data } = await client.post("/extraction/test-selectors", {
      sourceId: Number(sourceId),
      ...form,
    });
    setResult(data);
    setMessage("");
  };

  const saveSelectors = async () => {
    await client.put(`/sources/${sourceId}`, form);
    setMessage("Selectors saved to source registry.");
  };

  return (
    <div className="page-grid">
      <Card title="Extraction Lab" subtitle="Test selectors, run fallback extraction and inspect real backend extraction evidence.">
        <div className="form-grid">
          <SelectInput label="Source" value={sourceId} onChange={(event) => setSourceId(event.target.value)} options={sourceOptions} />
          <div className="form-field">
            <span>Current status</span>
            <div className="field-inline">{source ? <Badge value={source.lastExtractionStatus} /> : "Not selected"}</div>
          </div>
          <TextInput label="Container selector" value={form.containerSelector} onChange={(event) => setForm({ ...form, containerSelector: event.target.value })} />
          <TextInput label="Title selector" value={form.titleSelector} onChange={(event) => setForm({ ...form, titleSelector: event.target.value })} />
          <TextInput label="Link selector" value={form.linkSelector} onChange={(event) => setForm({ ...form, linkSelector: event.target.value })} />
          <TextInput label="Date selector" value={form.dateSelector} onChange={(event) => setForm({ ...form, dateSelector: event.target.value })} />
        </div>

        <div className="row-actions">
          {canEdit ? (
            <>
              <Button onClick={runTest} disabled={!sourceId}>
                Run extraction test
              </Button>
              <Button variant="secondary" onClick={saveSelectors} disabled={!sourceId}>
                Save selectors
              </Button>
            </>
          ) : null}
        </div>
        {message ? <div className="info-box">{message}</div> : null}
      </Card>

      {result ? (
        <>
          <Card title="Extraction Result Summary">
            <div className="detail-grid">
              <div><strong>Status:</strong> <Badge value={result.status} /></div>
              <div><strong>Items found:</strong> {result.evidence.itemsFound}</div>
              <div><strong>Titles found:</strong> {result.evidence.itemsWithTitle}</div>
              <div><strong>URLs found:</strong> {result.evidence.itemsWithUrl}</div>
              <div><strong>Dates found:</strong> {result.evidence.itemsWithDate}</div>
              <div><strong>HTTP status:</strong> {result.evidence.httpStatus || "N/A"}</div>
              <div><strong>Response time:</strong> {result.evidence.responseTimeMs || 0} ms</div>
              <div><strong>Fallback used:</strong> {result.evidence.fallbackUsed ? "Yes" : "No"}</div>
              <div><strong>Timestamp:</strong> {formatDate(new Date())}</div>
              <div className="full-span"><strong>Error message:</strong> {result.evidence.errorMessage || "None"}</div>
            </div>
          </Card>

          <Card title="First 20 Extracted Items">
            <DataTable
              columns={[
                { key: "position", header: "#" },
                { key: "title", header: "Title" },
                { key: "url", header: "URL" },
                { key: "rawDate", header: "Raw date" },
              ]}
              rows={result.items.slice(0, 20)}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}

export default ExtractionLab;
