import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { copyText } from "../helpers";

const initialForm = {
  sourceName: "",
  sourceType: "NEWS_PORTAL",
  region: "",
  issueCategory: "MISSING_DATE",
  priority: "",
  shortDescription: "",
  analystNote: "",
};

function CaseAssistant() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api.post("/case-assistant/generate", form);
      setResult(data);
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) {
      return;
    }
    await api.post("/cases", {
      title: result.title,
      sourceName: form.sourceName,
      sourceType: form.sourceType,
      issueCategory: form.issueCategory,
      priority: result.suggestedPriority,
      description: result.description,
      recommendation: result.recommendedAction,
      itComment: result.itComment,
      reportNote: result.reportNote,
    });
    setMessage("Case saved successfully.");
  };

  return (
    <div className="page-grid">
      <div className="page-toolbar">
        <div>
          <h1>Case Assistant</h1>
          <p>Generate structured case text, IT handoff comments, and reporting notes from analyst observations.</p>
        </div>
      </div>

      <div className="assistant-grid">
        <div className="card">
          <form className="form-grid" onSubmit={handleGenerate}>
            <label>
              Source name
              <input value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} required />
            </label>
            <label>
              Source type
              <input value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })} required />
            </label>
            <label>
              Region
              <input value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} />
            </label>
            <label>
              Issue category
              <select value={form.issueCategory} onChange={(event) => setForm({ ...form, issueCategory: event.target.value })}>
                <option value="MISSING_DATE">MISSING_DATE</option>
                <option value="MISSING_REGION">MISSING_REGION</option>
                <option value="DUPLICATE_SOURCE">DUPLICATE_SOURCE</option>
                <option value="API_RESPONSE_ERROR">API_RESPONSE_ERROR</option>
                <option value="PARSING_ERROR">PARSING_ERROR</option>
                <option value="MISSING_TEXT">MISSING_TEXT</option>
                <option value="INCORRECT_URL">INCORRECT_URL</option>
                <option value="SOCIAL_ACCOUNT_INCOMPLETE">SOCIAL_ACCOUNT_INCOMPLETE</option>
                <option value="DATA_QUALITY">DATA_QUALITY</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option value="">Use suggested priority</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </label>
            <label className="full-span">
              Short description
              <textarea
                value={form.shortDescription}
                onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
                rows="3"
                required
              />
            </label>
            <label className="full-span">
              Additional analyst note
              <textarea
                value={form.analystNote}
                onChange={(event) => setForm({ ...form, analystNote: event.target.value })}
                rows="3"
              />
            </label>
            <div className="action-row">
              <button className="button" type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate Case"}
              </button>
              <button className="button button-secondary" type="button" onClick={() => { setForm(initialForm); setResult(null); setMessage(""); }}>
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="section-head">
            <h2>Generated result</h2>
          </div>
          {result ? (
            <div className="detail-grid">
              <div className="full-span"><strong>Case title:</strong> {result.title}</div>
              <div className="full-span"><strong>Recommended action:</strong> {result.recommendedAction}</div>
              <div><strong>Suggested priority:</strong> {result.suggestedPriority}</div>
              <div><strong>Suggested task title:</strong> {result.suggestedTaskTitle}</div>
              <div className="full-span">
                <div className="copy-row">
                  <strong>IT department comment</strong>
                  <button className="text-button" onClick={() => copyText(result.itComment)}>
                    Copy IT comment
                  </button>
                </div>
                <p>{result.itComment}</p>
              </div>
              <div className="full-span">
                <div className="copy-row">
                  <strong>Analytical report note</strong>
                  <button className="text-button" onClick={() => copyText(result.reportNote)}>
                    Copy report note
                  </button>
                </div>
                <p>{result.reportNote}</p>
              </div>
              {user?.role !== "VIEWER" ? (
                <button className="button" type="button" onClick={handleSave}>
                  Save as case
                </button>
              ) : null}
            </div>
          ) : (
            <p className="muted-text">Generated content will appear here after the form is submitted.</p>
          )}
          {message ? <div className="info-box">{message}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default CaseAssistant;
