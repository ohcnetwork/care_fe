import React from "react";

interface PluginErrorBoundaryProps {
  children: React.ReactNode;
  pluginName: string;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  /** A change (by `Object.is`) clears a caught error and remounts `children`. */
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
