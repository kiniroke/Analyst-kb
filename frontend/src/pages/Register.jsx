import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import TextInput from "../components/common/TextInput";
import { useAuth } from "../context/AuthContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "Data Analytics Department",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/login");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Card title="Register" subtitle="Self-registration creates a viewer account for read-only access." className="auth-card">
        <form className="form-grid single-column" onSubmit={handleSubmit}>
          <TextInput label="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <TextInput label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <TextInput label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          {error ? <div className="error-text">{error}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="muted-text">
          Already registered? <Link to="/login">Back to login</Link>
        </p>
      </Card>
    </div>
  );
}

export default Register;
