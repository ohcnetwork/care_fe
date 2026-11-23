import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIResponse,
  type Page,
  type Response,
} from "@playwright/test";
import {
  archiveQuickAddPackageViaApi,
  createAccount,
  createQuickAddPackageViaApi,
  openQuickAddSheet,
  type QuickAddEntry,
  type QuickAddPackage,
} from "tests/helper/billing";
import { createTestPatient } from "tests/helper/patient";
import { expectToast } from "tests/helper/ui";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function read<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), await response.text()).toBe(true);
  return response.json() as Promise<T>;
}

let patientId: string;
let packageName: string;
let definitionTitle: string;
let accountId: string;
let quickAddPackage: QuickAddPackage | undefined;

test.beforeAll(async ({ request }) => {
  quickAddPackage = await createQuickAddPackageViaApi({
    request,
    facilityId: getFacilityId(),
  });
  packageName = quickAddPackage.packageName;
  definitionTitle = quickAddPackage.definitionTitle;
});

test.beforeEach(async () => {
  patientId = await createTestPatient("Quick Add keyboard");
  const account = await createAccount(getFacilityId(), patientId, {
    name: `Keyboard account ${faker.string.alphanumeric(10)}`,
    status: "active",
    billing_status: "open",
  });
  accountId = account.id;
});

test.afterAll(async ({ request }) => {
  if (!quickAddPackage) return;
  await archiveQuickAddPackageViaApi({ request, quickAddPackage });
});

function openQuickAdd(page: Page, entry: QuickAddEntry = "charge_items") {
  return openQuickAddSheet(page, {
    facilityId: getFacilityId(),
    accountId,
    packageName,
    entry,
  });
}

for (const entry of ["charge_items", "invoices/create"] as const) {
  const methods =
    entry === "charge_items"
      ? ["mouse", "button Enter", "Enter", "Shift+Enter"]
      : ["Enter", "Shift+Enter"];
  for (const method of methods) {
    test(
      `Quick Add from ${entry} submits once using ${method}`,
      { tag: ["@atomic", "@cap:billing.chargeitem.quick-add"] },
      async ({ page, request }, testInfo) => {
        const facilityId = getFacilityId();
        const responses: Response[] = [];
        const invoiceCreates: string[] = [];
        page.on("response", (response) => {
          if (
            response.request().method() === "POST" &&
            response.url().endsWith("/charge_item/apply_charge_item_defs/")
          )
            responses.push(response);
        });
        page.on("request", (sent) => {
          if (
            sent.method() === "POST" &&
            sent.url().endsWith(`/facility/${facilityId}/invoice/`)
          )
            invoiceCreates.push(sent.url());
        });
        const sheet = await openQuickAdd(page, entry);
        const quantity = sheet.getByRole("spinbutton");
        expect(responses).toHaveLength(0);
        await quantity.fill("2");
        const add = sheet.getByRole("button", { name: /^Add Items/ });
        await expect(add).toBeInViewport({ ratio: 1 });
        if (entry === "charge_items" && method === "Shift+Enter") {
          await sheet.screenshot({
            path: testInfo.outputPath("quick-add-keyboard-ready.png"),
          });
        }
        if (method === "mouse") await add.click();
        else if (method === "button Enter") {
          await add.focus();
          await add.press("Enter");
        } else await quantity.press(method);
        await expect.poll(() => responses.length).toBe(1);
        expect(responses[0].ok(), await responses[0].text()).toBe(true);
        await expect(sheet).toHaveCount(0);
        const saved = await read<{
          results: { title: string; quantity: string }[];
        }>(
          await request.get(
            `${getApiUrl()}/api/v1/facility/${facilityId}/charge_item/?account=${accountId}`,
            { headers: getApiHeaders() },
          ),
        );
        expect(saved.results).toHaveLength(1);
        expect(saved.results[0].title).toBe(definitionTitle);
        expect(Number(saved.results[0].quantity)).toBe(2);
        const savedRow = page
          .getByRole("row")
          .filter({ hasText: definitionTitle });
        await expect(savedRow).toBeVisible();
        if (entry === "charge_items" && method === "Shift+Enter") {
          await page.screenshot({
            path: testInfo.outputPath("quick-add-keyboard-saved.png"),
          });
        }
        expect(invoiceCreates).toHaveLength(0);
      },
    );
  }
}

