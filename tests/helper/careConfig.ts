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
    (
      window as unknown as { __CARE_E2E_CONFIG__?: CareE2EConfig }
    ).__CARE_E2E_CONFIG__ = cfg;
  }, config);
}
