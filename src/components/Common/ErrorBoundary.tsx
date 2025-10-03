import * as Sentry from "@sentry/browser";
import { Component, ErrorInfo, ReactNode } from "react";
import { withTranslation, WithTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props & WithTranslation, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    Sentry.captureException(error, {
      extra: {
        errorInfo,
      },
    });
  }

  public render() {
    const { t } = this.props;
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || <h1>{t("error_boundary_message")}</h1>;
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
