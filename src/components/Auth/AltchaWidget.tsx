// Importing altcha registers the <altcha-widget> custom element.
import "altcha";
import { State, type WidgetAttributes, type WidgetMethods } from "altcha/types";
import type {} from "altcha/types/react";
import { useEffect, useEffectEvent, useRef } from "react";

import careConfig from "@careConfig";

interface AltchaWidgetProps {
  onStateChange: (payload?: string) => void;
}

/**
 * Self-hosted, proof-of-work based captcha widget (replaces Google reCAPTCHA).
 *
 * Fetches a challenge from the backend and reports state changes to the login
 * form so only the currently verified payload is submitted.
 */
export const AltchaWidget = ({ onStateChange }: AltchaWidgetProps) => {
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
    />
  );
};
