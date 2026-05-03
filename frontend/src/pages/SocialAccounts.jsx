import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Table from "../components/Table";
import { formatDate, formatNumber } from "../helpers";

const initialForm = {
  username: "",
  fullName: "",
  watcher: "",
  region: "",
  followers: 0,
  autoUpdate: true,
  status: "ACTIVE",
  notes: "",
};

function SocialAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({ search: "", watcher: "", region: "", status: "" });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/social-accounts", { params: filters });
      setAccounts(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load social accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const columns = useMemo(
    () => [
      { key: "username", header: "Username" },
      { key: "fullName", header: "Full name" },
      { key: "watcher", header: "Watcher" },
      { key: "region", header: "Region" },
      { key: "followers", header: "Followers", render: (row) => formatNumber(row.followers) },
      { key: "autoUpdate", header: "Auto update", render: (row) => (row.autoUpdate ? "Yes" : "No") },
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
                    setForm(row);
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
    if (!window.confirm("Delete this social account?")) {
      return;
    }
    await api.delete(`/social-accounts/${id}`);
    loadAccounts();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editingId) {
      await api.put(`/social-accounts/${editingId}`, form);
    } else {
      await api.post("/social-accounts", form);
    }
    setForm(initialForm);
    setEditingId(null);
    setModalOpen(false);
    loadAccounts();
  };

  return (
    <div className="page-grid">
      <div className="page-toolbar">
        <div>
          <h1>Social Accounts</h1>
          <p>Track monitored social media accounts, assigned watchers, and profile completeness.</p>
        </div>
        {user?.role === "ADMIN" ? (
          <button className="button" onClick={() => setModalOpen(true)}>
            Add account
          </button>
        ) : null}
      </div>

      <div className="card filter-grid">
        <input
          placeholder="Search by username or full name"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <input
          placeholder="Watcher"
          value={filters.watcher}
          onChange={(event) => setFilters({ ...filters, watcher: event.target.value })}
        />
        <input
          placeholder="Region"
          value={filters.region}
          onChange={(event) => setFilters({ ...filters, region: event.target.value })}
        />
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
          <option value="DISABLED">DISABLED</option>
        </select>
        <button className="button" onClick={loadAccounts}>
          Apply filters
        </button>
      </div>

      <div className="card">
        {loading ? <div>Loading social accounts...</div> : <Table columns={columns} rows={accounts} />}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit social account" : "Add social account"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Username
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
          </label>
          <label>
            Full name
            <input value={form.fullName || ""} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          </label>
          <label>
            Watcher
            <input value={form.watcher || ""} onChange={(event) => setForm({ ...form, watcher: event.target.value })} />
          </label>
          <label>
            Region
            <input value={form.region || ""} onChange={(event) => setForm({ ...form, region: event.target.value })} />
          </label>
          <label>
            Followers
            <input
              type="number"
              min="0"
              value={form.followers}
              onChange={(event) => setForm({ ...form, followers: Number(event.target.value) })}
            />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(form.autoUpdate)}
              onChange={(event) => setForm({ ...form, autoUpdate: event.target.checked })}
            />
            Auto update enabled
          </label>
          <label className="full-span">
            Notes
            <textarea value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="3" />
          </label>
          <button className="button" type="submit">
            {editingId ? "Save changes" : "Create account"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selected)} title="Social account details" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="detail-grid">
            <div><strong>Username:</strong> {selected.username}</div>
            <div><strong>Full name:</strong> {selected.fullName || "Not set"}</div>
            <div><strong>Watcher:</strong> {selected.watcher || "Not set"}</div>
            <div><strong>Region:</strong> {selected.region || "Not set"}</div>
            <div><strong>Followers:</strong> {formatNumber(selected.followers)}</div>
            <div><strong>Auto update:</strong> {selected.autoUpdate ? "Yes" : "No"}</div>
            <div><strong>Status:</strong> <Badge value={selected.status} type="status" /></div>
            <div><strong>Created:</strong> {formatDate(selected.createdAt)}</div>
            <div className="full-span"><strong>Notes:</strong> {selected.notes || "No notes."}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default SocialAccounts;
