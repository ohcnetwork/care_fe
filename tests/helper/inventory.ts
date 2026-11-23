import { faker } from "@faker-js/faker";
import {
  expect,
  request as playwrightRequest,
  test,
  type APIResponse,
  type Page,
  type Response as PageResponse,
} from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

/**
 * Steps and seeders for inventory and pharmacy: internal stock requests and
 * deliveries between locations, external deliveries, and dispensing.
 */

const ORDER_UPDATE_PATH = /\/order\/(request|delivery)\/[^/]+\/$/;

/**
 * Status an order is expected to move to: "pending" when approved,
 * "completed" when marked as completed. Kept independent of src so the test
 * states the expected behaviour instead of following the app's definitions.
 */
type OrderStatusUpdate = "pending" | "completed";

/**
 * Runs `action` (e.g. clicking "Mark as Approved") and waits for the request
 * or delivery order update that moves the order to `status` to succeed.
 * Without this, a navigation right after the click can abort the in-flight
 * update and leave the order in its previous status.
 */
export async function waitForOrderUpdate(
  page: Page,
  status: OrderStatusUpdate,
  action: () => Promise<unknown>,
) {
  // The response wait is created before the action runs (array order), so a
  // fast response cannot arrive before the listener exists. Awaiting both
  // together also handles the wait's rejection if the action itself fails.
  const [res] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.request().method() === "PUT" &&
        ORDER_UPDATE_PATH.test(new URL(res.url()).pathname) &&
        res.request().postDataJSON()?.status === status,
    ),
    action(),
  ]);
  if (!res.ok()) {
    // `toBeOK()` only accepts APIResponse, so surface the status and body here.
    const body = await res.text().catch(() => "(body unavailable)");
    expect(
      res.ok(),
      `Order update to "${status}" failed: ${res.status()} ${body}`,
    ).toBe(true);
  }
}

/** A facility product as the product API returns it. */
export interface ProductFixture {
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

/** The fields of a product knowledge that the delivery seeder reads. */
interface ProductKnowledgeFixture {
  slug: string;
  base_unit: unknown;
}

/** A charge item definition as the API returns it (the fields specs read). */
export interface ChargeItemDefinitionFixture {
  slug: string;
  slug_config: { slug_value: string };
  title: string;
  status: string;
  category: { slug: string };
  can_edit_charge_item: boolean;
  discount_configuration: unknown;
  derived_from_uri: string | null;
  description: string | null;
  purpose: string | null;
  version: number;
  price_components: {
    monetary_component_type: string;
    amount?: string;
    factor?: string;
    [key: string]: unknown;
  }[];
}

/** Expects an API (or page) response to be OK and returns its JSON body. */
export async function responseData<T>(
  response: APIResponse | PageResponse,
): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

/** Raises a stock request with one item from a location's To Receive page; leaves the page on the request. */
export async function createStockRequestViaUi(
  page: Page,
  {
    facilityId,
    locationId,
    name = faker.lorem.words(5),
    supplierLocation = "Pharmacy",
    priority = "Urgent",
    category = "Medication",
    productName = "Paracetamol",
    quantity = "5",
  }: {
    facilityId: string;
    /** The location that raises the request (receives the stock). */
    locationId: string;
    name?: string;
    /** The location asked to supply the stock, as listed in the form. */
    supplierLocation?: string;
    priority?: string;
    category?: string;
    productName?: string;
    quantity?: string;
  },
): Promise<{ requestOrderId: string; name: string }> {
  return await test.step(
    "inventory.stockrequest.create",
    async () => {
      await page.goto(
        `/facility/${facilityId}/locations/${locationId}/inventory/internal/receive`,
      );
      await page.getByRole("button", { name: "Raise Stock Request" }).click();
      await page.getByRole("textbox", { name: "Name" }).fill(name);
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select Location" })
        .click();
      await page.getByRole("option", { name: supplierLocation }).click();
      await page.getByRole("radio", { name: priority }).check();
      const [created] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname.endsWith(
              `/facility/${facilityId}/order/request/`,
            ),
        ),
        page.getByRole("button", { name: "Create" }).click(),
      ]);
      const { id: requestOrderId } = await responseData<{ id: string }>(
        created,
      );
      const heading = page.getByRole("heading", { name });
      await expect(heading).toBeVisible();
      await page.getByRole("combobox").filter({ hasText: "Add Item" }).click();
      await page.getByRole("option", { name: category }).click();
      await page.getByRole("option", { name: productName }).click();
      await page.getByRole("spinbutton").fill(quantity);
      await page.getByRole("button", { name: "Save List" }).click();
      const tableRow1 = page.locator("table tbody tr").nth(0);
      await expect(tableRow1).toContainText(productName);
      await expect(tableRow1).toContainText(quantity);
      return { requestOrderId, name };
    },
    { box: true },
  );
}

