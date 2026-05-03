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
import StatCard from "../components/common/StatCard";
import TextInput from "../components/common/TextInput";
import { formatDate } from "../helpers";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "VIEWER",
  department: "Data Analytics Department",
};

function AdminPanel() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryResponse, usersResponse, logsResponse, batchesResponse, coverageResponse] = await Promise.all([
        client.get("/reports/summary"),
        client.get("/users"),
        client.get("/audit-logs"),
        client.get("/csi/batches"),
        client.get("/coverage"),
      ]);
      setSummary(summaryResponse.data);
      setUsers(usersResponse.data);
      setLogs(logsResponse.data);
      setBatches(batchesResponse.data);
      setCoverage(coverageResponse.data.slice(0, 10));
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load admin panel data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (account) => {
    setEditingId(account.id);
    setForm({
      fullName: account.fullName,
      email: account.email,
      password: "",
      role: account.role,
      department: account.department || "",
    });
    setModalOpen(true);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await client.put(`/users/${editingId}`, form);
        setMessage("User updated.");
      } else {
        await client.post("/users", form);
        setMessage("User created.");
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save user.");
    }
  };

  if (loading) {
    return <LoadingState label="Loading admin panel..." />;
  }

  return (
    <div className="page-grid">
      <div className="stats-grid">
        <StatCard label="Users" value={users.length} />
        <StatCard label="Sources" value={summary?.cards.totalSources || 0} />
        <StatCard label="CSI batches" value={summary?.cards.csiBatchesUploaded || 0} />
        <StatCard label="Coverage checks" value={summary?.cards.coverageChecks || 0} />
      </div>

      <Card
        title="User Management"
        subtitle="Create accounts, change roles and maintain access for analysts and viewers."
        actions={<Button onClick={openCreate}>Create user</Button>}
      >
        {error ? <div className="error-text">{error}</div> : null}
        {message ? <div className="info-box">{message}</div> : null}
        <DataTable
          columns={[
            { key: "fullName", header: "Full name" },
            { key: "email", header: "Email" },
            { key: "role", header: "Role", render: (row) => <Badge value={row.role} /> },
            { key: "department", header: "Department" },
            { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="row-actions">
                  <Button variant="secondary" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => setDeleteTarget(row)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          rows={users}
        />
      </Card>

      <div className="table-grid">
        <Card title="CSI Import Batches">
          <DataTable
            columns={[
              { key: "mode", header: "Mode", render: (row) => <Badge value={row.mode} /> },
              { key: "sourceLabel", header: "Source label" },
              { key: "totalRows", header: "Rows" },
              { key: "uploadedBy", header: "Uploaded by", render: (row) => row.uploadedBy?.fullName || "Unknown" },
              { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
            ]}
            rows={batches}
          />
        </Card>

        <Card title="Latest Coverage Checks">
          <DataTable
            columns={[
              { key: "source", header: "Source", render: (row) => row.source?.name || "Unknown" },
              { key: "status", header: "Status", render: (row) => <Badge value={row.status} /> },
              { key: "coveragePercent", header: "Coverage %" },
              { key: "checkedAt", header: "Checked at", render: (row) => formatDate(row.checkedAt) },
            ]}
            rows={coverage}
          />
        </Card>
      </div>

      <Card title="Audit Logs" subtitle="Recent system actions for traceability and internship defense evidence.">
        <DataTable
          columns={[
            { key: "createdAt", header: "Timestamp", render: (row) => formatDate(row.createdAt) },
            { key: "user", header: "User", render: (row) => row.user?.fullName || "System" },
            { key: "action", header: "Action" },
            { key: "entity", header: "Entity" },
            { key: "entityId", header: "Entity ID" },
            { key: "details", header: "Details", render: (row) => JSON.stringify(row.details || {}) },
          ]}
          rows={logs}
        />
      </Card>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit user" : "Create user"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={saveUser}>
          <TextInput label="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <TextInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required={!editingId}
          />
          <SelectInput
            label="Role"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            options={[
              { value: "ADMIN", label: "ADMIN" },
              { value: "ANALYST", label: "ANALYST" },
              { value: "VIEWER", label: "VIEWER" },
            ]}
          />
          <TextInput
            className="full-span"
            label="Department"
            value={form.department}
            onChange={(event) => setForm({ ...form, department: event.target.value })}
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
            <Button type="submit">{editingId ? "Save user" : "Create user"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete user"
        description={`Delete user "${deleteTarget?.email}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await client.delete(`/users/${deleteTarget.id}`);
            setDeleteTarget(null);
            setMessage("User deleted.");
            loadData();
          } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to delete user.");
          }
        }}
      />
    </div>
  );
}

export default AdminPanel;
