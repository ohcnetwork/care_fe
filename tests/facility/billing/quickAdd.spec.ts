import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIResponse,
  type Page,
  type Response,
} from "@playwright/test";
import { createTestPatient } from "tests/helper/patient";
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
let groupId: string;
let packageId: string;

test.beforeAll(async ({ request }) => {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const api = getApiUrl();
  const stamp = faker.string.alphanumeric(10);
  const tag = {
    resource: "charge_item_definition",
    facility: facilityId,
    category: "admin",
    status: "active",
    description: "Quick Add keyboard regression",
    priority: -1000,
  };
  const group = await read<{ id: string }>(
    await request.post(`${api}/api/v1/tag_config/`, {
      headers,
      data: { ...tag, display: `Keyboard group ${stamp}` },
    }),
  );
  groupId = group.id;
  packageName = `Keyboard package ${stamp}`;
  const pack = await read<{ id: string }>(
    await request.post(`${api}/api/v1/tag_config/`, {
      headers,
      data: { ...tag, display: packageName, parent: group.id },
    }),
  );
  packageId = pack.id;
  definitionTitle = `Keyboard charge ${stamp}`;
  const definition = await read<{ slug: string }>(
    await request.post(
      `${api}/api/v1/facility/${facilityId}/charge_item_definition/`,
      {
        headers,
        data: {
          title: definitionTitle,
          slug_value: `keyboard-${stamp.toLowerCase()}`,
          status: "active",
          category: null,
          can_edit_charge_item: true,
          discount_configuration: null,
          price_components: [{ monetary_component_type: "base", amount: "12" }],
        },
      },
    ),
  );
  await read(
    await request.post(
      `${api}/api/v1/facility/${facilityId}/charge_item_definition/${definition.slug}/set_tags/`,
      { headers, data: { tags: [{ tag: pack.id }] } },
    ),
  );
});

test.afterAll(async ({ request }) => {
  for (const id of [packageId, groupId]) {
    if (!id) continue;
    const tag = await read<Record<string, unknown>>(
      await request.get(`${getApiUrl()}/api/v1/tag_config/${id}/`, {
        headers: getApiHeaders(),
      }),
    );
    await read(
      await request.put(`${getApiUrl()}/api/v1/tag_config/${id}/`, {
        headers: getApiHeaders(),
        data: { ...tag, status: "archived" },
      }),
    );
  }
});

test.beforeEach(async ({ request }) => {
  patientId = await createTestPatient("Quick Add keyboard");
  const account = await read<{ id: string }>(
    await request.post(
      `${getApiUrl()}/api/v1/facility/${getFacilityId()}/account/`,
      {
        headers: getApiHeaders(),
        data: {
          name: `Keyboard account ${faker.string.alphanumeric(10)}`,
          patient: patientId,
          status: "active",
          billing_status: "open",
          service_period: { start: new Date().toISOString() },
        },
      },
    ),
  );
  accountId = account.id;
});

async function openQuickAdd(page: Page, entry = "charge_items") {
  await page.goto(
    `/facility/${getFacilityId()}/billing/account/${accountId}/${entry}`,
  );
  if (entry === "invoices/create") {
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Quick Add", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Quick Add", exact: true });
  const pack = sheet.getByRole("button", { name: new RegExp(packageName) });
  await expect(pack).toBeEnabled();
  await pack.focus();
  await pack.press("Enter");
  await expect(sheet.getByRole("spinbutton")).toHaveValue("1");
  return sheet;
}

for (const entry of ["charge_items", "invoices/create"]) {
  const methods =
    entry === "charge_items"
      ? ["mouse", "button Enter", "Enter", "Shift+Enter"]
      : ["Enter", "Shift+Enter"];
  for (const method of methods) {
    test(`Quick Add from ${entry} submits once using ${method}`, async ({
      page,
      request,
    }, testInfo) => {
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
    });
  }
}

test("Quick Add blocks a fractional quantity, then accepts a valid quantity", async ({
  page,
}) => {
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
});

test("Quick Add Escape discards its selection without posting", async ({
  page,
}) => {
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
});

test.describe("Quick Add network recovery", () => {
  // Keep the synthetic failure at the page's network boundary. The PWA
  // service worker can otherwise forward the request outside page.route.
  test.use({ serviceWorkers: "block" });

  test("Quick Add preserves a failed submission and prevents duplicate retries while pending", async ({
    page,
    request,
  }) => {
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
  });
});