/** Approves the stock request open on the page ("Mark as Approved"). */
export async function approveStockRequestViaUi(page: Page): Promise<void> {
  await test.step(
    "inventory.stockrequest.approve",
    async () => {
      const approveButton = page.getByRole("button", {
        name: "Mark as Approved",
      });
      await expect(approveButton).toBeEnabled();
      await waitForOrderUpdate(page, "pending", () => approveButton.click());
    },
    { box: true },
  );
}

/** Marks the approved stock request open on the page as completed. */
export async function completeStockRequestViaUi(page: Page): Promise<void> {
  await test.step(
    "inventory.stockrequest.complete",
    async () => {
      await page
        .locator('[data-slot="dropdown-menu-trigger"]:has(.care-l-ellipsis-v)')
        .click();
      await waitForOrderUpdate(page, "completed", () =>
        page.getByRole("menuitem", { name: "Mark as Completed" }).click(),
      );
    },
    { box: true },
  );
}

/** Creates an internal stock request (origin supplies destination) with one requested item through the API. */
export async function createStockRequestViaApi({
  facilityId,
  originId,
  destinationId,
  productKnowledgeId,
  quantity = "5",
  name = `Stock review ${faker.string.alphanumeric(8)}`,
  status = "draft",
}: {
  facilityId: string;
  originId: string;
  destinationId: string;
  productKnowledgeId: string;
  quantity?: string;
  name?: string;
  /** "draft" (not yet approved) or "pending" (approved). */
  status?: "draft" | "pending";
}): Promise<{ requestOrderId: string; name: string }> {
  const request = await playwrightRequest.newContext();
  try {
    const api = getApiUrl();
    const headers = getApiHeaders();
    const created = await request.post(
      `${api}/api/v1/facility/${facilityId}/order/request/`,
      {
        headers,
        data: {
          name,
          status,
          origin: originId,
          destination: destinationId,
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
        item: productKnowledgeId,
        status: "active",
        quantity,
      },
    });
    expect(added.ok(), await added.text()).toBe(true);
    return { requestOrderId: order.id, name: order.name };
  } finally {
    await request.dispose();
  }
}

/** Loads the requested item into the open delivery form, picks the first available stock lot and saves. */
async function addRequestedStock(
  page: Page,
  { productName, quantity }: { productName: string; quantity: string },
) {
  await page.getByRole("button", { name: /^Load from order\b/ }).click();
  const requestPicker = page.getByRole("dialog", {
    name: "Select Items to Add",
    exact: true,
  });
  await requestPicker
    .getByRole("checkbox", { name: "Select All", exact: true })
    .uncheck();
  await requestPicker
    .getByRole("checkbox", { name: new RegExp(escapeRegExp(productName)) })
    .check();
  await requestPicker.getByRole("button", { name: /^Done\b/ }).click();
  await expect(requestPicker).toBeHidden();
  const form = page.getByRole("form", {
    name: "Pending changes",
    exact: true,
  });
  await expect(form.getByRole("spinbutton")).toHaveValue(
    new RegExp(`^${escapeRegExp(quantity)}(?:\\.0+)?$`),
  );
  await form
    .getByRole("button", { name: /^Select stock$/i })
    .last()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("checkbox", { disabled: false })
    .first()
    .check();
  await page.keyboard.press("Escape");
  await form.getByRole("button", { name: /^Save Changes\b/ }).click();
  await expect(form).toBeHidden();
}

