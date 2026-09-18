// Importing altcha registers the <altcha-widget> custom element.
import "altcha";
import {
  type CSSVariables,
  State,
  type WidgetAttributes,
  type WidgetMethods,
} from "altcha/types";
import type {} from "altcha/types/react";
import { useEffect, useEffectEvent, useRef } from "react";
import { useTranslation } from "react-i18next";

import careConfig from "@careConfig";

interface AltchaWidgetProps {
  onStateChange: (payload?: string) => void;
}

/**
 * ALTCHA's default theme (base/neutral/error colors, 6px radii) already
 * matches CareUI closely enough, so only override what actually diverges:
 * the brand primary/success color (default is blue) and the border color
 * (to exactly match `border-gray-300` used by the surrounding `Input`).
 * See https://altcha.org/docs/integration/widget-customization/ for the
 * full list of supported variables.
 */
const altchaThemeVariables: Partial<CSSVariables> = {
  "--altcha-color-primary": "#0d9f6e",
  "--altcha-color-success": "#0d9f6e",
  "--altcha-border-color": "#d1d5db",
  "--altcha-checkbox-border-color": "#d1d5db",
};

/**
 * Self-hosted, proof-of-work based captcha widget (replaces Google reCAPTCHA).
 *
 * Fetches a challenge from the backend and reports state changes to the login
 * form so only the currently verified payload is submitted. Themed to match
 * CareUI (see `altchaThemeVariables`) and configured per
 * https://altcha.org/docs/integration/widget-customization/ to run the
 * proof-of-work silently on load rather than requiring an extra click, and to
 * follow the user's selected app language.
 */
export const AltchaWidget = ({ onStateChange }: AltchaWidgetProps) => {
  const { i18n } = useTranslation();
  const widgetRef = useRef<WidgetAttributes & WidgetMethods & HTMLElement>(
    null,
  );
  const handlePayloadChange = useEffectEvent((payload?: string) => {
    onStateChange(payload);
  });

  useEffect(() => {
    const handleStateChange = (ev: Event | CustomEvent) => {
      if (!("detail" in ev)) {
        return;
      }

      handlePayloadChange(
        ev.detail?.state === State.VERIFIED ? ev.detail.payload : undefined,
      );
    };

    const { current } = widgetRef;
    if (current) {
      current.addEventListener("statechange", handleStateChange);
      return () =>
        current.removeEventListener("statechange", handleStateChange);
    }
  }, []);

  return (
    <altcha-widget
      ref={widgetRef}
      challenge={`${careConfig.apiUrl}/api/v1/auth/captcha/challenge/`}
      auto="onload"
      language={i18n.language}
      configuration={JSON.stringify({ hideLogo: true, hideFooter: true })}
      style={altchaThemeVariables}
    />
  );
};
