import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Table from "../components/Table";
import { copyText, formatDate } from "../helpers";

const initialForm = {
  title: "",
  sourceName: "",
  sourceType: "NEWS_PORTAL",
  issueCategory: "MISSING_DATE",
  priority: "MEDIUM",
  status: "NEW",
  description: "",
  recommendation: "",
  itComment: "",
  reportNote: "",
  assignedToId: "",
};

function Cases() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: "", issueCategory: "", priority: "", status: "" });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cases", { params: filters });
      setCases(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load cases.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (user?.role === "ADMIN") {
      const { data } = await api.get("/users");
      setUsers(data);
    } else if (user) {
      setUsers([user]);
    }
  };

  useEffect(() => {
    loadCases();
    loadUsers();
  }, [user]);

  const columns = useMemo(
    () => [
      { key: "caseNumber", header: "Case number" },
      { key: "title", header: "Title" },
      { key: "sourceName", header: "Source" },
      { key: "issueCategory", header: "Issue" },
      { key: "priority", header: "Priority", render: (row) => <Badge value={row.priority} type="priority" /> },
      { key: "status", header: "Status", render: (row) => <Badge value={row.status} type="status" /> },
      { key: "assignedTo", header: "Assigned", render: (row) => row.assignedTo?.fullName || "Not assigned" },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className="action-row">
            <button className="text-button" onClick={() => setSelected(row)}>
              View
            </button>
            {user?.role !== "VIEWER" ? (
              <button
                className="text-button"
                onClick={() => {
                  setEditingId(row.id);
                  setForm({
                    title: row.title,
                    sourceName: row.sourceName,
                    sourceType: row.sourceType,
                    issueCategory: row.issueCategory,
                    priority: row.priority,
                    status: row.status,
                    description: row.description,
                    recommendation: row.recommendation || "",
                    itComment: row.itComment || "",
                    reportNote: row.reportNote || "",
                    assignedToId: row.assignedToId || "",
                  });
                  setModalOpen(true);
                }}
              >
                Edit
              </button>
            ) : null}
            {user?.role === "ADMIN" ? (
              <button className="text-button danger" onClick={() => handleDelete(row.id)}>
                Delete
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [user]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this case?")) {
      return;
    }
    await api.delete(`/cases/${id}`);
    loadCases();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      assignedToId: form.assignedToId || undefined,
    };

    if (editingId) {
      await api.put(`/cases/${editingId}`, payload);
    } else {
      await api.post("/cases", payload);
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    loadCases();
  };

  return (
    <div className="page-grid">
      <div className="page-toolbar">
        <div>
          <h1>Cases</h1>
          <p>Track validation issues, assign ownership, and store structured operational comments.</p>
        </div>
        {user?.role !== "VIEWER" ? (
          <button className="button" onClick={() => setModalOpen(true)}>
            Create case
          </button>
        ) : null}
      </div>

      <div className="card filter-grid">
        <input
          placeholder="Search by case number, title, or source"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select
          value={filters.issueCategory}
          onChange={(event) => setFilters({ ...filters, issueCategory: event.target.value })}
        >
          <option value="">All issue categories</option>
          <option value="PARSING_ERROR">PARSING_ERROR</option>
          <option value="MISSING_DATE">MISSING_DATE</option>
          <option value="MISSING_TEXT">MISSING_TEXT</option>
          <option value="INCORRECT_URL">INCORRECT_URL</option>
          <option value="DUPLICATE_SOURCE">DUPLICATE_SOURCE</option>
          <option value="MISSING_REGION">MISSING_REGION</option>
          <option value="API_RESPONSE_ERROR">API_RESPONSE_ERROR</option>
          <option value="SOCIAL_ACCOUNT_INCOMPLETE">SOCIAL_ACCOUNT_INCOMPLETE</option>
          <option value="DATA_QUALITY">DATA_QUALITY</option>
          <option value="OTHER">OTHER</option>
        </select>
        <select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
          <option value="">All priorities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="FIXED">FIXED</option>
          <option value="CHECKED">CHECKED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button className="button" onClick={loadCases}>
          Apply filters
        </button>
      </div>

      <div className="card">
        {loading ? <div>Loading cases...</div> : <Table columns={columns} rows={cases} />}
        {error ? <div className="form-error">{error}</div> : null}
      </div>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit case" : "Create case"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label>
            Source name
            <input
              value={form.sourceName}
              onChange={(event) => setForm({ ...form, sourceName: event.target.value })}
              required
            />
          </label>
          <label>
            Source type
            <input
              value={form.sourceType}
              onChange={(event) => setForm({ ...form, sourceType: event.target.value })}
              required
            />
          </label>
          <label>
            Issue category
            <select value={form.issueCategory} onChange={(event) => setForm({ ...form, issueCategory: event.target.value })}>
              <option value="PARSING_ERROR">PARSING_ERROR</option>
              <option value="MISSING_DATE">MISSING_DATE</option>
              <option value="MISSING_TEXT">MISSING_TEXT</option>
              <option value="INCORRECT_URL">INCORRECT_URL</option>
              <option value="DUPLICATE_SOURCE">DUPLICATE_SOURCE</option>
              <option value="MISSING_REGION">MISSING_REGION</option>
              <option value="API_RESPONSE_ERROR">API_RESPONSE_ERROR</option>
              <option value="SOCIAL_ACCOUNT_INCOMPLETE">SOCIAL_ACCOUNT_INCOMPLETE</option>
              <option value="DATA_QUALITY">DATA_QUALITY</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
          <label>
            Priority
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="FIXED">FIXED</option>
              <option value="CHECKED">CHECKED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </label>
          {user?.role === "ADMIN" ? (
            <label>
              Assign analyst
              <select value={form.assignedToId} onChange={(event) => setForm({ ...form, assignedToId: event.target.value })}>
                <option value="">Select analyst</option>
                {users.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName} ({person.role})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="full-span">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows="3"
              required
            />
          </label>
          <label className="full-span">
            Recommendation
            <textarea
              value={form.recommendation}
              onChange={(event) => setForm({ ...form, recommendation: event.target.value })}
              rows="3"
            />
          </label>
          <label className="full-span">
            IT comment
            <textarea value={form.itComment} onChange={(event) => setForm({ ...form, itComment: event.target.value })} rows="3" />
          </label>
          <label className="full-span">
            Report note
            <textarea value={form.reportNote} onChange={(event) => setForm({ ...form, reportNote: event.target.value })} rows="3" />
          </label>
          <button className="button" type="submit">
            {editingId ? "Save case" : "Create case"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selected)} title="Case details" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="detail-grid">
            <div><strong>Case number:</strong> {selected.caseNumber}</div>
            <div><strong>Title:</strong> {selected.title}</div>
            <div><strong>Source:</strong> {selected.sourceName}</div>
            <div><strong>Issue:</strong> {selected.issueCategory}</div>
            <div><strong>Priority:</strong> <Badge value={selected.priority} type="priority" /></div>
            <div><strong>Status:</strong> <Badge value={selected.status} type="status" /></div>
            <div><strong>Assigned:</strong> {selected.assignedTo?.fullName || "Not assigned"}</div>
            <div><strong>Created:</strong> {formatDate(selected.createdAt)}</div>
            <div className="full-span"><strong>Description:</strong> {selected.description}</div>
            <div className="full-span">
              <strong>Recommendation:</strong> {selected.recommendation || "No recommendation."}
            </div>
            <div className="full-span">
              <div className="copy-row">
                <strong>IT comment</strong>
                <button className="text-button" onClick={() => copyText(selected.itComment || "")}>
                  Copy IT comment
                </button>
              </div>
              <p>{selected.itComment || "No IT comment."}</p>
            </div>
            <div className="full-span">
              <div className="copy-row">
                <strong>Report note</strong>
                <button className="text-button" onClick={() => copyText(selected.reportNote || "")}>
                  Copy report note
                </button>
              </div>
              <p>{selected.reportNote || "No report note."}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default Cases;
