import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="page-shell auth-page">
      <section className="auth-card" style={{ textAlign: "center" }}>
        <p className="eyebrow">Error 404</p>
        <h1>Page not found</h1>
        <p className="hero__copy">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="button button--primary" style={{ justifySelf: "center" }}>
          Back to Home
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
