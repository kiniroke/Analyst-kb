import { useEffect, useState } from "react";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DataTable from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import Modal from "../components/common/Modal";
import SelectInput from "../components/common/SelectInput";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";
import { copyText, formatDate } from "../helpers";

const initialForm = {
  sourceId: "",
  coverageCheckId: "",
  entityId: "",
  title: "",
  issueType: "OTHER",
  severity: "MEDIUM",
  status: "NEW",
  evidence: "",
  recommendation: "",
  assignedToId: "",
};

function Issues() {
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [issues, setIssues] = useState([]);
  const [sources, setSources] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: "", issueType: "", severity: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadData = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const requests = [client.get("/issues", { params: currentFilters }), client.get("/sources")];
      if (user?.role !== "VIEWER") {
        requests.push(client.get("/users"));
      }
      const responses = await Promise.all(requests);
      setIssues(responses[0].data);
      setSources(responses[1].data);
      setUsers(responses[2]?.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (issue) => {
    setEditingId(issue.id);
    setForm({
      sourceId: String(issue.sourceId),
      coverageCheckId: issue.coverageCheckId ? String(issue.coverageCheckId) : "",
      entityId: issue.entityId || "",
      title: issue.title,
      issueType: issue.issueType,
      severity: issue.severity,
      status: issue.status,
      evidence: issue.evidence || "",
      recommendation: issue.recommendation || "",
      assignedToId: issue.assignedToId ? String(issue.assignedToId) : "",
    });
    setModalOpen(true);
  };

  const saveIssue = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      sourceId: Number(form.sourceId),
      coverageCheckId: form.coverageCheckId ? Number(form.coverageCheckId) : null,
      assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
    };

    try {
      if (editingId) {
        await client.put(`/issues/${editingId}`, payload);
        setMessage("Issue updated.");
      } else {
        await client.post("/issues", payload);
        setMessage("Issue created.");
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save issue.");
    }
  };

  const createTask = async (issue) => {
    try {
      await client.post(`/issues/${issue.id}/create-task`, {
        title: `Investigate: ${issue.title}`,
        description: issue.recommendation || issue.evidence || "",
        assignedToId: issue.assignedToId || null,
      });
      setMessage("Task created from issue.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to create task from issue.");
    }
  };

  const columns = [
    { key: "title", header: "Issue" },
    { key: "source", header: "Source", render: (row) => row.source?.name || "Unknown" },
    { key: "issueType", header: "Type", render: (row) => <Badge value={row.issueType} /> },
    { key: "severity", header: "Severity", render: (row) => <Badge value={row.severity} /> },
    { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
    { key: "assignedTo", header: "Assigned", render: (row) => row.assignedTo?.fullName || "Unassigned" },
    { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="row-actions">
          <Button variant="secondary" onClick={() => copyText(row.evidence || "")}>
            Copy evidence
          </Button>
          <Button variant="secondary" onClick={() => copyText(row.recommendation || "")}>
            Copy recommendation
          </Button>
          {canEdit ? (
            <>
              <Button variant="secondary" onClick={() => createTask(row)}>
                Create task
              </Button>
              <Button variant="secondary" onClick={() => openEdit(row)}>
                Edit
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
  ];

  if (loading) {
    return <LoadingState label="Loading issues..." />;
  }

  return (
    <div className="page-grid">
      <Card
        title="Issues"
        subtitle="Record parser failures, CSI coverage problems and evidence-backed recommendations for follow-up."
        actions={canEdit ? <Button onClick={openCreate}>Create issue</Button> : null}
      >
        <div className="filter-grid">
          <TextInput label="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <SelectInput
            label="Issue type"
            value={filters.issueType}
            onChange={(event) => setFilters({ ...filters, issueType: event.target.value })}
            options={[
              { value: "", label: "All types" },
              { value: "EXTRACTION_FAILED", label: "EXTRACTION_FAILED" },
              { value: "TITLE_SELECTOR_FAILED", label: "TITLE_SELECTOR_FAILED" },
              { value: "LINK_SELECTOR_FAILED", label: "LINK_SELECTOR_FAILED" },
              { value: "DATE_SELECTOR_FAILED", label: "DATE_SELECTOR_FAILED" },
              { value: "EMPTY_NEWS_LIST", label: "EMPTY_NEWS_LIST" },
              { value: "MISSING_IN_CSI", label: "MISSING_IN_CSI" },
              { value: "DUPLICATE_IN_CSI", label: "DUPLICATE_IN_CSI" },
              { value: "TITLE_MISMATCH", label: "TITLE_MISMATCH" },
              { value: "URL_MISMATCH", label: "URL_MISMATCH" },
              { value: "DATE_MISMATCH", label: "DATE_MISMATCH" },
              { value: "CSI_DATA_REQUIRED", label: "CSI_DATA_REQUIRED" },
              { value: "CSI_API_ERROR", label: "CSI_API_ERROR" },
              { value: "INVALID_EXPORT_FILE", label: "INVALID_EXPORT_FILE" },
              { value: "OTHER", label: "OTHER" },
            ]}
          />
          <SelectInput
            label="Severity"
            value={filters.severity}
            onChange={(event) => setFilters({ ...filters, severity: event.target.value })}
            options={[
              { value: "", label: "All severities" },
              { value: "LOW", label: "LOW" },
              { value: "MEDIUM", label: "MEDIUM" },
              { value: "HIGH", label: "HIGH" },
              { value: "CRITICAL", label: "CRITICAL" },
            ]}
          />
          <SelectInput
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            options={[
              { value: "", label: "All statuses" },
              { value: "NEW", label: "NEW" },
              { value: "IN_PROGRESS", label: "IN_PROGRESS" },
              { value: "RESOLVED", label: "RESOLVED" },
              { value: "IGNORED", label: "IGNORED" },
            ]}
          />
          <div className="form-field">
            <span>&nbsp;</span>
            <Button variant="secondary" onClick={() => loadData(filters)}>
              Apply filters
            </Button>
          </div>
        </div>

        {error ? <div className="error-text">{error}</div> : null}
        {message ? <div className="info-box">{message}</div> : null}
        <DataTable columns={columns} rows={issues} />
      </Card>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit issue" : "Create issue"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={saveIssue}>
          <SelectInput
            label="Source"
            value={form.sourceId}
            onChange={(event) => setForm({ ...form, sourceId: event.target.value })}
            options={[
              { value: "", label: "Select source" },
              ...sources.map((source) => ({ value: String(source.id), label: source.name })),
            ]}
          />
          <TextInput label="Coverage check ID" value={form.coverageCheckId} onChange={(event) => setForm({ ...form, coverageCheckId: event.target.value })} />
          <TextInput label="Entity ID" value={form.entityId} onChange={(event) => setForm({ ...form, entityId: event.target.value })} />
          <TextInput label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <SelectInput
            label="Issue type"
            value={form.issueType}
            onChange={(event) => setForm({ ...form, issueType: event.target.value })}
            options={[
              { value: "EXTRACTION_FAILED", label: "EXTRACTION_FAILED" },
              { value: "TITLE_SELECTOR_FAILED", label: "TITLE_SELECTOR_FAILED" },
              { value: "LINK_SELECTOR_FAILED", label: "LINK_SELECTOR_FAILED" },
              { value: "DATE_SELECTOR_FAILED", label: "DATE_SELECTOR_FAILED" },
              { value: "EMPTY_NEWS_LIST", label: "EMPTY_NEWS_LIST" },
              { value: "MISSING_IN_CSI", label: "MISSING_IN_CSI" },
              { value: "DUPLICATE_IN_CSI", label: "DUPLICATE_IN_CSI" },
              { value: "TITLE_MISMATCH", label: "TITLE_MISMATCH" },
              { value: "URL_MISMATCH", label: "URL_MISMATCH" },
              { value: "DATE_MISMATCH", label: "DATE_MISMATCH" },
              { value: "CSI_DATA_REQUIRED", label: "CSI_DATA_REQUIRED" },
              { value: "CSI_API_ERROR", label: "CSI_API_ERROR" },
              { value: "INVALID_EXPORT_FILE", label: "INVALID_EXPORT_FILE" },
              { value: "OTHER", label: "OTHER" },
            ]}
          />
          <SelectInput
            label="Severity"
            value={form.severity}
            onChange={(event) => setForm({ ...form, severity: event.target.value })}
            options={[
              { value: "LOW", label: "LOW" },
              { value: "MEDIUM", label: "MEDIUM" },
              { value: "HIGH", label: "HIGH" },
              { value: "CRITICAL", label: "CRITICAL" },
            ]}
          />
          <SelectInput
            label="Status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            options={[
              { value: "NEW", label: "NEW" },
              { value: "IN_PROGRESS", label: "IN_PROGRESS" },
              { value: "RESOLVED", label: "RESOLVED" },
              { value: "IGNORED", label: "IGNORED" },
            ]}
          />
          <SelectInput
            label="Assigned user"
            value={form.assignedToId}
            onChange={(event) => setForm({ ...form, assignedToId: event.target.value })}
            options={[
              { value: "", label: "Unassigned" },
              ...users.map((person) => ({ value: String(person.id), label: `${person.fullName} (${person.role})` })),
            ]}
          />
          <TextInput
            className="full-span"
            label="Evidence"
            textarea
            rows={5}
            value={form.evidence}
            onChange={(event) => setForm({ ...form, evidence: event.target.value })}
          />
          <TextInput
            className="full-span"
            label="Recommendation"
            textarea
            rows={5}
            value={form.recommendation}
            onChange={(event) => setForm({ ...form, recommendation: event.target.value })}
          />
          <div className="row-actions full-span">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
                setForm(initialForm);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{editingId ? "Save issue" : "Create issue"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete issue"
        description={`Delete issue "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await client.delete(`/issues/${deleteTarget.id}`);
            setDeleteTarget(null);
            setMessage("Issue deleted.");
            loadData();
          } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to delete issue.");
          }
        }}
      />
    </div>
  );
}

export default Issues;
