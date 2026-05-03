import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import Modal from "../components/common/Modal";
import SelectInput from "../components/common/SelectInput";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";
import { formatDate, humanizeEnum } from "../helpers";

const initialForm = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  assignedToId: "",
  relatedIssueId: "",
};

const statuses = ["TODO", "IN_PROGRESS", "DONE"];

function Tasks() {
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [tasks, setTasks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ assignedToId: "", priority: "" });
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
      const requests = [
        client.get("/tasks", { params: currentFilters }),
        client.get("/issues"),
      ];
      if (user?.role === "ADMIN") {
        requests.push(client.get("/users"));
      }

      const responses = await Promise.all(requests);
      setTasks(responses[0].data);
      setIssues(responses[1].data);
      setUsers(user?.role === "ADMIN" ? responses[2].data : []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const groupedTasks = useMemo(() => {
    return statuses.reduce((accumulator, status) => {
      accumulator[status] = tasks.filter((task) => task.status === status);
      return accumulator;
    }, {});
  }, [tasks]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
      assignedToId: task.assignedToId ? String(task.assignedToId) : "",
      relatedIssueId: task.relatedIssueId ? String(task.relatedIssueId) : "",
    });
    setModalOpen(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
      relatedIssueId: form.relatedIssueId ? Number(form.relatedIssueId) : null,
      dueDate: form.dueDate || null,
    };

    try {
      if (editingId) {
        await client.put(`/tasks/${editingId}`, payload);
        setMessage("Task updated.");
      } else {
        await client.post("/tasks", payload);
        setMessage("Task created.");
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save task.");
    }
  };

  const moveTask = async (task, status) => {
    try {
      await client.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedToId: task.assignedToId,
        relatedIssueId: task.relatedIssueId,
      });
      setMessage(`Task moved to ${humanizeEnum(status)}.`);
      loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to change task status.");
    }
  };

  const applyFilters = () => {
    loadData(filters);
  };

  if (loading) {
    return <LoadingState label="Loading tasks..." />;
  }

  return (
    <div className="page-grid">
      <Card
        title="Tasks"
        subtitle="Track follow-up work from parser issues and coverage checks in a simple analyst Kanban board."
        actions={canEdit ? <Button onClick={openCreate}>Create task</Button> : null}
      >
        <div className="filter-grid">
          <SelectInput
            label="Assigned user"
            value={filters.assignedToId}
            onChange={(event) => setFilters({ ...filters, assignedToId: event.target.value })}
            options={[
              { value: "", label: "All users" },
              ...users.map((person) => ({ value: String(person.id), label: `${person.fullName} (${person.role})` })),
            ]}
          />
          <SelectInput
            label="Priority"
            value={filters.priority}
            onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
            options={[
              { value: "", label: "All priorities" },
              { value: "LOW", label: "LOW" },
              { value: "MEDIUM", label: "MEDIUM" },
              { value: "HIGH", label: "HIGH" },
              { value: "CRITICAL", label: "CRITICAL" },
            ]}
          />
          <div className="form-field">
            <span>&nbsp;</span>
            <Button variant="secondary" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </div>

        {error ? <div className="error-text">{error}</div> : null}
        {message ? <div className="info-box">{message}</div> : null}
      </Card>

      <div className="kanban-grid">
        {statuses.map((status) => (
          <Card key={status} title={humanizeEnum(status)}>
            {groupedTasks[status]?.length ? (
              <div className="kanban-stack">
                {groupedTasks[status].map((task) => (
                  <div key={task.id} className="kanban-card">
                    <div className="kanban-card-head">
                      <strong>{task.title}</strong>
                      <Badge value={task.priority} />
                    </div>
                    <p className="muted-text">{task.description || "No description provided."}</p>
                    <div className="detail-list">
                      <div><strong>Assigned:</strong> {task.assignedTo?.fullName || "Not assigned"}</div>
                      <div><strong>Due:</strong> {formatDate(task.dueDate)}</div>
                      <div><strong>Related issue:</strong> {task.relatedIssue?.title || "Not linked"}</div>
                    </div>
                    {canEdit ? (
                      <div className="row-actions">
                        {statuses
                          .filter((nextStatus) => nextStatus !== task.status)
                          .map((nextStatus) => (
                            <Button key={nextStatus} variant="secondary" onClick={() => moveTask(task, nextStatus)}>
                              Move to {humanizeEnum(nextStatus)}
                            </Button>
                          ))}
                        <Button variant="secondary" onClick={() => openEdit(task)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => setDeleteTarget(task)}>
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No tasks" description={`No tasks in ${humanizeEnum(status)}.`} />
            )}
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit task" : "Create task"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={saveTask}>
          <TextInput label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <SelectInput
            label="Status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
            options={statuses.map((status) => ({ value: status, label: humanizeEnum(status) }))}
          />
          <SelectInput
            label="Priority"
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
            options={[
              { value: "LOW", label: "LOW" },
              { value: "MEDIUM", label: "MEDIUM" },
              { value: "HIGH", label: "HIGH" },
              { value: "CRITICAL", label: "CRITICAL" },
            ]}
          />
          <TextInput
            label="Due date"
            type="datetime-local"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
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
          <SelectInput
            label="Related issue"
            value={form.relatedIssueId}
            onChange={(event) => setForm({ ...form, relatedIssueId: event.target.value })}
            options={[
              { value: "", label: "No issue link" },
              ...issues.map((issue) => ({ value: String(issue.id), label: issue.title })),
            ]}
          />
          <TextInput
            className="full-span"
            label="Description"
            textarea
            rows={5}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
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
            <Button type="submit">{editingId ? "Save task" : "Create task"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete task"
        description={`Delete task "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await client.delete(`/tasks/${deleteTarget.id}`);
            setDeleteTarget(null);
            setMessage("Task deleted.");
            loadData();
          } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to delete task.");
          }
        }}
      />
    </div>
  );
}

export default Tasks;
