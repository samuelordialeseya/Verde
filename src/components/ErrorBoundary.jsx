import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red", background: "#fee", height: "100vh", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: 24, fontWeight: "bold" }}>App Crashed!</h1>
          <p>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ overflow: "auto", padding: 10, background: "#fcc", marginTop: 10 }}>
            {this.state.error && this.state.error.stack}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: "10px 20px", marginTop: 20, background: "red", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Clear LocalStorage & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
