import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  atPath,
  expectHistoryIndex,
  navigateInApp,
} from "tests/helper/history";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

interface Paths {
  facility: string;
  encounter: string;
  missingId: string;
  missingSlug: string;
}

interface NotFoundCase {
  name: string;
  /** The way back on the page. */
  back: { role: "button" | "link"; name: string };
  /** A page for a record that does not exist. */
  path: (paths: Paths) => string;
  /** The page it is opened from, and where it falls back to. */
  parent: (paths: Paths) => string;
}

const CASES: NotFoundCase[] = [
  {
    name: "invoice",
    back: { role: "link", name: "Back to invoices" },
    path: (p) => `${p.facility}/billing/invoices/${p.missingId}`,
    parent: (p) => `${p.facility}/billing/invoices`,
  },
  {
    name: "account",
    back: { role: "link", name: "Back to accounts" },
    path: (p) => `${p.facility}/billing/account/${p.missingId}`,
    parent: (p) => `${p.facility}/billing/account`,
  },
  {
    name: "payment",
    back: { role: "link", name: "Back to Payments" },
    path: (p) => `${p.facility}/billing/payments/${p.missingId}`,
    parent: (p) => `${p.facility}/billing/payments`,
  },
  {
    name: "product",
    back: { role: "button", name: "Back to List" },
    path: (p) => `${p.facility}/settings/product/${p.missingId}`,
    parent: (p) => `${p.facility}/settings/product`,
  },
  {
    name: "charge item definition",
    back: { role: "button", name: "Back to List" },
    path: (p) =>
      `${p.facility}/settings/charge_item_definitions/${p.missingSlug}`,
    parent: (p) => `${p.facility}/settings/charge_item_definitions`,
  },
  {
    name: "charge item definition edit",
    back: { role: "link", name: "Return to List" },
    path: (p) =>
      `${p.facility}/settings/charge_item_definitions/${p.missingSlug}/edit`,
    parent: (p) => `${p.facility}/settings/charge_item_definitions`,
  },
  {
    name: "observation definition",
    back: { role: "button", name: "Back to List" },
    path: (p) =>
      `${p.facility}/settings/observation_definitions/${p.missingSlug}`,
    parent: (p) => `${p.facility}/settings/observation_definitions`,
  },
  {
    name: "consent",
    back: { role: "link", name: "Back" },
    path: (p) => `${p.encounter}/consents/${p.missingId}`,
    parent: (p) => `${p.encounter}/consents`,
  },
  {
    name: "questionnaire",
    back: { role: "button", name: "Back" },
    path: (p) => `/admin/questionnaires/${p.missingId}`,
    parent: () => "/admin/questionnaires",
  },
  {
    name: "workspace",
    back: { role: "link", name: "Back" },
    path: (p) => `/admin/workspaces/${p.missingId}/edit`,
    parent: () => "/admin/workspaces",
  },
  {
    name: "action configuration",
    back: { role: "button", name: "Back" },
    path: (p) => `/admin/actions/${p.missingId}`,
    parent: () => "/admin/actions",
  },
  {
    name: "immunization policy",
    back: { role: "link", name: "Back" },
    path: (p) => `/admin/immunization-policies/${p.missingId}`,
    parent: () => "/admin/immunization-policies",
  },
];

test.describe("Back from a record that does not exist", () => {
  let paths: Paths;

  test.beforeEach(() => {
    const facility = `/facility/${getFacilityId()}`;
    paths = {
      facility,
      encounter: `${facility}/patient/${getPatientId()}/encounter/${getEncounterId()}`,
      missingId: faker.string.uuid(),
      missingSlug: `missing-${faker.string.alphanumeric(10).toLowerCase()}`,
    };
  });

  for (const { name, back, path, parent } of CASES) {
    test(`${name}: back returns to the page it was opened from`, async ({
      page,
    }) => {
      await page.goto(parent(paths));
      await navigateInApp(page, path(paths));
      await expect(page).toHaveURL(path(paths));
      await expectHistoryIndex(page, 1);

      await page.getByRole(back.role, { name: back.name, exact: true }).click();
      await expect(page).toHaveURL(atPath(parent(paths)));
      await expectHistoryIndex(page, 0);
    });

    test(`${name}: opened directly, back replaces it with its parent`, async ({
      page,
    }) => {
      await page.goto(path(paths));
      await expectHistoryIndex(page, 0);

      await page.getByRole(back.role, { name: back.name, exact: true }).click();
      await expect(page).toHaveURL(atPath(parent(paths)));
      await expectHistoryIndex(page, 0);
    });
  }
});