/** Dispatches an approved stock request from the supplier's To Dispatch page: creates, fills and approves a delivery order. */
export async function dispatchOrderViaUi(
  page: Page,
  {
    facilityId,
    locationId,
    orderName,
    productName = "Paracetamol",
    quantity = "5",
  }: {
    facilityId: string;
    /** The location that supplies the stock. */
    locationId: string;
    /** Name of the stock request to dispatch. */
    orderName: string;
    productName?: string;
    quantity?: string;
  },
): Promise<{ deliveryOrderId: string }> {
  return await test.step(
    "inventory.order.dispatch",
    async () => {
      await page.goto(
        `/facility/${facilityId}/locations/${locationId}/inventory/internal/dispatch`,
      );
      const orderRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName });
      await expect(orderRow.first()).toBeVisible();
      await orderRow
        .first()
        .getByRole("button", { name: "See Details" })
        .click();
      const tableRow1 = page.locator("table tbody tr").nth(0);
      await expect(tableRow1).toContainText(productName);
      await expect(tableRow1).toContainText(quantity);
      await page.getByRole("link", { name: "Create Delivery Order" }).click();
      const [created] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            new URL(response.url()).pathname.endsWith(
              `/facility/${facilityId}/order/delivery/`,
            ),
        ),
        page.getByRole("button", { name: "Create" }).click(),
      ]);
      const { id: deliveryOrderId } = await responseData<{ id: string }>(
        created,
      );
      await expect(
        page.getByRole("button", { name: "Load from order" }),
      ).toBeVisible();
      await addRequestedStock(page, { productName, quantity });
      await waitForOrderUpdate(page, "pending", () =>
        page.getByRole("button", { name: "Mark as Approved" }).click(),
      );
      return { deliveryOrderId };
    },
    { box: true },
  );
}

/** Receives a dispatched delivery into stock at the requesting location and marks it completed. */
export async function receiveDeliveryViaUi(
  page: Page,
  {
    facilityId,
    locationId,
    orderName,
  }: {
    facilityId: string;
    /** The location that receives the stock. */
    locationId: string;
    /** Name of the stock request the delivery fulfils. */
    orderName: string;
  },
): Promise<void> {
  await test.step(
    "inventory.delivery.receive",
    async () => {
      await page.goto(
        `/facility/${facilityId}/locations/${locationId}/inventory/internal/receive`,
      );
      await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
      const incomingDeliveryRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName });
      await expect(incomingDeliveryRow.first()).toBeVisible();
      await incomingDeliveryRow
        .first()
        .getByRole("button", { name: "View Details" })
        .click();
      await page
        .getByRole("row", { name: "Requested Qty." })
        .getByRole("checkbox")
        .check();
      const receiveButton = page.getByRole("button", {
        name: "Receive & Update Stock",
      });
      await expect(receiveButton).toBeEnabled();
      await receiveButton.click();
      await page.getByRole("button", { name: "Confirm" }).click();
      const markAsCompletedButton = page.getByRole("button", {
        name: "Mark as Completed",
      });
      await expect(markAsCompletedButton).toBeEnabled();
      await waitForOrderUpdate(page, "completed", () =>
        markAsCompletedButton.click(),
      );
    },
    { box: true },
  );
}

interface DispenseTarget {
  facilityId: string;
  /** The pharmacy location that dispenses (its stock is used). */
  locationId: string;
  patientId: string;
  encounterId: string;
  /** A stocked medicine of the location, e.g. "Paracetamol". */
  medicationName?: string;
}

/** Opens an encounter's dispense bill in a pharmacy and adds one unit of a stocked medicine (no prescription). */
export async function addDispenseMedicationViaUi(
  page: Page,
  {
    facilityId,
    locationId,
    patientId,
    encounterId,
    medicationName = "Paracetamol",
  }: DispenseTarget,
): Promise<void> {
  await test.step(
    "inventory.medication.dispense: add medication",
    async () => {
      await page.goto(
        `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/bill/dispense/${encounterId}`,
      );
      await page
        .getByRole("combobox")
        .filter({ hasText: "Add Medication" })
        .click();
      await page
        .getByRole("option", { name: "Medications", exact: true })
        .click();
      await page
        .getByRole("option", { name: medicationName, exact: true })
        .click();
      const sheet = page.getByRole("dialog");
      await expect(sheet.getByRole("spinbutton")).toHaveValue("1");
      await sheet.getByRole("button", { name: /^Add Medication/ }).click();
      await expect(sheet).toHaveCount(0);
    },
    { box: true },
  );
}

