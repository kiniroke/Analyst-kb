import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Table from "../components/Table";
import { formatDate } from "../helpers";

const initialForm = {
  name: "",
  url: "",
  sourceType: "NEWS_PORTAL",
  aggregationLevel: "UNKNOWN",
  region: "",
  language: "",
  watcher: "",
  status: "ACTIVE",
  lastCheckedAt: "",
  notes: "",
};

function Sources() {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [filters, setFilters] = useState({ search: "", sourceType: "", aggregationLevel: "", status: "" });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSources = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/sources", { params: filters });
      setSources(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load sources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", header: "Source" },
      { key: "url", header: "URL" },
      { key: "sourceType", header: "Type" },
      { key: "aggregationLevel", header: "Aggregation" },
      { key: "region", header: "Region" },
      { key: "status", header: "Status", render: (row) => <Badge value={row.status} type="status" /> },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className="action-row">
            <button className="text-button" onClick={() => setSelected(row)}>
              View
            </button>
            {user?.role === "ADMIN" ? (
              <>
                <button
                  className="text-button"
                  onClick={() => {
                    setEditingId(row.id);
                    setForm({
                      ...row,
                      lastCheckedAt: row.lastCheckedAt ? row.lastCheckedAt.slice(0, 16) : "",
                    });
                    setModalOpen(true);
                  }}
                >
                  Edit
                </button>
                <button className="text-button danger" onClick={() => handleDelete(row.id)}>
                  Delete
                </button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [user]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this source?")) {
      return;
    }
    await api.delete(`/sources/${id}`);
    loadSources();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api.put(`/sources/${editingId}`, form);
    } else {
      await api.post("/sources", form);
    }
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(false);
    loadSources();
  };

  return (
    <div className="page-grid">
      <div className="page-toolbar">
        <div>
          <h1>Sources</h1>
          <p>Manage media source records used for analyst validation and source quality control.</p>
        </div>
        {user?.role === "ADMIN" ? (
          <button className="button" onClick={() => setModalOpen(true)}>
            Add source
          </button>
        ) : null}
      </div>

      <div className="card filter-grid">
        <input
          placeholder="Search by name or URL"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select value={filters.sourceType} onChange={(event) => setFilters({ ...filters, sourceType: event.target.value })}>
          <option value="">All types</option>
          <option value="NEWS_PORTAL">NEWS_PORTAL</option>
          <option value="TV">TV</option>
          <option value="PAPER">PAPER</option>
          <option value="GOVERNMENT">GOVERNMENT</option>
          <option value="REGIONAL">REGIONAL</option>
          <option value="OTHER">OTHER</option>
        </select>
        <select
          value={filters.aggregationLevel}
          onChange={(event) => setFilters({ ...filters, aggregationLevel: event.target.value })}
        >
          <option value="">All aggregation levels</option>
          <option value="REPUBLICAN">REPUBLICAN</option>
          <option value="REGIONAL">REGIONAL</option>
          <option value="INTERNATIONAL">INTERNATIONAL</option>
          <option value="UNKNOWN">UNKNOWN</option>
        </select>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
          <option value="DISABLED">DISABLED</option>
        </select>
        <button className="button" onClick={loadSources}>
          Apply filters
        </button>
      </div>

      <div className="card">
        {loading ? <div>Loading sources...</div> : <Table columns={columns} rows={sources} />}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit source" : "Add source"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            URL
            <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} required />
          </label>
          <label>
            Source type
            <select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}>
              <option value="NEWS_PORTAL">NEWS_PORTAL</option>
              <option value="TV">TV</option>
              <option value="PAPER">PAPER</option>
              <option value="GOVERNMENT">GOVERNMENT</option>
              <option value="REGIONAL">REGIONAL</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
          <label>
            Aggregation level
            <select
              value={form.aggregationLevel}
              onChange={(event) => setForm({ ...form, aggregationLevel: event.target.value })}
            >
              <option value="REPUBLICAN">REPUBLICAN</option>
              <option value="REGIONAL">REGIONAL</option>
              <option value="INTERNATIONAL">INTERNATIONAL</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </label>
          <label>
            Region
            <input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} />
          </label>
          <label>
            Language
            <input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} />
          </label>
          <label>
            Watcher
            <input value={form.watcher} onChange={(event) => setForm({ ...form, watcher: event.target.value })} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </label>
          <label>
            Last checked
            <input
              type="datetime-local"
              value={form.lastCheckedAt || ""}
              onChange={(event) => setForm({ ...form, lastCheckedAt: event.target.value })}
            />
          </label>
          <label className="full-span">
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="3" />
          </label>
          <button className="button" type="submit">
            {editingId ? "Save changes" : "Create source"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selected)} title="Source details" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="detail-grid">
            <div><strong>Name:</strong> {selected.name}</div>
            <div><strong>URL:</strong> {selected.url}</div>
            <div><strong>Type:</strong> {selected.sourceType}</div>
            <div><strong>Aggregation:</strong> {selected.aggregationLevel}</div>
            <div><strong>Region:</strong> {selected.region || "Not set"}</div>
            <div><strong>Language:</strong> {selected.language || "Not set"}</div>
            <div><strong>Watcher:</strong> {selected.watcher || "Not set"}</div>
            <div><strong>Status:</strong> <Badge value={selected.status} type="status" /></div>
            <div><strong>Last checked:</strong> {formatDate(selected.lastCheckedAt)}</div>
            <div className="full-span"><strong>Notes:</strong> {selected.notes || "No notes."}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default Sources;
