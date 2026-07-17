import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("React Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40, margin: 20, background: "#fff3f3",
          border: "2px solid #e6457a", borderRadius: 12, fontFamily: "monospace"
        }}>
          <h2 style={{ color: "#c0182e", margin: "0 0 12px" }}>💥 Lỗi render</h2>
          <pre style={{ color: "#c0182e", fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 12 }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ color: "#888", fontSize: 12, whiteSpace: "pre-wrap" }}>
            {this.state.info && this.state.info.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 14, padding: "8px 20px", background: "#e6457a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
