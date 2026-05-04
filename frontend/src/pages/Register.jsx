import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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

    if (form.name.trim().length < 2) {
      setError("Name should be at least 2 characters.");
      setLoading(false);
      return;
    }

    if (!form.email.includes("@")) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password should be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      await register(form);
      navigate("/favorites");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Create your account</p>
        <h1>Register</h1>
        {error && <p className="status-message status-message--error">{error}</p>}
        <label className="filter-field">
          <span>Name</span>
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
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
          {loading ? "Creating..." : "Register"}
        </button>
        <p className="auth-card__footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

export default Register;