test(
  "Quick Add blocks a fractional quantity, then accepts a valid quantity",
  { tag: ["@atomic", "@cap:billing.chargeitem.quick-add"] },
  async ({ page }) => {
    let posts = 0;
    page.on("request", (sent) => {
      if (
        sent.method() === "POST" &&
        sent.url().endsWith("/charge_item/apply_charge_item_defs/")
      )
        posts++;
    });
    const sheet = await openQuickAdd(page);
    const quantity = sheet.getByRole("spinbutton");
    await quantity.fill("1.5");
    await sheet.getByRole("button", { name: /^Add Items/ }).click();
    await page.waitForLoadState("networkidle");
    expect(posts).toBe(0);
    await expect(sheet).toBeVisible();
    await quantity.fill("2");
    await quantity.press("Enter");
    await expect(sheet).toHaveCount(0);
    expect(posts).toBe(1);
  },
);

test(
  "Quick Add Escape discards its selection without posting",
  { tag: ["@atomic", "@cap:billing.chargeitem.quick-add"] },
  async ({ page }) => {
    let posts = 0;
    page.on("request", (sent) => {
      if (
        sent.method() === "POST" &&
        sent.url().endsWith("/charge_item/apply_charge_item_defs/")
      )
        posts++;
    });
    const sheet = await openQuickAdd(page);
    await sheet.getByRole("spinbutton").press("Escape");
    await expect(sheet).toHaveCount(0);
    await page.getByRole("button", { name: "Quick Add", exact: true }).click();
    await expect(sheet.getByRole("spinbutton")).toHaveCount(0);
    await expect(
      sheet.getByRole("button", { name: /^Add Items/ }),
    ).toBeDisabled();
    expect(posts).toBe(0);
  },
);

test.describe("Quick Add network recovery", () => {
  // Keep the synthetic failure at the page's network boundary. The PWA
  // service worker can otherwise forward the request outside page.route.
  test.use({ serviceWorkers: "block" });

  test(
    "Quick Add preserves a failed submission and prevents duplicate retries while pending",
    { tag: ["@atomic", "@cap:billing.chargeitem.quick-add"] },
    async ({ page, request }) => {
      let attempts = 0;
      let release = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(
        "**/charge_item/apply_charge_item_defs/",
        async (route) => {
          attempts++;
          if (attempts === 1) {
            await route.fulfill({
              status: 503,
              contentType: "application/json",
              body: JSON.stringify({ detail: "Temporarily unavailable" }),
            });
          } else {
            await gate;
            await route.continue();
          }
        },
      );
      const sheet = await openQuickAdd(page);
      const quantity = sheet.getByRole("spinbutton");
      const add = sheet.getByRole("button", { name: /^Add Items/ });
      await quantity.fill("2");
      await add.click();
      await expect.poll(() => attempts).toBe(1);
      // The request reaching the route does not mean the sheet has finished
      // with it: until the error toast shows, the mutation can still be
      // pending, the button not yet relabelled "Adding", and a retry ignored.
      await expectToast(page, "Temporarily unavailable");
      await expect(add).toBeEnabled();
      await expect(quantity).toHaveValue("2");
      try {
        await quantity.press("Shift+Enter");
        await expect.poll(() => attempts).toBe(2);
        await expect(
          sheet.getByRole("button", { name: /^Adding/ }),
        ).toBeDisabled();
        await page.keyboard.press("Enter");
        await page.keyboard.press("Shift+Enter");
        expect(attempts).toBe(2);
      } finally {
        release();
      }
      await expect(sheet).toHaveCount(0);
      const saved = await read<{ results: { quantity: string }[] }>(
        await request.get(
          `${getApiUrl()}/api/v1/facility/${getFacilityId()}/charge_item/?account=${accountId}`,
          { headers: getApiHeaders() },
        ),
      );
      expect(saved.results).toHaveLength(1);
      expect(Number(saved.results[0].quantity)).toBe(2);
    },
  );
});
