import { Component } from "react";

/**
 * ErrorBoundary catches any unhandled JS errors thrown during rendering
 * anywhere in the component tree below it. Without this, a single bad
 * render crashes the entire app and shows a blank white screen.
 *
 * This is a class component by necessity — React's error boundary API
 * (getDerivedStateFromError / componentDidCatch) is not yet available
 * as hooks.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unknown error" };
  }

  componentDidCatch(error, info) {
    // In production you would send this to an error tracking service
    // like Sentry: Sentry.captureException(error, { extra: info });
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.href = "/";
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-shell auth-page">
          <section className="auth-card" style={{ textAlign: "center" }}>
            <p className="eyebrow">Unexpected Error</p>
            <h1 style={{ fontSize: "2rem" }}>Something went wrong</h1>
            <p className="hero__copy">
              The app hit an unexpected error. This has been logged. Try going
              back to the home page.
            </p>
            {this.state.errorMessage && (
              <p
                className="status-message status-message--error"
                style={{ fontFamily: "monospace", fontSize: "0.85rem", textAlign: "left" }}
              >
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              className="button button--primary"
              style={{ justifySelf: "center" }}
              onClick={() => this.handleReset()}
            >
              Back to Home
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
