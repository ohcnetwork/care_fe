import { faker } from "@faker-js/faker";
import { expect, test, type APIResponse, type Locator } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

interface ProductFixture {
  id: string;
  product_knowledge: { slug: string; name: string };
  charge_item_definition?: { slug: string };
}

interface DeliveryItem {
  id: string;
  status: string;
  supplied_item_quantity: string;
  supplied_item_pack_quantity: number;
  supplied_item_pack_size: number;
  supplied_item: { id: string };
}

async function responseData<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function scrollTableRight(table: Locator) {
  await table.scrollIntoViewIfNeeded();
  const scrollLeft = await table.evaluate((element) => {
    const container = element.parentElement;
    if (!container) throw new Error("The table must have a scroll container");
    container.scrollLeft = container.scrollWidth;
    return container.scrollLeft;
  });
  expect(scrollLeft).toBeGreaterThan(0);
}

test.describe("External delivery draft items", () => {
  test("preserves cancelled history and replaces an item only when an edit is saved", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const apiUrl = getApiUrl();
    const headers = getApiHeaders();
    const batch = `edit-${faker.string.alphanumeric(10)}`;
    const orderName = `Delivery edit ${faker.string.alphanumeric(10)}`;

    const locations = await responseData<{
      results: { id: string; name: string }[];
    }>(
      await page.request.get(
        `${apiUrl}/api/v1/facility/${facilityId}/location/?mode=kind&limit=100`,
        { headers },
      ),
    );
    const location = locations.results.find(({ name }) => name === "Pharmacy");
    expect(
      location,
      "The test facility must include its Pharmacy fixture",
    ).toBeDefined();
    const locationId = location!.id;

    const products = await responseData<{ results: ProductFixture[] }>(
      await page.request.get(
        `${apiUrl}/api/v1/facility/${facilityId}/product/?limit=100`,
        { headers },
      ),
    );
    const referenceProduct = products.results.find(
      ({ charge_item_definition }) => charge_item_definition,
    );
    expect(
      referenceProduct,
      "The test facility must include a priced product fixture",
    ).toBeDefined();

    const product = await responseData<ProductFixture>(
      await page.request.post(
        `${apiUrl}/api/v1/facility/${facilityId}/product/`,
        {
          headers,
          data: {
            status: "active",
            product_knowledge: referenceProduct!.product_knowledge.slug,
            charge_item_definition:
              referenceProduct!.charge_item_definition!.slug,
            batch: { lot_number: batch },
            expiration_date: faker.date
              .future({ years: 2 })
              .toISOString()
              .slice(0, 10),
            standard_pack_size: 5,
            purchase_price: "2.5",
            extensions: {},
          },
        },
      ),
    );
    const supplier = await responseData<{ id: string }>(
      await page.request.post(`${apiUrl}/api/v1/organization/`, {
        headers,
        data: {
          name: `Delivery supplier ${faker.string.alphanumeric(10)}`,
          org_type: "product_supplier",
        },
      }),
    );
    const order = await responseData<{ id: string }>(
      await page.request.post(
        `${apiUrl}/api/v1/facility/${facilityId}/order/delivery/`,
        {
          headers,
          data: {
            name: orderName,
            status: "draft",
            supplier: supplier.id,
            destination: locationId,
            extensions: {},
          },
        },
      ),
    );
    const orderApiUrl = `${apiUrl}/api/v1/facility/${facilityId}/order/delivery/${order.id}/`;
    const updateOrderNote = async (note: string) => {
      await responseData(
        await page.request.put(orderApiUrl, {
          headers,
          data: {
            name: orderName,
            status: "draft",
            supplier: supplier.id,
            destination: locationId,
            note,
            extensions: {},
          },
        }),
      );
    };
    const waitForOrderSummary = () =>
      page
        .waitForResponse(
          (response) =>
            response.url() === orderApiUrl &&
            response.request().method() === "GET",
          { timeout: 10000 },
        )
        .catch(() => null);
    const deliveryPayload = {
      supplied_item_type: "product",
      supplied_item_condition: "normal",
      supplied_item: product.id,
      supplied_item_pack_quantity: 2,
      supplied_item_pack_size: 5,
      supplied_item_quantity: "10",
      total_purchase_price: "25",
      order: order.id,
      extensions: {},
    };
    const original = await responseData<{ id: string }>(
      await page.request.post(`${apiUrl}/api/v1/supply_delivery/`, {
        headers,
        data: { ...deliveryPayload, status: "in_progress" },
      }),
    );
    for (const status of ["abandoned", "entered_in_error"]) {
      await responseData(
        await page.request.post(`${apiUrl}/api/v1/supply_delivery/`, {
          headers,
          data: { ...deliveryPayload, status },
        }),
      );
    }

    const deliveryUrl = `/facility/${facilityId}/locations/${locationId}/inventory/external/deliveries/outgoing/${order.id}`;
    await page.goto(deliveryUrl);
    const savedRows = page.locator("table tbody tr").filter({ hasText: batch });
    const savedTable = page.getByRole("table").filter({
      has: page.getByRole("columnheader", { name: "Item", exact: true }),
    });

    await test.step("Keep inactive items available behind the history toggle", async () => {
      await expect(page.getByText(orderName, { exact: true })).toBeVisible();
      await expect(page.locator("table tbody tr")).toHaveCount(1);
      await page
        .getByRole("button", { name: "Show cancelled items (2)" })
        .click();
      await expect(page.locator("table tbody tr")).toHaveCount(3);
      await expect(page.getByText("Abandoned", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Entered in Error", { exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Hide cancelled items" }).click();
      await expect(page.locator("table tbody tr")).toHaveCount(1);
      await scrollTableRight(savedTable);
      await expect(
        savedRows.getByRole("link", {
          name: product.product_knowledge.name,
          exact: true,
        }),
      ).toBeInViewport({ ratio: 1 });
    });

    const openEdit = async () => {
      await savedRows
        .getByRole("button", { name: "Actions", exact: true })
        .click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    };
    const editForm = page.getByRole("form", {
      name: "Pending changes",
      exact: true,
    });
    const approveButton = page.getByRole("button", {
      name: /^Mark as Approved\b/,
    });
    const selectProductKnowledge = async () => {
      await page
        .getByPlaceholder("Search Product Knowledge")
        .fill(product.product_knowledge.name);
      await page
        .getByRole("option")
        .filter({
          has: page.getByText(product.product_knowledge.name, { exact: true }),
        })
        .first()
        .click();
    };

    await test.step("Require an explicit pack quantity for a new item and preserve it when selecting a batch", async () => {
      await page.getByRole("button", { name: /^Add Item\b/ }).click();
      await selectProductKnowledge();
      await expect(editForm.getByPlaceholder("Batch #")).toHaveValue(batch);
      const packQuantity = editForm.getByRole("spinbutton", {
        name: "Pack Qty",
        exact: true,
      });
      const quantity = editForm.getByRole("spinbutton", {
        name: "Qty",
        exact: true,
      });
      await expect(packQuantity).toHaveValue("");
      await expect(quantity).toHaveValue("");

      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      expect(
        await packQuantity.evaluate(
          (input) => (input as HTMLInputElement).validity.valueMissing,
        ),
      ).toBe(true);
      await expect(editForm).toBeVisible();
      const persisted = await responseData<{ results: DeliveryItem[] }>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/?order=${order.id}&facility=${facilityId}`,
          { headers },
        ),
      );
      expect(persisted.results).toHaveLength(3);

      await packQuantity.fill("3");
      await expect(quantity).toHaveValue(/^15(?:\.0+)?$/);
      await editForm.getByPlaceholder("Batch #").click();
      await page
        .getByRole("option")
        .filter({ hasText: `#${batch}` })
        .click();
      await expect(packQuantity).toHaveValue("3");
      await expect(quantity).toHaveValue(/^15(?:\.0+)?$/);

      await packQuantity.clear();
      await expect(quantity).toHaveValue("");

      await packQuantity.fill("3");
      await expect(quantity).toHaveValue(/^15(?:\.0+)?$/);
      const totalPurchasePrice = editForm.getByRole("spinbutton", {
        name: "TPR",
        exact: true,
      });
      await totalPurchasePrice.fill("100");
      await page.route(
        `${apiUrl}/api/v1/supply_delivery/`,
        async (route) => {
          const payload = route.request().postDataJSON() as Record<
            string,
            unknown
          >;
          payload.supplied_item = faker.string.uuid();
          await route.continue({ postData: JSON.stringify(payload) });
        },
        { times: 1 },
      );
      const preparedProduct = page.waitForResponse(
        (response) =>
          response.url() ===
            `${apiUrl}/api/v1/facility/${facilityId}/product/` &&
          response.request().method() === "POST",
      );
      const failedDelivery = page.waitForResponse(
        (response) =>
          response.url() === `${apiUrl}/api/v1/supply_delivery/` &&
          response.request().method() === "POST",
      );
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      expect((await preparedProduct).ok()).toBe(true);
      expect((await failedDelivery).status()).toBe(404);
      await expect(editForm).toBeVisible();
      await expect(
        editForm.getByRole("button", { name: /^Save Changes\b/ }),
      ).toBeEnabled();
      await expect(totalPurchasePrice).toHaveValue(/^100(?:\.0+)?$/);
      const afterPreparationFailure = await responseData<{
        results: DeliveryItem[];
      }>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/?order=${order.id}&facility=${facilityId}`,
          { headers },
        ),
      );
      expect(afterPreparationFailure.results).toHaveLength(3);

      await editForm
        .getByRole("button", { name: "Discard Changes", exact: true })
        .click();
      await expect(editForm).not.toBeVisible();
    });

    await test.step("Prefill an edit and allow it to be discarded without cancelling the saved item", async () => {
      const [expiryDay, expiryMonth, expiryYear] = (
        await savedRows.getByRole("cell").nth(3).innerText()
      ).split("/");
      await openEdit();
      await expect(editForm.getByPlaceholder("Batch #")).toHaveValue(batch);
      await expect(editForm.locator('input[type="date"]')).toHaveValue(
        `${expiryYear}-${expiryMonth}-${expiryDay}`,
      );
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Size", exact: true }),
      ).toHaveValue("5");
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toHaveValue("2");
      await expect(editForm.getByRole("radiogroup")).not.toBeVisible();
      await expect(page.getByText("Editing", { exact: true })).toBeVisible();
      await expect(approveButton).toBeDisabled();

      await scrollTableRight(editForm.getByRole("table"));
      await expect(
        editForm.getByRole("combobox").filter({
          hasText: product.product_knowledge.name,
        }),
      ).toBeInViewport({ ratio: 1 });

      await savedRows
        .getByRole("button", { name: "Actions", exact: true })
        .click();
      await page
        .getByRole("menuitem", { name: "Continue editing", exact: true })
        .click();
      await expect(editForm.locator("tbody tr")).toHaveCount(1);
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toBeFocused();
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toBeInViewport({ ratio: 1 });
      await editForm
        .getByRole("button", { name: "Discard edit", exact: true })
        .click();
      await expect(editForm).not.toBeVisible();
      await expect(approveButton).toBeEnabled();
      await expect(
        savedRows.getByRole("button", { name: "Actions", exact: true }),
      ).toBeEnabled();

      const persisted = await responseData<DeliveryItem>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/${original.id}/`,
          {
            headers,
          },
        ),
      );
      expect(persisted.status).toBe("in_progress");
      expect(Number(persisted.supplied_item_quantity)).toBe(10);
    });

    await test.step("Keep the original and pending edit when the replacement fails", async () => {
      await openEdit();
      await editForm
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill("3");
      await page.route(
        `${apiUrl}/api/v1/batch_requests/`,
        async (route) => {
          const payload = route.request().postDataJSON() as {
            requests: {
              method: string;
              url: string;
              body: Record<string, unknown>;
            }[];
          };
          const replacement = payload.requests.find(
            ({ method, url }) =>
              method === "POST" &&
              new URL(url, apiUrl).pathname === "/api/v1/supply_delivery/",
          );
          expect(replacement).toBeDefined();
          replacement!.body.supplied_item = faker.string.uuid();
          await route.continue({ postData: JSON.stringify(payload) });
        },
        { times: 1 },
      );
      const response = page.waitForResponse(`${apiUrl}/api/v1/batch_requests/`);
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      const failedBatch = await response;
      expect(failedBatch.status()).toBe(400);
      const failedResults = (await failedBatch.json()) as {
        results: { status_code: number }[];
      };
      expect(
        failedResults.results.map(({ status_code }) => status_code),
      ).toEqual([200, 404]);
      await expect(editForm).toBeVisible();
      await expect(
        editForm.getByRole("button", { name: /^Save Changes\b/ }),
      ).toBeEnabled();
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toHaveValue("3");
      const persisted = await responseData<DeliveryItem>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/${original.id}/`,
          { headers },
        ),
      );
      expect(persisted.status).toBe("in_progress");
      expect(Number(persisted.supplied_item_quantity)).toBe(10);
    });

    await test.step("Retry the replacement and retain the original in history", async () => {
      const updatedNote = `Summary after replacement ${faker.string.alphanumeric(10)}`;
      await updateOrderNote(updatedNote);
      await expect(
        page.getByText(updatedNote, { exact: true }),
      ).not.toBeVisible();
      const refreshedSummary = waitForOrderSummary();
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      await expect(editForm).not.toBeVisible();
      await expect(page.getByText(updatedNote, { exact: true })).toBeVisible();
      expect((await refreshedSummary)?.ok()).toBe(true);
      await page.reload();
      await expect(page.locator("table tbody tr")).toHaveCount(1);
      await expect(
        page.getByRole("button", { name: "Show cancelled items (3)" }),
      ).toBeVisible();

      const persisted = await responseData<{ results: DeliveryItem[] }>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/?order=${order.id}&facility=${facilityId}`,
          { headers },
        ),
      );
      expect(persisted.results).toHaveLength(4);
      expect(
        persisted.results.find(({ id }) => id === original.id)?.status,
      ).toBe("abandoned");
      const active = persisted.results.filter(
        ({ status }) => status === "in_progress",
      );
      expect(active).toHaveLength(1);
      expect(active[0].id).not.toBe(original.id);
      expect(active[0].supplied_item.id).toBe(product.id);
      expect(active[0].supplied_item_pack_quantity).toBe(3);
      expect(active[0].supplied_item_pack_size).toBe(5);
      expect(Number(active[0].supplied_item_quantity)).toBe(15);

      await page
        .getByRole("button", { name: "Show cancelled items (3)" })
        .click();
      await expect(page.locator("table tbody tr")).toHaveCount(4);
      await expect(page.getByText("Abandoned", { exact: true })).toHaveCount(2);
    });

    await test.step("Refresh the visible order summary when only some new items save", async () => {
      await page.getByRole("button", { name: /^Add Item\b/ }).click();
      await selectProductKnowledge();
      await editForm
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill("3");
      await editForm
        .getByRole("button", { name: "Add Another", exact: true })
        .click();
      await selectProductKnowledge();
      await editForm
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .nth(1)
        .fill("4");
      const updatedNote = `Summary after partial save ${faker.string.alphanumeric(10)}`;
      await updateOrderNote(updatedNote);
      await expect(
        page.getByText(updatedNote, { exact: true }),
      ).not.toBeVisible();

      await page.route(
        `${apiUrl}/api/v1/supply_delivery/`,
        async (route) => {
          const payload = route.request().postDataJSON() as Record<
            string,
            unknown
          >;
          if (Number(payload.supplied_item_pack_quantity) === 4) {
            payload.supplied_item = faker.string.uuid();
          }
          await route.continue({ postData: JSON.stringify(payload) });
        },
        { times: 2 },
      );
      const waitForCreatedItem = (packQuantity: number) =>
        page.waitForResponse(
          (response) =>
            response.url() === `${apiUrl}/api/v1/supply_delivery/` &&
            response.request().method() === "POST" &&
            Number(
              response.request().postDataJSON().supplied_item_pack_quantity,
            ) === packQuantity,
        );
      const successfulItem = waitForCreatedItem(3);
      const failedItem = waitForCreatedItem(4);
      const refreshedSummary = waitForOrderSummary();
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      expect((await successfulItem).ok()).toBe(true);
      expect((await failedItem).status()).toBe(404);
      await expect(page.getByText(updatedNote, { exact: true })).toBeVisible();
      expect((await refreshedSummary)?.ok()).toBe(true);
      await expect(editForm.locator("tbody tr")).toHaveCount(1);
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toHaveValue("4");
      const persisted = await responseData<{ results: DeliveryItem[] }>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/?order=${order.id}&facility=${facilityId}`,
          { headers },
        ),
      );
      expect(persisted.results).toHaveLength(5);
      expect(
        persisted.results.filter(({ status }) => status === "in_progress"),
      ).toHaveLength(2);
      await editForm
        .getByRole("button", { name: "Discard Changes", exact: true })
        .click();
      await expect(editForm).not.toBeVisible();
    });
  });
});
