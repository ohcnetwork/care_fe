import { type Page } from "@playwright/test";

/**
 * Patient-registration config flags that can be overridden per test file.
 *
 * Mirrors the `E2EConfigOverrides` seam in `care.config.ts`, which reads
 * `window.__CARE_E2E_CONFIG__` when the app is built with
 * `REACT_ENABLE_E2E_CONFIG_OVERRIDES=true` (use `npm run build:e2e`).
 */
export type CareE2EConfig = {
  minimalPatientRegistration?: boolean;
  minGeoOrganizationLevelsRequired?: number;
};

/**
 * Overrides CARE runtime config for the current page/context, without editing
 * `.env.local`.
 *
 * Build-time `import.meta.env.REACT_*` values are inlined and frozen into the
 * bundle, so per-file control is only possible via a runtime `window` seam.
 * `page.addInitScript` runs before any app script loads, so setting
 * `window.__CARE_E2E_CONFIG__` here lets `care.config.ts` pick up the values
 * for this spec only.
 *
 * Must be called BEFORE navigating (`page.goto`).
 *
 * @example
 * await applyCareConfig(page, { minimalPatientRegistration: true });
 * await page.goto(`/facility/${facilityId}/patient/create`);
 */
export async function applyCareConfig(page: Page, config: CareE2EConfig) {
  await page.addInitScript((cfg) => {
    // Cast inline as a plain record: this callback is serialized and executed
    // in the browser, where the `CareE2EConfig` type name does not exist.
    (
      window as unknown as { __CARE_E2E_CONFIG__?: Record<string, unknown> }
    ).__CARE_E2E_CONFIG__ = cfg;
  }, config);
}

/**
 * Reports whether the E2E config-override seam is active in the running build.
 *
 * The seam is gated behind the `REACT_ENABLE_E2E_CONFIG_OVERRIDES` build flag
 * (enabled via `npm run build:e2e`, which CI uses). When active, `care.config.ts`
 * sets `window.__CARE_E2E_CONFIG_ENABLED__` as it evaluates. Specs can use this
 * to skip themselves when run against a regular build (e.g. an ad-hoc local
 * `npm run build`), where the overrides would otherwise silently have no effect.
 *
 * Waits briefly for the flag so the check does not race the app's initial module
 * evaluation; if it never appears (seam off), resolves to `false`.
 *
 * Must be called AFTER navigating (`page.goto`), so the app has loaded.
 */
export async function isCareConfigOverrideActive(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(
      () =>
        (window as unknown as { __CARE_E2E_CONFIG_ENABLED__?: boolean })
          .__CARE_E2E_CONFIG_ENABLED__ === true,
      undefined,
      { timeout: 5000 },
    );
    return true;
  } catch {
    return false;
  }
}
