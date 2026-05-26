import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full items-center justify-center bg-grid-bg p-8">
          <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <div className="mb-3 text-2xl">⚠</div>
            <h2 className="mb-2 font-mono text-sm font-semibold text-red-400">
              Something went wrong
            </h2>
            <p className="mb-4 font-mono text-xs text-grid-fg-muted">
              {this.state.error?.message ?? "Unknown error"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg bg-grid-surface px-4 py-2 font-mono text-xs text-grid-fg-secondary transition-colors hover:bg-grid-surface-hover"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
