import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email.includes("@")) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    try {
      await login(form);
      navigate(location.state?.from || "/favorites");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        {error && <p className="status-message status-message--error">{error}</p>}
        <label className="filter-field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="filter-field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="auth-card__footer">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
