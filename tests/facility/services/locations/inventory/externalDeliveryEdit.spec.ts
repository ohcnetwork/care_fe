import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIResponse,
  type Locator,
  type Page,
} from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

import type { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";

test.use({ storageState: "tests/.auth/user.json" });

interface ProductFixture {
  id: string;
  product_knowledge: { slug: string; name: string };
  charge_item_definition?: {
    slug: string;
    category?: { slug: string };
    price_components?: Record<string, unknown>[];
    [key: string]: unknown;
  } | null;
  purchase_price?: string | null;
  batch?: { lot_number?: string } | null;
  expiration_date?: string | null;
  extensions?: Record<string, unknown>;
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

async function createExternalDeliveryDraft(
  page: Page,
  options: { metadata?: boolean; withoutPricingMetadata?: boolean } = {},
) {
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

  let chargeItemSlug = referenceProduct!.charge_item_definition!.slug;
  if (options.metadata) {
    const definition = await responseData<{ slug: string }>(
      await page.request.post(
        `${apiUrl}/api/v1/facility/${facilityId}/charge_item_definition/`,
        {
          headers,
          data: {
            slug_value: faker.string.uuid(),
            category: referenceProduct!.charge_item_definition!.category!.slug,
            title: `Metadata pricing ${faker.string.alphanumeric(10)}`,
            status: "active",
            can_edit_charge_item: true,
            discount_configuration: {
              max_applicable: 1,
              applicability_order: "total_desc",
            },
            derived_from_uri: "urn:care:delivery-edit:source",
            description: "Retain the existing pricing description",
            purpose: "Retain the existing pricing purpose",
            price_components: [
              {
                monetary_component_type: "base",
                amount: "10",
                code: {
                  system: "urn:care:delivery-edit",
                  code: "base-reference",
                  display: "Base reference",
                },
              },
              {
                monetary_component_type: "surcharge",
                amount: "2.5",
                code: {
                  system: "urn:care:delivery-edit",
                  code: "handling-fee",
                  display: "Handling fee",
                },
              },
              {
                monetary_component_type: "tax",
                factor: "18",
                code: {
                  system: "urn:care:delivery-edit",
                  code: "tax-reference",
                  display: "Tax reference",
                },
              },
              {
                monetary_component_type: "discount",
                factor: "5",
                code: {
                  system: "urn:care:delivery-edit",
                  code: "discount-reference",
                  display: "Discount reference",
                },
              },
            ],
          },
        },
      ),
    );
    chargeItemSlug = definition.slug;
    const tag = await responseData<{ id: string }>(
      await page.request.post(`${apiUrl}/api/v1/tag_config/`, {
        headers,
        data: {
          display: `Metadata tag ${faker.string.alphanumeric(10)}`,
          description: "Preserve the source pricing tag when cloning",
          category: "admin",
          status: "active",
          resource: "charge_item_definition",
          facility: facilityId,
        },
      }),
    );
    await responseData(
      await page.request.post(
        `${apiUrl}/api/v1/facility/${facilityId}/charge_item_definition/${chargeItemSlug}/set_tags/`,
        { headers, data: { tags: [tag.id] } },
      ),
    );
  }

  const product = await responseData<ProductFixture>(
    await page.request.post(
      `${apiUrl}/api/v1/facility/${facilityId}/product/`,
      {
        headers,
        data: {
          status: "active",
          product_knowledge: referenceProduct!.product_knowledge.slug,
          charge_item_definition: options.withoutPricingMetadata
            ? null
            : chargeItemSlug,
          ...(!options.withoutPricingMetadata && {
            batch: { lot_number: batch },
            expiration_date: faker.date
              .future({ years: 2 })
              .toISOString()
              .slice(0, 10),
          }),
          standard_pack_size: 5,
          purchase_price: options.withoutPricingMetadata ? null : "2.5",
          extensions: options.metadata
            ? { core: { audit_marker: "preserve-product-metadata" } }
            : {},
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
  return {
    facilityId,
    apiUrl,
    headers,
    batch,
    orderName,
    locationId,
    product,
    supplier,
    order,
    original,
    deliveryUrl,
  };
}

test.describe("External delivery draft items", () => {
  test("preserves cancelled history and replaces an item only when an edit is saved", async ({
    page,
  }) => {
    const {
      facilityId,
      apiUrl,
      headers,
      batch,
      orderName,
      locationId,
      product,
      supplier,
      order,
      original,
      deliveryUrl,
    } = await createExternalDeliveryDraft(page);
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
      await expect(editForm.getByPlaceholder("Batch #")).toHaveValue(batch);
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Size", exact: true }),
      ).toHaveValue("5");
      await editForm
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill("3");
      await editForm
        .getByRole("button", { name: "Add Another", exact: true })
        .click();
      await selectProductKnowledge();
      await expect(editForm.getByPlaceholder("Batch #").nth(1)).toHaveValue(
        batch,
      );
      await expect(
        editForm
          .getByRole("spinbutton", { name: "Pack Size", exact: true })
          .nth(1),
      ).toHaveValue("5");
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

    await test.step("Save an expiry-only edit when the original item has no purchase prices", async () => {
      const unpricedBatch = `no-price-${faker.string.alphanumeric(10)}`;
      const unpricedProduct = await responseData<
        ProductFixture & { purchase_price: string | null }
      >(
        await page.request.post(
          `${apiUrl}/api/v1/facility/${facilityId}/product/`,
          {
            headers,
            data: {
              status: "active",
              product_knowledge: product.product_knowledge.slug,
              charge_item_definition: product.charge_item_definition!.slug,
              batch: { lot_number: unpricedBatch },
              expiration_date: "2030-12-31",
              standard_pack_size: 5,
              extensions: {},
            },
          },
        ),
      );
      expect(unpricedProduct.purchase_price).toBeNull();
      const unpricedDelivery = await responseData<{ id: string }>(
        await page.request.post(`${apiUrl}/api/v1/supply_delivery/`, {
          headers,
          data: {
            status: "in_progress",
            supplied_item_type: "product",
            supplied_item_condition: "normal",
            supplied_item: unpricedProduct.id,
            supplied_item_pack_quantity: 2,
            supplied_item_pack_size: 5,
            supplied_item_quantity: "10",
            order: order.id,
            extensions: {},
          },
        }),
      );
      const originalUnpriced = await responseData<
        DeliveryItem & {
          total_purchase_price: number | null;
          supplied_item: { id: string; purchase_price: string | null };
        }
      >(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/${unpricedDelivery.id}/`,
          { headers },
        ),
      );
      expect(originalUnpriced.supplied_item.purchase_price).toBeNull();
      expect(originalUnpriced.total_purchase_price).toBeNull();
      await page.reload();
      const unpricedRow = page.locator("table tbody tr").filter({
        hasText: unpricedBatch,
      });
      await unpricedRow
        .getByRole("button", { name: "Actions", exact: true })
        .click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toHaveValue("2");
      await editForm.locator('input[type="date"]').fill("2031-01-31");
      const beforeSave = await responseData<DeliveryItem>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/${unpricedDelivery.id}/`,
          { headers },
        ),
      );
      expect(beforeSave.status).toBe("in_progress");
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      await expect(editForm).not.toBeVisible();
      await page.reload();
      await expect(unpricedRow).toHaveCount(1);
      await expect(unpricedRow).toContainText("31/01/2031");
      const replacedOriginal = await responseData<DeliveryItem>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/${unpricedDelivery.id}/`,
          { headers },
        ),
      );
      expect(replacedOriginal.status).toBe("abandoned");
    });
  });
  test("clears and refills a saved item's pack quantity without losing the edit", async ({
    page,
  }) => {
    const fixture = await createExternalDeliveryDraft(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(fixture.deliveryUrl);
    const row = page
      .locator("table tbody tr")
      .filter({ hasText: fixture.batch });
    await row.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    const form = page.getByRole("form", {
      name: "Pending changes",
      exact: true,
    });
    const packQuantity = form.getByRole("spinbutton", {
      name: "Pack Qty",
      exact: true,
    });
    const expiry = await form.locator('input[type="date"]').inputValue();
    await packQuantity.press("ControlOrMeta+A");
    await packQuantity.press("Backspace");
    await expect(packQuantity).toHaveValue("");
    await expect(
      form.getByRole("spinbutton", { name: "Qty", exact: true }),
    ).toHaveValue("");
    await expect(form.getByRole("combobox")).toContainText(
      fixture.product.product_knowledge.name,
    );
    await expect(form.getByPlaceholder("Batch #")).toHaveValue(fixture.batch);
    await expect(form.locator('input[type="date"]')).toHaveValue(expiry);
    await expect(
      form.getByRole("spinbutton", { name: "Pack Size", exact: true }),
    ).toHaveValue("5");
    expect(errors).toEqual([]);
    await form.getByRole("button", { name: /^Save Changes\b/ }).click();
    await expect(packQuantity).toHaveValue("");
    await expect(form).toBeVisible();
    expect(errors).toEqual([]);
    await packQuantity.fill("3");
    await expect(
      form.getByRole("spinbutton", { name: "Qty", exact: true }),
    ).toHaveValue(/^15(?:\.0+)?$/);
    await form.getByRole("button", { name: /^Save Changes\b/ }).click();
    await expect(form).not.toBeVisible();
    const saved = await responseData<{ results: DeliveryItem[] }>(
      await page.request.get(
        `${fixture.apiUrl}/api/v1/supply_delivery/?order=${fixture.order.id}&facility=${fixture.facilityId}`,
        { headers: fixture.headers },
      ),
    );
    const active = saved.results.filter(
      ({ status }) => status === "in_progress",
    );
    expect(active).toHaveLength(1);
    expect(Number(active[0].supplied_item_quantity)).toBe(15);
    expect(errors).toEqual([]);
  });

  for (const withoutPricingMetadata of [false, true]) {
    test(`persists the purchase prices displayed after a quantity-only edit for ${withoutPricingMetadata ? "a product without pricing or batch metadata" : "a priced product"}`, async ({
      page,
    }) => {
      const fixture = await createExternalDeliveryDraft(page, {
        withoutPricingMetadata,
      });
      if (withoutPricingMetadata) {
        expect(fixture.product.purchase_price).toBeNull();
        expect(fixture.product.charge_item_definition).toBeNull();
        expect(fixture.product.batch).toEqual({});
        expect(fixture.product.expiration_date).toBeNull();
      }
      await page.goto(fixture.deliveryUrl);
      const row = page.locator("table tbody tr").filter({
        hasText: withoutPricingMetadata
          ? fixture.product.product_knowledge.name
          : fixture.batch,
      });
      await row.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      const form = page.getByRole("form", {
        name: "Pending changes",
        exact: true,
      });
      await form
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill("3");
      await expect(
        form.getByRole("spinbutton", { name: "Qty", exact: true }),
      ).toHaveValue(/^15(?:\.0+)?$/);
      const displayedPriceInput = form
        .locator('input[type="number"]:disabled')
        .last();
      await expect(displayedPriceInput).not.toHaveValue(/^2\.5(?:0+)?$/);
      const displayedPurchasePrice = await displayedPriceInput.inputValue();
      const displayedTotal = await form
        .getByRole("spinbutton", { name: "TPR", exact: true })
        .inputValue();
      expect(Number(displayedPurchasePrice)).toBeGreaterThan(0);
      expect(Number(displayedTotal)).toBe(25);
      await form.getByRole("button", { name: /^Save Changes\b/ }).click();
      await expect(form).not.toBeVisible();
      const saved = await responseData<{
        results: (DeliveryItem & {
          total_purchase_price: number;
          supplied_item: ProductFixture;
        })[];
      }>(
        await page.request.get(
          `${fixture.apiUrl}/api/v1/supply_delivery/?order=${fixture.order.id}&facility=${fixture.facilityId}`,
          { headers: fixture.headers },
        ),
      );
      const active = saved.results.filter(
        ({ status }) => status === "in_progress",
      );
      expect(active).toHaveLength(1);
      expect(Number(active[0].supplied_item.purchase_price)).toBe(
        Number(displayedPurchasePrice),
      );
      expect(Number(active[0].total_purchase_price)).toBe(
        Number(displayedTotal),
      );
      if (withoutPricingMetadata) {
        expect(active[0].supplied_item.charge_item_definition).toBeNull();
        expect(active[0].supplied_item.batch).toEqual({});
        expect(active[0].supplied_item.expiration_date).toBeNull();
      } else {
        expect(
          active[0].supplied_item.charge_item_definition?.slug,
        ).toBeTruthy();
        expect(active[0].supplied_item.charge_item_definition?.slug).not.toBe(
          fixture.product.charge_item_definition?.slug,
        );
        expect(
          active[0].supplied_item.charge_item_definition?.price_components,
        ).toEqual(fixture.product.charge_item_definition?.price_components);
      }
    });
  }

  test("preserves metadata and isolates pricing when correcting expiry and sale pricing", async ({
    page,
  }) => {
    const fixture = await createExternalDeliveryDraft(page, { metadata: true });
    await page.goto(fixture.deliveryUrl);
    const row = page
      .locator("table tbody tr")
      .filter({ hasText: fixture.batch });
    await row.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    const form = page.getByRole("form", {
      name: "Pending changes",
      exact: true,
    });
    await form.locator('input[type="date"]').fill("2031-02-28");
    await form.getByRole("button", { name: /^Save Changes\b/ }).click();
    await expect(form).not.toBeVisible();
    const saved = await responseData<{ results: DeliveryItem[] }>(
      await page.request.get(
        `${fixture.apiUrl}/api/v1/supply_delivery/?order=${fixture.order.id}&facility=${fixture.facilityId}`,
        { headers: fixture.headers },
      ),
    );
    const active = saved.results.filter(
      ({ status }) => status === "in_progress",
    );
    expect(active).toHaveLength(1);
    const replacement = await responseData<ProductFixture>(
      await page.request.get(
        `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/product/${active[0].supplied_item.id}/`,
        { headers: fixture.headers },
      ),
    );
    expect(replacement.extensions).toEqual(fixture.product.extensions);
    expect(replacement.charge_item_definition?.slug).toBeTruthy();
    expect(replacement.charge_item_definition?.slug).not.toBe(
      fixture.product.charge_item_definition?.slug,
    );
    for (const key of [
      "can_edit_charge_item",
      "discount_configuration",
      "derived_from_uri",
      "description",
      "purpose",
      "price_components",
      "tags",
    ]) {
      expect(replacement.charge_item_definition?.[key], key).toEqual(
        fixture.product.charge_item_definition?.[key],
      );
    }

    const definitionsUrl = `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/charge_item_definition`;
    const clonedDefinition = await responseData<ChargeItemDefinitionRead>(
      await page.request.get(
        `${definitionsUrl}/${replacement.charge_item_definition!.slug}/`,
        { headers: fixture.headers },
      ),
    );
    const changedClone = await responseData<ChargeItemDefinitionRead>(
      await page.request.put(`${definitionsUrl}/${clonedDefinition.slug}/`, {
        headers: fixture.headers,
        data: {
          slug_value: clonedDefinition.slug_config.slug_value,
          category: clonedDefinition.category.slug,
          title: clonedDefinition.title,
          status: clonedDefinition.status,
          can_edit_charge_item: clonedDefinition.can_edit_charge_item,
          discount_configuration: clonedDefinition.discount_configuration,
          derived_from_uri: clonedDefinition.derived_from_uri,
          description: clonedDefinition.description,
          purpose: clonedDefinition.purpose,
          version: clonedDefinition.version,
          price_components: clonedDefinition.price_components.map(
            (component) =>
              component.monetary_component_type === "base"
                ? { ...component, amount: "12" }
                : component,
          ),
        },
      }),
    );
    expect(
      Number(
        changedClone.price_components.find(
          ({ monetary_component_type }) => monetary_component_type === "base",
        )?.amount,
      ),
    ).toBe(12);
    const unchangedOriginal = await responseData<ChargeItemDefinitionRead>(
      await page.request.get(
        `${definitionsUrl}/${fixture.product.charge_item_definition!.slug}/`,
        { headers: fixture.headers },
      ),
    );
    expect(unchangedOriginal.price_components).toEqual(
      fixture.product.charge_item_definition?.price_components,
    );

    await page.reload();

    await row.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await expect(
      form.getByRole("spinbutton", { name: "Item Price", exact: true }),
    ).toHaveValue(/^12(?:\.0+)?$/);
    await form
      .getByRole("spinbutton", { name: "Item Price", exact: true })
      .fill("11");
    await form.getByRole("button", { name: /^Save Changes\b/ }).click();
    await expect(form).not.toBeVisible();
    const pricedLines = await responseData<{ results: DeliveryItem[] }>(
      await page.request.get(
        `${fixture.apiUrl}/api/v1/supply_delivery/?order=${fixture.order.id}&facility=${fixture.facilityId}`,
        { headers: fixture.headers },
      ),
    );
    const pricedActive = pricedLines.results.filter(
      ({ status }) => status === "in_progress",
    );
    expect(pricedActive).toHaveLength(1);
    const pricedReplacement = await responseData<ProductFixture>(
      await page.request.get(
        `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/product/${pricedActive[0].supplied_item.id}/`,
        { headers: fixture.headers },
      ),
    );
    expect(pricedReplacement.extensions).toEqual(fixture.product.extensions);
    expect(pricedReplacement.charge_item_definition?.slug).not.toBe(
      replacement.charge_item_definition?.slug,
    );
    expect(pricedReplacement.charge_item_definition?.slug).not.toBe(
      fixture.product.charge_item_definition?.slug,
    );
    for (const key of [
      "can_edit_charge_item",
      "discount_configuration",
      "derived_from_uri",
      "description",
      "purpose",
      "tags",
    ]) {
      expect(pricedReplacement.charge_item_definition?.[key], key).toEqual(
        fixture.product.charge_item_definition?.[key],
      );
    }
    const sourceComponents =
      fixture.product.charge_item_definition?.price_components ?? [];
    const pricedComponents =
      pricedReplacement.charge_item_definition?.price_components ?? [];
    const sourceBase = sourceComponents.find(
      ({ monetary_component_type }) => monetary_component_type === "base",
    );
    const pricedBase = pricedComponents.find(
      ({ monetary_component_type }) => monetary_component_type === "base",
    );
    expect(Number(pricedBase?.amount)).toBe(11);
    expect(pricedBase?.code).toEqual(sourceBase?.code);
    expect(
      pricedComponents.filter(
        ({ monetary_component_type }) => monetary_component_type !== "base",
      ),
    ).toEqual(
      sourceComponents.filter(
        ({ monetary_component_type }) => monetary_component_type !== "base",
      ),
    );
  });
});
