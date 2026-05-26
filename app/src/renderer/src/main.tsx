import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { App } from "./App";
import "../styles/index.css";

// Inject mock API when running outside Electron (browser dev)
if (!window.api) {
  import("./lib/mock-api").then(({ mockApi }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).api = mockApi;
    console.log("[AgentGrid] Mock API injected — running in browser mode");
  });
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
