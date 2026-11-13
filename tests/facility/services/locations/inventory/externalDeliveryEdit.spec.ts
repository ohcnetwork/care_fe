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
import type { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

test.use({ storageState: "tests/.auth/user.json" });

interface ProductFixture {
  id: string;
  product_knowledge: { id: string; slug: string; name: string };
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
  supplied_item: { id: string; product_knowledge?: { slug: string } };
  supply_request?: { id: string };
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
    ({ charge_item_definition }) => charge_item_definition?.category?.slug,
  );
  expect(
    referenceProduct,
    "The test facility must include a priced product fixture",
  ).toBeDefined();

  const referenceKnowledge = await responseData<ProductKnowledgeBase>(
    await page.request.get(
      `${apiUrl}/api/v1/product_knowledge/${referenceProduct!.product_knowledge.slug}/`,
      { headers },
    ),
  );
  const productKnowledge = await responseData<ProductKnowledgeBase>(
    await page.request.post(`${apiUrl}/api/v1/product_knowledge/`, {
      headers,
      data: {
        status: "active",
        product_type: "consumable",
        name: `Delivery product ${faker.string.alphanumeric(10)}`,
        slug_value: faker.string.uuid(),
        facility: facilityId,
        base_unit: referenceKnowledge.base_unit,
        names: [],
        storage_guidelines: [],
        definitional: null,
      },
    }),
  );
  const referenceDefinition = await responseData<ChargeItemDefinitionRead>(
    await page.request.get(
      `${apiUrl}/api/v1/facility/${facilityId}/charge_item_definition/${referenceProduct!.charge_item_definition!.slug}/`,
      { headers },
    ),
  );
  let chargeItemSlug: string | undefined;
  if (!options.withoutPricingMetadata) {
    const definition = await responseData<{ slug: string }>(
      await page.request.post(
        `${apiUrl}/api/v1/facility/${facilityId}/charge_item_definition/`,
        {
          headers,
          data: {
            slug_value: faker.string.uuid(),
            category: referenceDefinition.category?.slug ?? null,
            title: `Metadata pricing ${faker.string.alphanumeric(10)}`,
            status: "active",
            can_edit_charge_item: options.metadata
              ? true
              : referenceDefinition.can_edit_charge_item,
            discount_configuration: options.metadata
              ? { max_applicable: 1, applicability_order: "total_desc" }
              : referenceDefinition.discount_configuration,
            derived_from_uri: options.metadata
              ? "urn:care:delivery-edit:source"
              : referenceDefinition.derived_from_uri,
            description: options.metadata
              ? "Retain the existing pricing description"
              : referenceDefinition.description,
            purpose: options.metadata
              ? "Retain the existing pricing purpose"
              : referenceDefinition.purpose,
            price_components: options.metadata
              ? [
                  {
                    monetary_component_type: "base",
                    amount: "10.123456",
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
                ]
              : [{ monetary_component_type: "base", amount: "10" }],
          },
        },
      ),
    );
    chargeItemSlug = definition.slug;
  }
  if (options.metadata) {
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
          product_knowledge: productKnowledge.slug,
          charge_item_definition: options.withoutPricingMetadata
            ? null
            : chargeItemSlug,
          ...(!options.withoutPricingMetadata && {
            batch: { lot_number: batch },
            expiration_date: "2031-01-31",
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
    total_purchase_price: "12.5",
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

test.describe("External delivery cancellation", () => {
  const scenarios = [
    {
      name: "refreshes pending delivery items immediately when their order is cancelled",
      receipt: "none",
      status: "abandoned",
      action: "Mark as Abandoned",
    },
    {
      name: "cancels a partially received order and reverses unconsumed stock",
      receipt: "first",
      status: "abandoned",
      action: "Mark as Abandoned",
    },
    {
      name: "cancels a completed order and reverses unconsumed stock",
      receipt: "all",
      status: "entered_in_error",
      action: "Mark as entered in error",
    },
  ] as const;

  for (const scenario of scenarios) {
    test(scenario.name, async ({ page }) => {
      const fixture = await createExternalDeliveryDraft(page);
      const orderApiUrl = `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/order/delivery/${fixture.order.id}/`;
      const secondItem = await responseData<{ id: string }>(
        await page.request.post(`${fixture.apiUrl}/api/v1/supply_delivery/`, {
          headers: fixture.headers,
          data: {
            status: "in_progress",
            supplied_item_type: "product",
            supplied_item_condition: "normal",
            supplied_item: fixture.product.id,
            supplied_item_pack_quantity: 3,
            supplied_item_pack_size: 5,
            supplied_item_quantity: "15",
            total_purchase_price: "12.5",
            order: fixture.order.id,
            extensions: {},
          },
        }),
      );
      const destinationStock = async () => {
        const inventory = await responseData<{
          results: { product: { id: string }; net_content: string }[];
        }>(
          await page.request.get(
            `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/location/${fixture.locationId}/product/?product_knowledge=${fixture.product.product_knowledge.id}&limit=100`,
            { headers: fixture.headers },
          ),
        );
        return Number(
          inventory.results.find(
            ({ product }) => product.id === fixture.product.id,
          )?.net_content ?? 0,
        );
      };
      const waitForOrderStatus = (status: string) =>
        page.waitForResponse(
          (response) =>
            response.url() === orderApiUrl &&
            response.request().method() === "PUT" &&
            response.request().postDataJSON().status === status,
        );
      expect(await destinationStock()).toBe(0);
      await page.goto(fixture.deliveryUrl);
      const table = page.getByRole("table");
      await expect(table.locator("tbody tr")).toHaveCount(2);
      const approval = waitForOrderStatus("pending");
      await page.getByRole("button", { name: /^Mark as Approved\b/ }).click();
      expect(
        (await responseData<{ status: string }>(await approval)).status,
      ).toBe("pending");

      if (scenario.receipt !== "none") {
        const receive = page.getByRole("button", {
          name: /^Receive & Update Stock\b/,
        });
        await expect(receive).toBeEnabled();
        if (scenario.receipt === "first") {
          await table.getByRole("checkbox").first().uncheck();
          await table.locator("tbody tr").first().getByRole("checkbox").check();
        }
        await receive.click();
        const receipt = page.waitForResponse(
          (response) =>
            response.url() ===
              `${fixture.apiUrl}/api/v1/supply_delivery/upsert/` &&
            response.request().method() === "POST",
        );
        await page
          .getByRole("dialog")
          .getByRole("button", { name: /^Confirm\b/ })
          .click();
        await responseData(await receipt);
        await expect(table.getByText("Completed", { exact: true })).toHaveCount(
          scenario.receipt === "first" ? 1 : 2,
        );
        expect(await destinationStock()).toBe(
          scenario.receipt === "first" ? 10 : 25,
        );

        if (scenario.receipt === "all") {
          const complete = page.getByRole("button", {
            name: /^Mark as Completed\b/,
          });
          await expect(complete).toBeEnabled();
          const completion = waitForOrderStatus("completed");
          await complete.click();
          expect(
            (await responseData<{ status: string }>(await completion)).status,
          ).toBe("completed");
          await expect(complete).not.toBeVisible();
        }
      }

      await page
        .getByRole("main")
        .getByRole("button")
        .filter({
          has: page.locator("svg.lucide-ellipsis-vertical"),
        })
        .first()
        .click();
      const cancel = page.getByRole("menuitem", {
        name: scenario.action,
        exact: true,
      });
      await expect(cancel).toBeVisible();
      await cancel.click();
      const cancellation = waitForOrderStatus(scenario.status);
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: /^Confirm\b/ })
        .click();
      expect(
        (await responseData<{ status: string }>(await cancellation)).status,
      ).toBe(scenario.status);

      await expect(table.getByText("In Progress", { exact: true })).toHaveCount(
        0,
      );
      await expect(table.getByText("Completed", { exact: true })).toHaveCount(
        0,
      );
      await expect(
        page.getByText(/There are no active delivery items/),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Show cancelled items (4)", exact: true })
        .click();
      await expect(table.locator("tbody tr")).toHaveCount(4);
      await expect(table.getByText("Abandoned", { exact: true })).toHaveCount(
        scenario.status === "abandoned" ? 3 : 1,
      );
      await expect(
        table.getByText("Entered in Error", { exact: true }),
      ).toHaveCount(scenario.status === "entered_in_error" ? 3 : 1);
      const saved = await responseData<{ results: DeliveryItem[] }>(
        await page.request.get(
          `${fixture.apiUrl}/api/v1/supply_delivery/?order=${fixture.order.id}&facility=${fixture.facilityId}`,
          { headers: fixture.headers },
        ),
      );
      for (const id of [fixture.original.id, secondItem.id]) {
        expect(
          saved.results.find((delivery) => delivery.id === id)?.status,
        ).toBe(scenario.status);
      }
      expect(await destinationStock()).toBe(0);
    });
  }
});

test.describe("External delivery draft items", () => {
  test("selects and saves multiple purchase request items together", async ({
    page,
  }) => {
    const fixture = await createExternalDeliveryDraft(page);
    const secondFixture = await createExternalDeliveryDraft(page);
    const requestPayload = {
      name: `Delivery request ${faker.string.alphanumeric(10)}`,
      status: "draft",
      supplier: fixture.supplier.id,
      destination: fixture.locationId,
      intent: "order",
      category: "nonstock",
      priority: "routine",
      reason: "ward_stock",
    };
    const requestOrder = await responseData<{ id: string }>(
      await page.request.post(
        `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/order/request/`,
        { headers: fixture.headers, data: requestPayload },
      ),
    );
    const requests: { id: string; quantity: number }[] = [];
    for (const [index, product] of [
      fixture.product,
      secondFixture.product,
      fixture.product,
    ].entries()) {
      const quantity = 15 + index * 5;
      const request = await responseData<{ id: string }>(
        await page.request.post(`${fixture.apiUrl}/api/v1/supply_request/`, {
          headers: fixture.headers,
          data: {
            status: "active",
            quantity: String(quantity),
            item: product.product_knowledge.id,
            order: requestOrder.id,
          },
        }),
      );
      requests.push({ id: request.id, quantity });
    }
    await responseData(
      await page.request.put(
        `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/order/request/${requestOrder.id}/`,
        {
          headers: fixture.headers,
          data: { ...requestPayload, status: "pending" },
        },
      ),
    );
    await page.goto(`${fixture.deliveryUrl}?supplyOrder=${requestOrder.id}`);
    const form = page.getByRole("form", {
      name: "Pending changes",
      exact: true,
    });
    const requestPicker = page.getByRole("dialog", {
      name: "Select Items to Add",
      exact: true,
    });

    await page.getByRole("button", { name: /^Load from order\b/ }).click();
    await expect(requestPicker).toBeVisible();
    await expect(requestPicker.getByRole("radio")).toHaveCount(0);
    const selectAll = requestPicker.getByRole("checkbox", {
      name: "Select All",
      exact: true,
    });
    const done = requestPicker.getByRole("button", { name: /^Done\b/ });
    await expect(selectAll).toBeChecked();
    await expect(
      requestPicker.getByRole("checkbox", { checked: true }),
    ).toHaveCount(requests.length + 1);
    await selectAll.uncheck();
    await expect(
      requestPicker.getByRole("checkbox", { checked: true }),
    ).toHaveCount(0);
    await expect(done).toBeDisabled();

    for (const [index, request] of requests.entries()) {
      await requestPicker
        .getByText(new RegExp(`^${request.quantity}(?:\\.0+)?\\s`))
        .locator("..")
        .getByRole("checkbox")
        .check();
      for (const selected of requests.slice(0, index + 1)) {
        await expect(
          requestPicker
            .getByText(new RegExp(`^${selected.quantity}(?:\\.0+)?\\s`))
            .locator("..")
            .getByRole("checkbox"),
        ).toBeChecked();
      }
      await expect(done).toBeEnabled();
    }
    await expect(selectAll).toBeChecked();
    await selectAll.uncheck();
    await expect(done).toBeDisabled();
    await selectAll.check();
    await done.click();

    await expect(requestPicker).not.toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(form).toBeVisible();
    await expect(form.locator("tbody tr")).toHaveCount(requests.length);
    await expect(form.getByRole("combobox")).toHaveCount(requests.length);
    for (const product of [fixture.product, secondFixture.product]) {
      const rows = form.locator("tbody tr").filter({
        has: page.getByRole("combobox").filter({
          hasText: product.product_knowledge.name,
        }),
      });
      await expect(rows).toHaveCount(product === fixture.product ? 2 : 1);
      for (const row of await rows.all()) {
        await row
          .getByRole("spinbutton", { name: "Pack Qty", exact: true })
          .fill("3");
      }
    }
    const saves = requests.map((request) =>
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/supply_delivery/") &&
          response.request().method() === "POST" &&
          response.request().postDataJSON()?.supply_request === request.id,
      ),
    );
    await form.getByRole("button", { name: /^Save Changes\b/ }).click();
    const responses = await Promise.all(saves);
    for (const response of responses) {
      await responseData(response);
    }
    const timings = responses
      .map((response) => response.request().timing())
      .sort((a, b) => a.startTime - b.startTime);
    for (let index = 1; index < timings.length; index++) {
      const previous = timings[index - 1];
      expect(previous.responseStart).toBeGreaterThanOrEqual(0);
      expect(timings[index].startTime).toBeGreaterThanOrEqual(
        previous.startTime + previous.responseStart,
      );
    }
    await expect(form).not.toBeVisible();

    const persisted = await responseData<{ results: DeliveryItem[] }>(
      await page.request.get(
        `${fixture.apiUrl}/api/v1/supply_delivery/?order=${fixture.order.id}&facility=${fixture.facilityId}`,
        { headers: fixture.headers },
      ),
    );
    const linked = persisted.results.filter(
      (delivery) => delivery.supply_request,
    );
    expect(linked).toHaveLength(requests.length);
    for (const request of requests) {
      const delivery = linked.find(
        (item) => item.supply_request?.id === request.id,
      );
      expect(delivery?.supplied_item_quantity).toMatch(/^15(?:\.0+)?$/);
      expect(delivery?.supplied_item_pack_quantity).toBe(3);
      expect(delivery?.supplied_item_pack_size).toBe(5);
    }
  });

  test("preserves cancelled history and replaces an item only when an edit is saved", async ({
    page,
  }, testInfo) => {
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
      await expect(editForm.getByRole("combobox")).toBeEnabled();
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
      await editForm.locator('input[type="date"]').fill("2032-01-31");
      await expect
        .soft(editForm.locator('input[type="number"]:disabled').last())
        .toHaveValue(/^2\.5(?:0+)?$/);
      await expect(
        editForm.getByRole("spinbutton", { name: "TPR", exact: true }),
      ).toHaveValue("");

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

      // TPR is the price of one pack, so it does not follow the pack quantity.
      await packQuantity.fill("2");
      await expect(quantity).toHaveValue(/^10(?:\.0+)?$/);
      await expect
        .soft(editForm.getByRole("spinbutton", { name: "TPR", exact: true }))
        .toHaveValue(/^12\.5(?:0+)?$/);
      await packQuantity.fill("3");
      await expect(quantity).toHaveValue(/^15(?:\.0+)?$/);
      await expect
        .soft(editForm.getByRole("spinbutton", { name: "TPR", exact: true }))
        .toHaveValue(/^12\.5(?:0+)?$/);
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
      const preparedResponse = await preparedProduct;
      expect(preparedResponse.ok()).toBe(true);
      const firstPrepared = (await preparedResponse.json()) as ProductFixture;
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

      await packQuantity.fill("4");
      await expect(quantity).toHaveValue(/^20(?:\.0+)?$/);
      await expect(totalPurchasePrice).toHaveValue(/^100(?:\.0+)?$/);
      // A pack quantity change keeps the per-item price, so change the pack
      // price to make the prepared product stale.
      await totalPurchasePrice.fill("120");
      await page.route(
        `${apiUrl}/api/v1/facility/${facilityId}/product/`,
        async (route) => {
          const payload = route.request().postDataJSON() as Record<
            string,
            unknown
          >;
          payload.product_knowledge = `missing-${faker.string.uuid()}`;
          await route.continue({ postData: JSON.stringify(payload) });
        },
        { times: 1 },
      );
      const failedProduct = page.waitForResponse(
        (response) =>
          response.url() ===
            `${apiUrl}/api/v1/facility/${facilityId}/product/` &&
          response.request().method() === "POST",
      );
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      const productFailure = await failedProduct;
      expect(productFailure.status()).toBe(404);
      const preparedDefinition = productFailure.request().postDataJSON()
        .charge_item_definition as string;
      expect
        .soft(preparedDefinition)
        .not.toBe(firstPrepared.charge_item_definition?.slug);
      await expect(
        editForm.getByRole("button", { name: /^Save Changes\b/ }),
      ).toBeEnabled();

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
      const retriedProduct = page.waitForResponse(
        (response) =>
          response.url() ===
            `${apiUrl}/api/v1/facility/${facilityId}/product/` &&
          response.request().method() === "POST",
      );
      const retriedDelivery = page.waitForResponse(
        (response) =>
          response.url() === `${apiUrl}/api/v1/supply_delivery/` &&
          response.request().method() === "POST",
      );
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      const retriedResponse = await retriedProduct;
      expect(retriedResponse.ok()).toBe(true);
      const secondPrepared = (await retriedResponse.json()) as ProductFixture;
      expect(secondPrepared.id).not.toBe(firstPrepared.id);
      expect(secondPrepared.charge_item_definition?.slug).toBe(
        preparedDefinition,
      );
      expect((await retriedDelivery).status()).toBe(404);
      await expect(totalPurchasePrice).toHaveValue(/^120(?:\.0+)?$/);
      const unchangedPrepared = await responseData<ProductFixture>(
        await page.request.get(
          `${apiUrl}/api/v1/facility/${facilityId}/product/${firstPrepared.id}/`,
          { headers },
        ),
      );
      expect(unchangedPrepared.charge_item_definition).toEqual(
        firstPrepared.charge_item_definition,
      );

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
      await expect(editForm.getByRole("combobox")).toBeDisabled();
      await expect(editForm.getByRole("combobox")).toContainText(
        product.product_knowledge.name,
      );
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

      const desktopViewport = page.viewportSize()!;
      await page.setViewportSize({ width: 320, height: 900 });
      for (const [name, input] of [
        [
          "pack-quantity",
          editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
        ],
        ["expiry", editForm.locator('input[type="date"]')],
      ] as const) {
        await input.evaluate((element) =>
          element.scrollIntoView({
            block: "center",
            inline: "center",
            behavior: "instant",
          }),
        );
        const bounds = await input.evaluate((element) => {
          const row = element.closest("tr")!;
          const medicine = row
            .querySelector('[role="combobox"]')!
            .closest("td")!;
          const actions = row.lastElementChild!;
          const target = element.getBoundingClientRect();
          const clip = row
            .closest("table")!
            .parentElement!.getBoundingClientRect();
          return {
            left: target.left,
            right: target.right,
            top: target.top,
            bottom: target.bottom,
            viewportHeight: window.innerHeight,
            visibleLeft: Math.max(
              0,
              clip.left,
              medicine.getBoundingClientRect().right,
            ),
            visibleRight: Math.min(
              window.innerWidth,
              clip.right,
              actions.getBoundingClientRect().left,
            ),
          };
        });
        expect
          .soft(bounds.left, `${name} must clear the sticky medicine column`)
          .toBeGreaterThanOrEqual(bounds.visibleLeft - 1);
        expect
          .soft(bounds.right, `${name} must clear the actions column`)
          .toBeLessThanOrEqual(bounds.visibleRight + 1);
        expect
          .soft(bounds.top, `${name} must be vertically visible`)
          .toBeGreaterThanOrEqual(0);
        expect
          .soft(bounds.bottom, `${name} must be vertically visible`)
          .toBeLessThanOrEqual(bounds.viewportHeight);
        await expect(editForm.getByRole("combobox")).toBeInViewport({
          ratio: 1,
        });
        await page.screenshot({
          path: testInfo.outputPath(`saved-edit-320px-${name}.png`),
        });
      }
      await page.setViewportSize(desktopViewport);

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
      await expect(editForm.getByRole("combobox")).toBeDisabled();
      await expect(editForm.getByRole("combobox")).toContainText(
        product.product_knowledge.name,
      );
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
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      await expect(editForm).not.toBeVisible();
      await expect(page.getByText(updatedNote, { exact: true })).toBeVisible();
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
      expect(active[0].supplied_item.product_knowledge?.slug).toBe(
        product.product_knowledge.slug,
      );

      await page
        .getByRole("button", { name: "Show cancelled items (3)" })
        .click();
      await expect(page.locator("table tbody tr")).toHaveCount(4);
      await expect(page.getByText("Abandoned", { exact: true })).toHaveCount(2);
    });

    await test.step("Add items one at a time and preserve a failed item for retry", async () => {
      await page.getByRole("button", { name: /^Add Item\b/ }).click();
      await selectProductKnowledge();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(editForm.locator("tbody tr")).toHaveCount(1);
      await expect(editForm.getByRole("combobox")).toHaveCount(1);
      await expect(
        editForm.getByRole("button", { name: "Add Another", exact: true }),
      ).toHaveCount(0);
      await expect(editForm.getByPlaceholder("Batch #")).toHaveValue(batch);
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Size", exact: true }),
      ).toHaveValue("5");
      await editForm
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill("3");
      const updatedNote = `Summary after item save ${faker.string.alphanumeric(10)}`;
      await updateOrderNote(updatedNote);
      await expect(
        page.getByText(updatedNote, { exact: true }),
      ).not.toBeVisible();

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
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      expect((await successfulItem).ok()).toBe(true);
      await expect(editForm).not.toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByText(updatedNote, { exact: true })).toBeVisible();

      await page.getByRole("button", { name: /^Add Item\b/ }).click();
      await selectProductKnowledge();
      await expect(editForm.getByRole("combobox")).toHaveCount(1);
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toHaveValue("");
      await editForm
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill("4");
      await savedRows
        .getByRole("button", { name: "Actions", exact: true })
        .first()
        .click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      await expect(editForm.locator("tbody tr")).toHaveCount(1);
      await expect(editForm.getByRole("combobox")).toBeEnabled();
      await expect(
        editForm.getByRole("spinbutton", { name: "Pack Qty", exact: true }),
      ).toHaveValue("4");
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
      const failedItem = waitForCreatedItem(4);
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      expect((await failedItem).status()).toBe(404);
      await expect(editForm).toBeVisible();
      await expect(editForm.getByRole("combobox")).toHaveCount(1);
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

      const retriedItem = waitForCreatedItem(4);
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      expect((await retriedItem).ok()).toBe(true);
      await expect(editForm).not.toBeVisible();
      const saved = await responseData<{ results: DeliveryItem[] }>(
        await page.request.get(
          `${apiUrl}/api/v1/supply_delivery/?order=${order.id}&facility=${facilityId}`,
          { headers },
        ),
      );
      expect(saved.results).toHaveLength(6);
      const active = saved.results.filter(
        ({ status }) => status === "in_progress",
      );
      expect(active).toHaveLength(3);
      expect(
        active.filter((item) => Number(item.supplied_item_quantity) === 20),
      ).toHaveLength(1);
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
    test(`${withoutPricingMetadata ? "persists a legacy total correction without inventing batch or pricing metadata" : "keeps the product and purchase price after a quantity-only edit for a priced product"}`, async ({
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
      if (withoutPricingMetadata) {
        await form
          .getByRole("spinbutton", { name: "TPR", exact: true })
          .fill("30");
      }
      await form
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill("3");
      await expect(
        form.getByRole("spinbutton", { name: "Qty", exact: true }),
      ).toHaveValue(/^15(?:\.0+)?$/);
      const displayedPriceInput = form
        .locator('input[type="number"]:disabled')
        .last();
      // Purchase price is TPR / pack size, so a pack quantity change keeps it.
      await expect(displayedPriceInput).toHaveValue(
        withoutPricingMetadata ? /^6(?:\.0+)?$/ : /^2\.5(?:0+)?$/,
      );
      const displayedPurchasePrice = await displayedPriceInput.inputValue();
      const displayedTotal = await form
        .getByRole("spinbutton", { name: "TPR", exact: true })
        .inputValue();
      expect(Number(displayedTotal)).toBe(withoutPricingMetadata ? 30 : 12.5);
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
        expect(active[0].supplied_item.id).toBe(fixture.product.id);
        expect(active[0].supplied_item.charge_item_definition?.slug).toBe(
          fixture.product.charge_item_definition?.slug,
        );
      }
    });
  }

  test.describe("Metadata corrections in a western timezone", () => {
    test.use({ timezoneId: "America/Los_Angeles" });

    test("preserves metadata and isolates pricing when correcting expiry and sale pricing", async ({
      page,
    }) => {
      const fixture = await createExternalDeliveryDraft(page, {
        metadata: true,
      });
      const sourceProduct = await responseData<ProductFixture>(
        await page.request.get(
          `${fixture.apiUrl}/api/v1/facility/${fixture.facilityId}/product/${fixture.product.id}/`,
          { headers: fixture.headers },
        ),
      );
      const expectedLocalExpiry = await page.evaluate((expiration) => {
        const parts = new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(new Date(expiration!));
        const part = (type: string) =>
          parts.find((entry) => entry.type === type)!.value;
        return `${part("year")}-${part("month")}-${part("day")}`;
      }, sourceProduct.expiration_date);
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
      await expect
        .soft(form.locator('input[type="date"]'))
        .toHaveValue(expectedLocalExpiry);
      const itemPrice = form.getByRole("spinbutton", {
        name: "Item Price",
        exact: true,
      });
      await expect.soft(itemPrice).toHaveValue("10.12");
      await expect.soft(itemPrice).toHaveAttribute("step", "0.01");
      await itemPrice.focus();
      await expect(itemPrice).toHaveValue("10.12");
      await form
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .focus();
      expect
        .soft(
          await itemPrice.evaluate(
            (element) => (element as HTMLInputElement).validity.stepMismatch,
          ),
        )
        .toBe(false);
      // A tax-inclusive toggle with no MRP leaves the entered base price unchanged.
      // It also lets this scenario reach pricing persistence when native step validation regresses.
      await form
        .getByRole("checkbox", { name: "Tax Inclusive", exact: true })
        .check();
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
        "tags",
      ]) {
        expect
          .soft(replacement.charge_item_definition?.[key], key)
          .toEqual(fixture.product.charge_item_definition?.[key]);
      }
      const unchangedComponents =
        fixture.product.charge_item_definition?.price_components ?? [];
      expect
        .soft(replacement.charge_item_definition?.price_components)
        .toHaveLength(unchangedComponents.length);
      expect
        .soft(replacement.charge_item_definition?.price_components)
        .toEqual(expect.arrayContaining(unchangedComponents));

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
      await expect
        .soft(form.locator('input[type="date"]'))
        .toHaveValue("2031-02-28");
      await expect(
        form.getByRole("spinbutton", { name: "Item Price", exact: true }),
      ).toHaveValue(/^12(?:\.0+)?$/);
      await form
        .getByRole("spinbutton", { name: "Item Price", exact: true })
        .fill("11.123");
      await expect(
        form.getByRole("spinbutton", { name: "Item Price", exact: true }),
      ).toHaveValue("12.00");
      await form
        .getByRole("spinbutton", { name: "Item Price", exact: true })
        .fill("11.12");
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
      expect
        .soft(pricedReplacement.expiration_date)
        .toBe(replacement.expiration_date);
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
      expect(Number(pricedBase?.amount)).toBe(11.12);
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
});
