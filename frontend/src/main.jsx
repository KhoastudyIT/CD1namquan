import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fbfdfb", padding: 20 }}>
          <div style={{ textAlign: "center", maxWidth: 480, background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #fee2e2", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
            <h2 style={{ color: "#dc2626", margin: "0 0 10px", fontSize: 18 }}>Đã xảy ra lỗi hiển thị</h2>
            <p style={{ color: "#4b5563", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {this.state.error?.message || "Không thể tải ứng dụng lúc này."}
            </p>
            <button
              className="btn-pill"
              onClick={() => window.location.reload()}
              style={{ padding: "10px 24px", cursor: "pointer", background: "var(--green-ink)", color: "#fff", border: "none", borderRadius: 999 }}
            >
              🔄 Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
