import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches render/lifecycle errors anywhere below it
 * and shows a recovery card instead of React unmounting to a blank white page.
 * (Event-handler and async errors aren't caught by React boundaries - those are
 * handled at their call sites, e.g. the Run panel and save flow.)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log for debugging; in production this is where an error reporter would hook in.
    console.error('Uncaught error in React tree:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-400">
            The app hit an unexpected error and couldn't render this view. Your saved work isn't
            affected - try again, or head back to the home page.
          </p>

          {error.message && (
            <pre className="mt-4 overflow-x-auto rounded border border-red-900 bg-red-950/40 p-2 text-xs text-red-300">
              {error.message}
            </pre>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Go home
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
