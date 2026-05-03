import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Card title="Login" subtitle="Access Parser Coverage Validator for source extraction and CSI coverage QA." className="auth-card">
        <form className="form-grid single-column" onSubmit={handleSubmit}>
          <TextInput label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <TextInput label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          {error ? <div className="error-text">{error}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>

        <div className="info-box">
          <strong>Demo credentials</strong>
          <div>admin@csi.local / Admin12345</div>
          <div>analyst@csi.local / Analyst12345</div>
          <div>viewer@csi.local / Viewer12345</div>
        </div>

        <p className="muted-text">
          No account yet? <Link to="/register">Register a viewer account</Link>
        </p>
      </Card>
    </div>
  );
}

export default Login;