/** Clicks "Bill Selected" on the open dispense bill (dispenses, issues the invoice) and waits for the dispense order page. */
export async function billSelectedMedicationsViaUi(
  page: Page,
): Promise<{ dispenseOrderId: string }> {
  return await test.step(
    "inventory.medication.dispense: bill selected",
    async () => {
      await page.getByRole("button", { name: /^Bill Selected/ }).click();
      await expect(page).toHaveURL(/medication_dispense\/order\//);
      const dispenseOrderId = new URL(page.url()).pathname.match(
        /\/medication_dispense\/order\/([^/]+)/,
      )![1];
      return { dispenseOrderId };
    },
    { box: true },
  );
}

/** Dispenses one unit of a stocked medicine to an encounter through "Bill Selected". */
export async function dispenseMedicationViaUi(
  page: Page,
  target: DispenseTarget,
): Promise<{ dispenseOrderId: string }> {
  return await test.step(
    "inventory.medication.dispense",
    async () => {
      // Tests that watch the billing requests call the two halves directly
      // and register their listeners in between.
      await addDispenseMedicationViaUi(page, target);
      return await billSelectedMedicationsViaUi(page);
    },
    { box: true },
  );
}

/** Seeds a Pharmacy external delivery draft: new priced product, supplier, draft order, one active and two cancelled items. */
export async function createExternalDeliveryDraftViaApi({
  facilityId,
  ...options
}: {
  facilityId: string;
  /** Adds pricing metadata and a tag to the product's charge item definition. */
  metadata?: boolean;
  /** Seeds an unpriced product with no charge item definition, batch or expiry. */
  withoutPricingMetadata?: boolean;
}) {
  const request = await playwrightRequest.newContext();
  try {
    const apiUrl = getApiUrl();
    const headers = getApiHeaders();
    const batch = `edit-${faker.string.alphanumeric(10)}`;
    const orderName = `Delivery edit ${faker.string.alphanumeric(10)}`;

    const locations = await responseData<{
      results: { id: string; name: string }[];
    }>(
      await request.get(
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
      await request.get(
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

    const referenceKnowledge = await responseData<ProductKnowledgeFixture>(
      await request.get(
        `${apiUrl}/api/v1/product_knowledge/${referenceProduct!.product_knowledge.slug}/`,
        { headers },
      ),
    );
    const productKnowledge = await responseData<ProductKnowledgeFixture>(
      await request.post(`${apiUrl}/api/v1/product_knowledge/`, {
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
    const referenceDefinition = await responseData<ChargeItemDefinitionFixture>(
      await request.get(
        `${apiUrl}/api/v1/facility/${facilityId}/charge_item_definition/${referenceProduct!.charge_item_definition!.slug}/`,
        { headers },
      ),
    );
    let chargeItemSlug: string | undefined;
    if (!options.withoutPricingMetadata) {
      const definition = await responseData<{ slug: string }>(
        await request.post(
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
        await request.post(`${apiUrl}/api/v1/tag_config/`, {
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
        await request.post(
          `${apiUrl}/api/v1/facility/${facilityId}/charge_item_definition/${chargeItemSlug}/set_tags/`,
          { headers, data: { tags: [{ tag: tag.id }] } },
        ),
      );
    }

    const product = await responseData<ProductFixture>(
      await request.post(`${apiUrl}/api/v1/facility/${facilityId}/product/`, {
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
      }),
    );
    const supplier = await responseData<{ id: string }>(
      await request.post(`${apiUrl}/api/v1/organization/`, {
        headers,
        data: {
          name: `Delivery supplier ${faker.string.alphanumeric(10)}`,
          org_type: "product_supplier",
        },
      }),
    );
    const order = await responseData<{ id: string }>(
      await request.post(
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
      await request.post(`${apiUrl}/api/v1/supply_delivery/`, {
        headers,
        data: { ...deliveryPayload, status: "in_progress" },
      }),
    );
    for (const status of ["abandoned", "entered_in_error"]) {
      await responseData(
        await request.post(`${apiUrl}/api/v1/supply_delivery/`, {
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
  } finally {
    await request.dispose();
  }
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
