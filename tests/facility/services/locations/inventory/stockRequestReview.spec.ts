import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test("an internal stock request shows requested quantities without retired API failures", async ({
  page,
  request,
}) => {
  const facilityId = getFacilityId();
  const headers = getApiHeaders();
  const api = getApiUrl();
  const locationsResponse = await request.get(
    `${api}/api/v1/facility/${facilityId}/location/?mode=kind&limit=100`,
    { headers },
  );
  expect(locationsResponse.ok()).toBe(true);
  const locations = (await locationsResponse.json()) as {
    results: { id: string; name: string }[];
  };
  expect(locations.results.length).toBeGreaterThan(1);
  const origin = locations.results[0];
  const destination = locations.results[1];
  const productsResponse = await request.get(
    `${api}/api/v1/facility/${facilityId}/product/?limit=100`,
    { headers },
  );
  expect(productsResponse.ok()).toBe(true);
  const products = (await productsResponse.json()) as {
    results: { product_knowledge: { id: string; name: string } }[];
  };
  const product = products.results.find(
    (item) => item.product_knowledge.name === "Paracetamol",
  )!.product_knowledge;
  expect(product).toBeDefined();
  const created = await request.post(
    `${api}/api/v1/facility/${facilityId}/order/request/`,
    {
      headers,
      data: {
        name: `Stock review ${faker.string.alphanumeric(8)}`,
        status: "draft",
        origin: origin.id,
        destination: destination.id,
        intent: "order",
        category: "nonstock",
        priority: "routine",
        reason: "ward_stock",
      },
    },
  );
  expect(created.ok(), await created.text()).toBe(true);
  const order = (await created.json()) as { id: string; name: string };
  const added = await request.post(`${api}/api/v1/supply_request/`, {
    headers,
    data: {
      order: order.id,
      item: product.id,
      status: "active",
      quantity: "5",
    },
  });
  expect(added.ok(), await added.text()).toBe(true);
  const failedReads: number[] = [];
  page.on("response", (response) => {
    if (
      response.request().method() === "GET" &&
      response.url().includes("/api/v1/supply_delivery/") &&
      response.status() >= 400
    )
      failedReads.push(response.status());
  });
  await page.goto(
    `/facility/${facilityId}/locations/${destination.id}/inventory/internal/receive/orders/${order.id}`,
  );
  await expect(
    page.getByRole("heading", { name: order.name, exact: true }),
  ).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: product.name });
  await expect(row).toContainText("5");
  await expect(row).toContainText("Active");
  // Let the requested-items read settle before checking the background reads.
  await expect(
    page.getByRole("combobox").filter({ hasText: "Add Item" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(
    failedReads,
    "Stock requests must not request retired delivery history",
  ).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("row").filter({ hasText: product.name }),
  ).toContainText("5");
});
