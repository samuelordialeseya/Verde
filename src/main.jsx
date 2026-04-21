import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";

alert("JS ENTRY ALERT!");

// We'll move store initialization into App's useEffect for better error handling/reactivity
const rootElement = document.getElementById("root");

if (!rootElement) {
  alert("FATAL: Root element not found!");
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (err) {
    alert("FATAL ERROR during mount: " + err.message);
  }
}
