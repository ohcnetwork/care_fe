import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated (admin) state
test.use({ storageState: "tests/.auth/user.json" });

const PRODUCT_NAME = "Paracetamol";

test.describe("Inventory Summary — All Deliveries drawer", () => {
  let pharmacyBasePath: string;

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();

    // Reach the seeded "Main Pharmacy" location, which the fixtures stock with
    // products (Amoxicillin, Paracetamol, Ibuprofen, Gloves) via completed
    // supply deliveries destined to it.
    await page.goto(`/facility/${facilityId}/services/`);
    await page.getByRole("link", { name: "Main Pharmacy" }).click();
    await page.getByRole("link", { name: "Pharmacy" }).click();

    const pharmacyLocationId =
      page
        .url()
        .match(
          new RegExp(
            `/facility/${facilityId}/locations/([^/]+)/medication_requests`,
          ),
        )?.[1] ?? "";
    expect(pharmacyLocationId).not.toBe("");
    pharmacyBasePath = `/facility/${facilityId}/locations/${pharmacyLocationId}`;

    await page.goto(`${pharmacyBasePath}/inventory/summary`);
    await expect(
      page.getByRole("heading", { name: "Inventory" }),
    ).toBeVisible();
  });

  test("opens the drawer and lists deliveries for a stocked product", async ({
    page,
  }) => {
    await test.step("Wait for the inventory row to render", async () => {
      await expect(
        page.getByRole("button", { name: PRODUCT_NAME }),
      ).toBeVisible();
    });

    await test.step("Open the All Deliveries drawer and assert its API call", async () => {
      const deliveriesResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/supply_delivery/") &&
          resp.request().method() === "GET" &&
          resp.url().includes("supplied_inventory_item_product_knowledge=") &&
          resp.ok(),
      );
      await page.getByRole("button", { name: PRODUCT_NAME }).click();
      await deliveriesResponse;
    });

    await test.step("Verify the deliveries table is shown in the drawer", async () => {
      const drawer = page.locator('[data-slot="drawer-content"]');
      await expect(drawer.getByText("All Deliveries")).toBeVisible();
      // The delivered product renders as a link inside the deliveries table —
      // its presence proves a delivery row was rendered (not the empty state).
      await expect(
        drawer.getByRole("link", { name: PRODUCT_NAME }),
      ).toBeVisible();
    });
  });

  test("shows the empty state in the drawer when a product has no deliveries", async ({
    page,
  }) => {
    await test.step("Wait for the inventory row to render", async () => {
      await expect(
        page.getByRole("button", { name: PRODUCT_NAME }),
      ).toBeVisible();
    });

    // The empty state is a defensive UI branch: every product surfaced on the
    // summary necessarily has at least one delivery, so it is unreachable with
    // seeded data. Stub the deliveries list as empty to exercise that branch.
    await test.step("Stub the deliveries response as empty", async () => {
      await page.route(
        (url) =>
          url.pathname === "/api/v1/supply_delivery/" &&
          url.searchParams.has("supplied_inventory_item_product_knowledge"),
        (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              count: 0,
              results: [],
              next: null,
              previous: null,
            }),
          }),
      );
    });

    await test.step("Open the drawer and verify the empty state", async () => {
      await page.getByRole("button", { name: PRODUCT_NAME }).click();
      const drawer = page.locator('[data-slot="drawer-content"]');
      await expect(drawer.getByText("All Deliveries")).toBeVisible();
      await expect(drawer.getByText("No delivery found")).toBeVisible();
    });
  });

  test("paginates the deliveries within the drawer", async ({ page }) => {
    await test.step("Wait for the inventory row to render", async () => {
      await expect(
        page.getByRole("button", { name: PRODUCT_NAME }),
      ).toBeVisible();
    });

    // Seeded pharmacy products have a single delivery, so the pagination
    // controls are otherwise hidden. Keep the real (valid) delivery rows but
    // inflate the reported count past DELIVERIES_PER_PAGE (10) so a second page
    // exists and the controls render.
    await test.step("Inflate the deliveries count to expose pagination", async () => {
      await page.route(
        (url) =>
          url.pathname === "/api/v1/supply_delivery/" &&
          url.searchParams.has("supplied_inventory_item_product_knowledge"),
        async (route) => {
          const response = await route.fetch();
          const json = await response.json();
          json.count = 15;
          await route.fulfill({ response, json });
        },
      );
    });

    await test.step("Open the drawer and confirm the first page renders", async () => {
      await page.getByRole("button", { name: PRODUCT_NAME }).click();
      const drawer = page.locator('[data-slot="drawer-content"]');
      await expect(drawer.getByText("All Deliveries")).toBeVisible();
      await expect(
        drawer.getByRole("link", { name: PRODUCT_NAME }),
      ).toBeVisible();
    });

    await test.step("Navigate to page 2 and assert the offset advances", async () => {
      const drawer = page.locator('[data-slot="drawer-content"]');
      const page2Response = page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/supply_delivery/") &&
          resp.request().method() === "GET" &&
          resp.url().includes("offset=10") &&
          resp.ok(),
      );
      await drawer.getByRole("button", { name: "2", exact: true }).click();
      await page2Response;
    });
  });
});
