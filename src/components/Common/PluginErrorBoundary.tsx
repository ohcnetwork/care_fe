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
}

export class PluginErrorBoundary extends React.Component<
  PluginErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: PluginErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
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
