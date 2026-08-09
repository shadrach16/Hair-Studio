// ErrorBoundary.tsx — keeps one broken surface from taking down the whole shell.
//
// Used per-tab by TabScreen: if the Looks tab throws, Try On keeps working and
// the user sees a calm recovery card instead of a white screen. The app
// previously had no boundary at all — any render error blanked the app.

import React from 'react';
import { EmptyState } from './EmptyState';

interface Props {
  /** Name of the surface, used in the message and for logging. */
  scope?: string;
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep it in the device log; this is where a white-screen bug becomes
    // diagnosable from a user's report.
    console.error(`[ErrorBoundary${this.props.scope ? `:${this.props.scope}` : ''}]`, error, info);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <EmptyState
        title="Something went wrong"
        description={
          this.props.scope
            ? `${this.props.scope} couldn't load. The rest of the app still works.`
            : "This section couldn't load. The rest of the app still works."
        }
        action={
          <button
            onClick={this.reset}
            className="rounded-full bg-ink px-5 py-2.5 text-label text-surface"
          >
            Try again
          </button>
        }
      />
    );
  }
}

export default ErrorBoundary;
