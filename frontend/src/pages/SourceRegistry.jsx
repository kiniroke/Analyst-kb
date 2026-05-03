import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import SelectInput from "../components/common/SelectInput";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";
import { formatDate, downloadBlob } from "../helpers";

const initialForm = {
  name: "",
  baseUrl: "",
  newsListUrl: "",
  sourceType: "NEWS_PORTAL",
  aggregationLevel: "UNKNOWN",
  region: "",
  language: "",
  watcher: "",
  status: "ACTIVE",
  titleSelector: "",
  linkSelector: "",
  dateSelector: "",
  containerSelector: "",
  notes: "",
};

function SourceRegistry() {
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [sources, setSources] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", sourceType: "", region: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState("");

  const loadSources = async () => {
    const { data } = await client.get("/sources", { params: filters });
    setSources(data);
  };

  useEffect(() => {
    loadSources();
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", header: "Name", render: (row) => <Link to={`/sources/${row.id}`}>{row.name}</Link> },
      { key: "newsListUrl", header: "News list URL" },
      { key: "sourceType", header: "Type" },
      { key: "region", header: "Region" },
      { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
      { key: "lastExtractionStatus", header: "Last extraction", render: (row) => <Badge value={row.lastExtractionStatus} /> },
      { key: "lastExtractedAt", header: "Last extracted at", render: (row) => formatDate(row.lastExtractedAt) },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className="row-actions">
            <Button variant="secondary" onClick={() => window.location.assign(`/sources/${row.id}`)}>
              View
            </Button>
            {canEdit ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingId(row.id);
                    setForm({
                      ...initialForm,
                      ...row,
                    });
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="secondary" onClick={() => runExtraction(row.id)}>
                  Test extraction
                </Button>
              </>
            ) : null}
            {user?.role === "ADMIN" ? (
              <Button variant="danger" onClick={() => setDeleteTarget(row)}>
                Delete
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canEdit, user]
  );

  const runExtraction = async (sourceId) => {
    await client.post(`/extraction/run/${sourceId}`);
    setMessage("Extraction run started and saved.");
    loadSources();
  };

  const submitSource = async (event) => {
    event.preventDefault();
    if (editingId) {
      await client.put(`/sources/${editingId}`, form);
      setMessage("Source updated.");
    } else {
      await client.post("/sources", form);
      setMessage("Source created.");
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    loadSources();
  };

  const exportCsv = async () => {
    const response = await client.get("/sources", {
      params: { exportCsv: true },
      responseType: "blob",
    });
    downloadBlob(response.data, "sources.csv");
  };

  return (
    <div className="page-grid">
      <Card
        title="Source Registry"
        subtitle="Website sources used for parser extraction and CSI coverage validation."
        actions={
          <div className="row-actions">
            <Button variant="secondary" onClick={exportCsv}>
              Export CSV
            </Button>
            {canEdit ? <Button onClick={() => setModalOpen(true)}>Add source</Button> : null}
          </div>
        }
      >
        <div className="filter-grid">
          <TextInput label="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <TextInput label="Region" value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })} />
          <SelectInput
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            options={[{ value: "", label: "All" }, { value: "ACTIVE", label: "ACTIVE" }, { value: "NEEDS_REVIEW", label: "NEEDS_REVIEW" }, { value: "DISABLED", label: "DISABLED" }]}
          />
          <SelectInput
            label="Type"
            value={filters.sourceType}
            onChange={(event) => setFilters({ ...filters, sourceType: event.target.value })}
            options={[{ value: "", label: "All" }, { value: "NEWS_PORTAL", label: "NEWS_PORTAL" }, { value: "REGIONAL_MEDIA", label: "REGIONAL_MEDIA" }, { value: "GOVERNMENT", label: "GOVERNMENT" }, { value: "TV", label: "TV" }, { value: "PAPER", label: "PAPER" }, { value: "OTHER", label: "OTHER" }]}
          />
          <div className="form-field">
            <span>&nbsp;</span>
            <Button variant="secondary" onClick={loadSources}>
              Apply filters
            </Button>
          </div>
        </div>

        {message ? <div className="info-box">{message}</div> : null}
        <DataTable columns={columns} rows={sources} />
      </Card>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit source" : "Add source"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={submitSource}>
          <TextInput label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <TextInput label="Base URL" value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} required />
          <TextInput label="News list URL" value={form.newsListUrl} onChange={(event) => setForm({ ...form, newsListUrl: event.target.value })} />
          <SelectInput label="Source type" value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })} options={[{ value: "SMI", label: "SMI" }, { value: "NEWS_PORTAL", label: "NEWS_PORTAL" }, { value: "TV", label: "TV" }, { value: "PAPER", label: "PAPER" }, { value: "GOVERNMENT", label: "GOVERNMENT" }, { value: "REGIONAL_MEDIA", label: "REGIONAL_MEDIA" }, { value: "OTHER", label: "OTHER" }]} />
          <SelectInput label="Aggregation" value={form.aggregationLevel} onChange={(event) => setForm({ ...form, aggregationLevel: event.target.value })} options={[{ value: "UNKNOWN", label: "UNKNOWN" }, { value: "REPUBLICAN", label: "REPUBLICAN" }, { value: "REGIONAL", label: "REGIONAL" }, { value: "INTERNATIONAL", label: "INTERNATIONAL" }]} />
          <TextInput label="Region" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} />
          <TextInput label="Language" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} />
          <TextInput label="Watcher" value={form.watcher} onChange={(event) => setForm({ ...form, watcher: event.target.value })} />
          <SelectInput label="Status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} options={[{ value: "ACTIVE", label: "ACTIVE" }, { value: "NEEDS_REVIEW", label: "NEEDS_REVIEW" }, { value: "DISABLED", label: "DISABLED" }]} />
          <TextInput label="Container selector" value={form.containerSelector} onChange={(event) => setForm({ ...form, containerSelector: event.target.value })} />
          <TextInput label="Title selector" value={form.titleSelector} onChange={(event) => setForm({ ...form, titleSelector: event.target.value })} />
          <TextInput label="Link selector" value={form.linkSelector} onChange={(event) => setForm({ ...form, linkSelector: event.target.value })} />
          <TextInput label="Date selector" value={form.dateSelector} onChange={(event) => setForm({ ...form, dateSelector: event.target.value })} />
          <TextInput className="full-span" label="Notes" textarea rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <div className="row-actions full-span">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingId(null); setForm(initialForm); }}>
              Cancel
            </Button>
            <Button type="submit">{editingId ? "Save source" : "Create source"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete source"
        description={`Delete ${deleteTarget?.name}? This also removes related extraction and coverage history.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await client.delete(`/sources/${deleteTarget.id}`);
          setDeleteTarget(null);
          loadSources();
        }}
      />
    </div>
  );
}

export default SourceRegistry;
