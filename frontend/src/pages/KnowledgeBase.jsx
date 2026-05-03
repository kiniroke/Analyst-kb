import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import Modal from "../components/common/Modal";
import SelectInput from "../components/common/SelectInput";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";
import { copyText, formatDate, humanizeEnum } from "../helpers";

const categories = [
  "SOURCE_EXTRACTION",
  "CSI_EXPORT",
  "CSI_API",
  "COVERAGE_VALIDATION",
  "SELECTORS",
  "DATA_MATCHING",
  "TROUBLESHOOTING",
  "REPORTING",
];

const initialForm = {
  title: "",
  category: "SOURCE_EXTRACTION",
  summary: "",
  content: "",
  steps: "",
};

function KnowledgeBase() {
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [articles, setArticles] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadArticles = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const { data } = await client.get("/knowledge", { params: currentFilters });
      setArticles(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load knowledge base.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const grouped = useMemo(() => {
    return categories.map((category) => ({
      category,
      items: articles.filter((article) => article.category === category),
    }));
  }, [articles]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      category: article.category,
      summary: article.summary,
      content: article.content,
      steps: article.steps.join("\n"),
    });
    setModalOpen(true);
  };

  const handleCopyInstructions = async (article) => {
    try {
      const payload = [
        article.title,
        "",
        ...article.steps.map((step, index) => `${index + 1}. ${step}`),
      ].join("\n");
      await copyText(payload);
      setMessage(`Instructions copied for "${article.title}".`);
      setError("");
    } catch {
      setError("Failed to copy instructions.");
    }
  };

  const saveArticle = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      steps: form.steps.split("\n").map((step) => step.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await client.put(`/knowledge/${editingId}`, payload);
        setMessage("Knowledge article updated.");
      } else {
        await client.post("/knowledge", payload);
        setMessage("Knowledge article created.");
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);
      loadArticles();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save knowledge article.");
    }
  };

  if (loading) {
    return <LoadingState label="Loading knowledge base..." />;
  }

  return (
    <div className="page-grid">
      <Card
        title="Knowledge Base"
        subtitle="Internal guidance for selector configuration, CSI export handling, matching logic and issue escalation."
        actions={canEdit ? <Button onClick={openCreate}>Create article</Button> : null}
      >
        <div className="filter-grid">
          <TextInput label="Search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <SelectInput
            label="Category"
            value={filters.category}
            onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            options={[{ value: "", label: "All categories" }, ...categories.map((category) => ({ value: category, label: humanizeEnum(category, { titleCase: true }) }))]}
          />
          <div className="form-field">
            <span>&nbsp;</span>
            <Button variant="secondary" onClick={() => loadArticles(filters)}>
              Apply filters
            </Button>
          </div>
        </div>

        {error ? <div className="error-text">{error}</div> : null}
        {message ? <div className="info-box">{message}</div> : null}
      </Card>

      <div className="article-grid">
        {articles.length ? (
          articles.map((article) => (
            <Card key={article.id} className="knowledge-card">
              <div className="knowledge-card-top">
                <span className="knowledge-card-category">{humanizeEnum(article.category, { titleCase: true })}</span>
                <span className="knowledge-card-updated">Updated {formatDate(article.updatedAt)}</span>
              </div>

              <div className="knowledge-card-body">
                <h3 className="knowledge-card-title">{article.title}</h3>
                <p className="knowledge-card-summary">{article.summary}</p>
                <div className="knowledge-card-footer">
                  <div className="knowledge-card-author">
                    {article.createdBy?.fullName || "Internal article"}
                  </div>

                  <div className="knowledge-card-actions">
                    <Button variant="secondary" onClick={() => setSelectedArticle(article)}>
                      Open
                    </Button>
                    <Button variant="secondary" onClick={() => handleCopyInstructions(article)}>
                      Copy steps
                    </Button>
                    {canEdit ? <Button variant="secondary" onClick={() => openEdit(article)}>Edit</Button> : null}
                    {canEdit ? <Button variant="danger" onClick={() => setDeleteTarget(article)}>Delete</Button> : null}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No articles" description="No articles match the selected filters." />
        )}
      </div>

      <Card title="Knowledge Coverage" subtitle="Shows which guidance areas already have articles for analysts.">
        <div className="knowledge-groups">
          {grouped.map((group) => (
            <div key={group.category} className="knowledge-group">
              <strong>{humanizeEnum(group.category, { titleCase: true })}</strong>
              <span className="muted-text">{group.items.length} article(s)</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={Boolean(selectedArticle)} title={selectedArticle?.title || "Knowledge article"} onClose={() => setSelectedArticle(null)}>
        {selectedArticle ? (
          <div className="detail-grid">
            <div><strong>Category:</strong> {humanizeEnum(selectedArticle.category, { titleCase: true })}</div>
            <div><strong>Author:</strong> {selectedArticle.createdBy?.fullName || "Unknown"}</div>
            <div className="full-span"><strong>Summary:</strong> {selectedArticle.summary}</div>
            <div className="full-span"><strong>Content:</strong> {selectedArticle.content}</div>
            <div className="full-span">
              <strong>Steps:</strong>
              <ol className="step-list">
                {selectedArticle.steps.map((step, index) => (
                  <li key={`${selectedArticle.id}-${index}`}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={modalOpen}
        title={editingId ? "Edit knowledge article" : "Create knowledge article"}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <form className="form-grid" onSubmit={saveArticle}>
          <TextInput label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <SelectInput
            label="Category"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            options={categories.map((category) => ({ value: category, label: humanizeEnum(category, { titleCase: true }) }))}
          />
          <TextInput
            className="full-span"
            label="Summary"
            textarea
            rows={3}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            required
          />
          <TextInput
            className="full-span"
            label="Content"
            textarea
            rows={7}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            required
          />
          <TextInput
            className="full-span"
            label="Steps"
            textarea
            rows={7}
            value={form.steps}
            onChange={(event) => setForm({ ...form, steps: event.target.value })}
            required
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
            <Button type="submit">{editingId ? "Save article" : "Create article"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete knowledge article"
        description={`Delete article "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await client.delete(`/knowledge/${deleteTarget.id}`);
            setDeleteTarget(null);
            setMessage("Knowledge article deleted.");
            loadArticles();
          } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to delete knowledge article.");
          }
        }}
      />
    </div>
  );
}

export default KnowledgeBase;
