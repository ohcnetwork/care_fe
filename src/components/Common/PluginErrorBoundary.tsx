import React from "react";

interface PluginErrorBoundaryProps {
  children: React.ReactNode;
  pluginName: string;
  fallback?: React.ReactNode;
  /** Notified once the boundary has caught. Callers that must react to the
   *  failure elsewhere in the app use it — the questionnaire fill page
   *  records the question so submit-time validation stops requiring an
   *  input that is no longer on screen. */
  onError?: (error: Error) => void;
  /** Identity checked with `Object.is` against the previous render's value.
   *  A change clears a caught error and gives `children` a fresh mount —
   *  the recovery moment a caller has, since `getDerivedStateFromError` has
   *  no reset path of its own and would otherwise show the fallback forever
   *  once tripped. Omit it (or pass a value that never changes) to keep the
   *  boundary's original latch-forever behavior. */
  resetKey?: unknown;
}

interface PluginErrorBoundaryState {
  hasError: boolean;
  resetKey?: unknown;
}

export class PluginErrorBoundary extends React.Component<
  PluginErrorBoundaryProps,
  PluginErrorBoundaryState
> {
  constructor(props: PluginErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, resetKey: props.resetKey };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /** Runs before every render (mount, update, and the re-render that
   *  follows `getDerivedStateFromError`). Only a genuine `resetKey` change
   *  clears `hasError`; an unrelated re-render with the same key leaves an
   *  already-caught error latched, so there is no reset/re-throw flicker
   *  loop while a plugin is still broken. */
  static getDerivedStateFromProps(
    props: PluginErrorBoundaryProps,
    state: PluginErrorBoundaryState,
  ) {
    if (!Object.is(props.resetKey, state.resetKey)) {
      return { hasError: false, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[Plugin Error] Plugin "${this.props.pluginName}" encountered an error:`,
      error,
      errorInfo,
    );
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}
