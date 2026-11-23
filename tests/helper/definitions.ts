import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  createActivityDefinition,
  type ActivityDefinitionData,
} from "tests/facility/settings/activityDefinition/activityDefinition";
import {
  MIN_SLUG_LENGTH,
  STATUS_OPTIONS as SPECIMEN_STATUS_OPTIONS,
  typeCollectedOptions,
} from "tests/facility/settings/specimenDefinitions/specimenDefinitionConstants";
import { expectToast } from "tests/helper/ui";
import { expectedSlug, getApiHeaders, getApiUrl } from "tests/helper/utils";

/**
 * Step functions for the facility definition settings: activity, charge
 * item, observation and specimen definitions, product knowledge and products.
 * UI steps return what a workflow needs to chain the next step (the name the
 * pickers search by, plus the slug/id the backend assigned).
 */

interface CreatedResource {
  id: string;
  slug: string;
}

/** Waits for the POST that creates a resource, matched by its API path. */
function waitForCreateResponse(page: Page, apiPath: string) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith(apiPath),
  );
}

async function apiRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: getApiHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed: ${response.status} — ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Activity definitions
// ---------------------------------------------------------------------------

/** Creates an activity definition in the "Lab Tests" fixture category through the UI. */
export async function createActivityDefinitionViaUi(
  page: Page,
  input: {
    facilityId: string;
    /** Also link specimen/observation/charge item definitions, service, location. */
    allFields?: boolean;
    status?: string;
    classification?: string;
  },
): Promise<ActivityDefinitionData & { name: string }> {
  const overrides: Partial<
    Pick<ActivityDefinitionData, "status" | "classification">
  > = {};
  if (input.status !== undefined) overrides.status = input.status;
  if (input.classification !== undefined) {
    overrides.classification = input.classification;
  }
  return test.step(
    "definition.activity.create",
    async () => {
      const data = await createActivityDefinition(
        page,
        input.facilityId,
        input.allFields ?? false,
        overrides,
      );
      return { ...data, name: data.title };
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Charge item definitions
// ---------------------------------------------------------------------------

export interface ChargeItemDefinitionFormInput {
  title: string;
  slug: string;
  basePrice: string;
  description?: string;
  purpose?: string;
  uri?: string;
  mrp?: string;
  purchasePrice?: string;
}

/** Opens a charge item definition category from the settings list. */
export async function openChargeItemDefinitionCategory(
  page: Page,
  { facilityId, categoryName }: { facilityId: string; categoryName: string },
): Promise<void> {
  await page.goto(`/facility/${facilityId}/settings/charge_item_definitions/`);
  await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
  await page.getByRole("heading", { name: categoryName }).click();
}

/** Fills the text and price fields of the open charge item definition form, without submitting. */
export async function fillChargeItemDefinitionForm(
  page: Page,
  input: ChargeItemDefinitionFormInput,
): Promise<void> {
  await page.getByRole("textbox", { name: /title/i }).fill(input.title);
  await page.getByRole("textbox", { name: /slug/i }).fill(input.slug);
  if (input.description !== undefined) {
    await page
      .getByRole("textbox", { name: /description/i })
      .fill(input.description);
  }
  if (input.purpose !== undefined) {
    await page.getByRole("textbox", { name: /purpose/i }).fill(input.purpose);
  }
  if (input.uri !== undefined) {
    await page.getByRole("textbox", { name: /uri/i }).fill(input.uri);
  }
  await page
    .getByRole("textbox", { name: /base price/i })
    .fill(input.basePrice);
  if (input.mrp !== undefined) {
    await page.getByRole("textbox", { name: /mrp/i }).fill(input.mrp);
  }
  if (input.purchasePrice !== undefined) {
    await page
      .getByRole("textbox", { name: /purchase price/i })
      .fill(input.purchasePrice);
  }
}

/** Creates a charge item definition in a category (default "Medications") through the UI. */
export async function createChargeItemDefinitionViaUi(
  page: Page,
  input: {
    facilityId: string;
    categoryName?: string;
  } & Partial<ChargeItemDefinitionFormInput>,
): Promise<{ name: string; slug: string; id: string; basePrice: string }> {
  const title = input.title ?? faker.string.alphanumeric(10);
  const form: ChargeItemDefinitionFormInput = {
    ...input,
    title,
    slug: input.slug ?? expectedSlug(title),
    basePrice: input.basePrice ?? faker.commerce.price({ dec: 0 }),
  };
  return test.step(
    "definition.chargeitem.create",
    async () => {
      await openChargeItemDefinitionCategory(page, {
        facilityId: input.facilityId,
        categoryName: input.categoryName ?? "Medications",
      });
      await page.getByRole("button", { name: /add definition/i }).click();
      await fillChargeItemDefinitionForm(page, form);

      const created = waitForCreateResponse(
        page,
        `/api/v1/facility/${input.facilityId}/charge_item_definition/`,
      );
      await page.getByRole("button", { name: /create/i }).click();
      const { id, slug } = (await (await created).json()) as CreatedResource;
      await expect(
        page.getByText(/charge item definition.*created successfully/i),
      ).toBeVisible();
      return { name: title, slug, id, basePrice: form.basePrice };
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Observation definitions
// ---------------------------------------------------------------------------

/** Generates the basic fields of an observation definition. */
export function generateObservationDefinitionData() {
  const timestamp = Date.now();
  const title = faker.lorem.words(2);
  return {
    title,
    slug: title,
    description: `Test observation definition description ${timestamp}`,
    category: "vital-signs",
    status: "active",
    dataType: "quantity",
  };
}

/** Fills title, description, category, status, data type and LOINC code on the observation definition form. */
export async function fillObservationDefinitionBasicFields(
  page: Page,
  data: { title: string; description: string },
): Promise<void> {
  await test.step("Fill basic observation definition fields", async () => {
    // Fill title
    await page.getByRole("textbox", { name: "Title" }).fill(data.title);

    // Fill description
    await page
      .getByRole("textbox", { name: "Description" })
      .fill(data.description);

    // Select category
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Laboratory" }).first().click();

    // Select status
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Active" }).first().click();

    // Select data type
    await page.getByRole("combobox", { name: "Data Type" }).click();
    await page.getByRole("option", { name: "Integer" }).first().click();

    // Select LOINC code (search and select first available)
    await page.getByRole("combobox", { name: "LOINC Code *" }).click();
    await page
      .getByPlaceholder("Search for observation codes")
      .fill("procedure");
    await page.getByRole("option", { name: "Procedure" }).first().click();
  });
}

/** Creates an active laboratory observation definition with the basic fields through the UI. */
export async function createObservationDefinitionViaUi(
  page: Page,
  input: { facilityId: string; title?: string; description?: string },
): Promise<{ name: string; slug: string; id: string }> {
  const generated = generateObservationDefinitionData();
  const data = {
    title: input.title ?? generated.title,
    description: input.description ?? generated.description,
  };
  return test.step(
    "definition.observation.create",
    async () => {
      await page.goto(
        `/facility/${input.facilityId}/settings/observation_definitions/new`,
      );
      await fillObservationDefinitionBasicFields(page, data);

      const created = waitForCreateResponse(
        page,
        "/api/v1/observation_definition/",
      );
      await page.getByRole("button", { name: "Create" }).click();
      const { id, slug } = (await (await created).json()) as CreatedResource;
      await expect(
        page.getByText("observation definition created successfully"),
      ).toBeVisible({ timeout: 10000 });
      return { name: data.title, slug, id };
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Specimen definitions
// ---------------------------------------------------------------------------

/** Creates a specimen definition with the required fields through the UI. */
export async function createSpecimenDefinitionViaUi(
  page: Page,
  input: {
    facilityId: string;
    title?: string;
    slug?: string;
    description?: string;
    /** "Draft" or "Active". */
    status?: string;
    typeCollected?: string;
  },
): Promise<{
  name: string;
  slug: string;
  id: string;
  description: string;
  status: string;
  typeCollected: string;
}> {
  const randomHex = faker.string
    .hexadecimal({ length: MIN_SLUG_LENGTH, prefix: "" })
    .toLowerCase();
  const data = {
    title: input.title ?? faker.company.name(),
    slug:
      input.slug ??
      `${faker.science.chemicalElement().symbol.toLowerCase()}-${randomHex}`,
    description: input.description ?? faker.lorem.sentence(),
    status: input.status ?? faker.helpers.arrayElement(SPECIMEN_STATUS_OPTIONS),
    typeCollected:
      input.typeCollected ?? faker.helpers.arrayElement(typeCollectedOptions),
  };
  return test.step(
    "definition.specimen.create",
    async () => {
      await page.goto(
        `/facility/${input.facilityId}/settings/specimen_definitions`,
      );
      await page.getByRole("button", { name: "Add Definition" }).click();

      await page.getByRole("textbox", { name: "Title *" }).fill(data.title);
      await page.getByRole("textbox", { name: "Slug *" }).fill(data.slug);
      await page
        .getByRole("textbox", { name: "Description *" })
        .fill(data.description);
      await page.getByRole("combobox", { name: "Status *" }).click();
      await page.getByRole("option", { name: data.status }).click();

      await page.getByRole("combobox", { name: "Type Collected *" }).click();
      await page.getByRole("option", { name: data.typeCollected }).click();

      const created = waitForCreateResponse(
        page,
        `/api/v1/facility/${input.facilityId}/specimen_definition/`,
      );
      await page.getByRole("button", { name: /save/i }).click();
      const { id, slug } = (await (await created).json()) as CreatedResource;
      await expectToast(page, "Specimen definition created");
      return {
        name: data.title,
        slug,
        id,
        description: data.description,
        status: data.status,
        typeCollected: data.typeCollected,
      };
    },
    { box: true },
  );
}

// ---------------------------------------------------------------------------
// Product knowledge
// ---------------------------------------------------------------------------

const PRODUCT_KNOWLEDGE_BASE_UNITS = [
  "tablets",
  "milligram",
  "microgram",
  "milliliter",
  "drop",
  "international unit",
];

const PRODUCT_KNOWLEDGE_DOSAGE_FORMS = [
  "Prolonged-release intracameral implant",
  "Prolonged-release intravitreal implant",
  "Chewable and/or dispersible oral tablet",
];

/** Creates a product knowledge with the required fields in a category (default "Medications") through the UI. */
export async function createProductKnowledgeViaUi(
  page: Page,
  input: {
    facilityId: string;
    categoryName?: string;
    name?: string;
    slug?: string;
    /** A base unit option, e.g. "tablets". */
    baseUnit?: string;
    /** Searched in the dosage form picker; `null` removes the medication definition instead. */
    dosageForm?: string | null;
  },
): Promise<{ name: string; slug: string; id: string }> {
  const name =
    input.name ??
    `${faker.commerce.productName()} ${faker.string.alphanumeric(6)}`;
  const slug = input.slug ?? expectedSlug(name);
  const baseUnit =
    input.baseUnit ?? faker.helpers.arrayElement(PRODUCT_KNOWLEDGE_BASE_UNITS);
  const dosageForm =
    input.dosageForm === undefined
      ? faker.helpers.arrayElement(PRODUCT_KNOWLEDGE_DOSAGE_FORMS)
      : input.dosageForm;
  return test.step(
    "product.knowledge.create",
    async () => {
      await page.goto(
        `/facility/${input.facilityId}/settings/product_knowledge`,
      );
      await page
        .getByRole("heading", { name: input.categoryName ?? "Medications" })
        .click();
      await page.getByRole("button", { name: /add product/i }).click();

      await page.getByRole("textbox", { name: /name/i }).fill(name);
      await page.getByRole("textbox", { name: /slug/i }).fill(slug);
      await page.getByText(/Base Unit/).click();
      await page.getByRole("option", { name: baseUnit }).click();
      await page.keyboard.press("Escape");

      if (dosageForm === null) {
        await page.getByRole("button", { name: "Remove Definition" }).click();
      } else {
        await page
          .getByRole("combobox", { name: /dosage form/i })
          .scrollIntoViewIfNeeded();
        await page.getByRole("combobox", { name: /dosage form/i }).click();
        await page.getByPlaceholder("Select Dosage Form").fill(dosageForm);
        await page.getByRole("option").first().click();
      }

      const created = waitForCreateResponse(page, "/api/v1/product_knowledge/");
      await page.getByRole("button", { name: /create/i }).click();
      const { id, slug: createdSlug } = (await (
        await created
      ).json()) as CreatedResource;
      await expect(page.getByText(/created successfully/i)).toBeVisible();
      return { name, slug: createdSlug, id };
    },
    { box: true },
  );
}

/** Creates an active consumable product knowledge (no category, no medication definition) through the API. */
export async function createProductKnowledgeViaApi(input: {
  facilityId: string;
  name?: string;
}): Promise<{ id: string; slug: string; name: string }> {
  const name =
    input.name ?? `E2E product ${faker.string.alphanumeric(10).toLowerCase()}`;
  const created = await apiRequest<CreatedResource>(
    "POST",
    "/api/v1/product_knowledge/",
    {
      status: "active",
      product_type: "consumable",
      name,
      slug_value: faker.string.uuid(),
      facility: input.facilityId,
      // One of the base units the product knowledge form offers.
      base_unit: {
        code: "mg",
        display: "milligram",
        system: "http://unitsofmeasure.org",
      },
      names: [],
      storage_guidelines: [],
      definitional: null,
    },
  );
  return { id: created.id, slug: created.slug, name };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** A date three years ahead as YYYY-MM-DD, valid as a product expiry. */
function futureExpiryDate(): string {
  return `${new Date().getFullYear() + 3}-01-31`;
}

/** Creates an active product (batch + expiry, no charge item definition) through the API. */
export async function createProductViaApi(input: {
  facilityId: string;
  /** Defaults to a fresh product knowledge from {@link createProductKnowledgeViaApi}. */
  productKnowledgeSlug?: string;
  lotNumber?: string;
  expirationDate?: string;
}): Promise<{
  productId: string;
  productKnowledgeSlug: string;
  lotNumber: string;
}> {
  const productKnowledgeSlug =
    input.productKnowledgeSlug ??
    (await createProductKnowledgeViaApi({ facilityId: input.facilityId })).slug;
  const lotNumber =
    input.lotNumber ?? `LOT-${faker.string.alphanumeric(8).toUpperCase()}`;
  const product = await apiRequest<{ id: string }>(
    "POST",
    `/api/v1/facility/${input.facilityId}/product/`,
    {
      status: "active",
      product_knowledge: productKnowledgeSlug,
      charge_item_definition: null,
      batch: { lot_number: lotNumber },
      expiration_date: input.expirationDate ?? futureExpiryDate(),
      standard_pack_size: 1,
      extensions: {},
    },
  );
  return { productId: product.id, productKnowledgeSlug, lotNumber };
}

/** Creates a leaf charge item definition category through the API. */
export async function createChargeItemCategoryViaApi(input: {
  facilityId: string;
  title?: string;
}): Promise<{ slug: string; title: string }> {
  const title =
    input.title ?? `E2E charge category ${faker.string.alphanumeric(8)}`;
  const category = await apiRequest<{ slug: string }>(
    "POST",
    `/api/v1/facility/${input.facilityId}/resource_category/`,
    {
      title,
      slug_value: faker.string.uuid(),
      resource_type: "charge_item_definition",
      resource_sub_type: "all:other",
    },
  );
  return { slug: category.slug, title };
}

/** Creates a draft delivery order from a new supplier into a facility location (default "Pharmacy") through the API. */
export async function createDraftDeliveryOrderViaApi(input: {
  facilityId: string;
  locationName?: string;
}): Promise<{ orderId: string; locationId: string; supplierId: string }> {
  const locationName = input.locationName ?? "Pharmacy";
  const locations = await apiRequest<{
    results: { id: string; name: string }[];
  }>(
    "GET",
    `/api/v1/facility/${input.facilityId}/location/?mode=kind&limit=100`,
  );
  const location = locations.results.find(({ name }) => name === locationName);
  if (!location) {
    throw new Error(`The test facility has no "${locationName}" location`);
  }
  const supplier = await apiRequest<{ id: string }>(
    "POST",
    "/api/v1/organization/",
    {
      name: `E2E supplier ${faker.string.alphanumeric(10)}`,
      org_type: "product_supplier",
    },
  );
  const order = await apiRequest<{ id: string }>(
    "POST",
    `/api/v1/facility/${input.facilityId}/order/delivery/`,
    {
      name: `E2E delivery ${faker.string.alphanumeric(10)}`,
      status: "draft",
      supplier: supplier.id,
      destination: location.id,
      extensions: {},
    },
  );
  return {
    orderId: order.id,
    locationId: location.id,
    supplierId: supplier.id,
  };
}

/**
 * Creates a product through the UI: a product is created when a new batch of
 * a product knowledge is added to a draft delivery order and saved. Settings
 * has no standalone product create form.
 */
export async function createProductViaUi(
  page: Page,
  input: {
    facilityId: string;
    locationId: string;
    /** A draft delivery order into `locationId` (see {@link createDraftDeliveryOrderViaApi}). */
    deliveryOrderId: string;
    /** Searched in the product knowledge picker; must have no products yet. */
    productKnowledgeName: string;
    /** Title of a leaf charge item category for the product's new charge item definition. */
    chargeItemCategory: string;
    lotNumber?: string;
    /** YYYY-MM-DD. */
    expirationDate?: string;
    packQuantity?: number;
    itemPrice?: string;
  },
): Promise<{ productId: string; name: string; lotNumber: string }> {
  const lotNumber =
    input.lotNumber ?? `LOT-${faker.string.alphanumeric(8).toUpperCase()}`;
  return test.step(
    "product.create",
    async () => {
      await page.goto(
        `/facility/${input.facilityId}/locations/${input.locationId}/inventory/external/deliveries/outgoing/${input.deliveryOrderId}`,
      );
      const editForm = page.getByRole("form", {
        name: "Pending changes",
        exact: true,
      });

      await page.getByRole("button", { name: /^Add Item\b/ }).click();
      // The product picker of a new row opens by itself.
      await page
        .getByPlaceholder("Search Product Knowledge")
        .fill(input.productKnowledgeName);
      await page
        .getByRole("option")
        .filter({
          has: page.getByText(input.productKnowledgeName, { exact: true }),
        })
        .first()
        .click();
      await expect(
        page.getByPlaceholder("Search Product Knowledge"),
      ).toBeHidden();

      // A batch number the product knowledge has no product for creates one.
      await editForm.getByPlaceholder("Batch #").fill(lotNumber);
      await page.getByRole("option").filter({ hasText: lotNumber }).click();
      await editForm
        .locator('input[type="date"]')
        .fill(input.expirationDate ?? futureExpiryDate());

      await editForm
        .getByRole("combobox")
        .filter({ hasText: "Select a category" })
        .click();
      await page
        .getByPlaceholder("Search categories")
        .fill(input.chargeItemCategory);
      await page
        .getByRole("option")
        .filter({ hasText: input.chargeItemCategory })
        .first()
        .click();

      await editForm
        .getByRole("spinbutton", { name: "Pack Qty", exact: true })
        .fill(String(input.packQuantity ?? 5));
      await editForm
        .getByRole("spinbutton", { name: "Item Price", exact: true })
        .fill(input.itemPrice ?? "10");

      const productCreated = waitForCreateResponse(
        page,
        `/api/v1/facility/${input.facilityId}/product/`,
      );
      const deliveryCreated = waitForCreateResponse(
        page,
        "/api/v1/supply_delivery/",
      );
      await editForm.getByRole("button", { name: /^Save Changes\b/ }).click();
      const productResponse = await productCreated;
      expect(productResponse.ok(), await productResponse.text()).toBe(true);
      const deliveryResponse = await deliveryCreated;
      expect(deliveryResponse.ok(), await deliveryResponse.text()).toBe(true);
      const product = (await productResponse.json()) as { id: string };
      return {
        productId: product.id,
        name: input.productKnowledgeName,
        lotNumber,
      };
    },
    { box: true },
  );
}
