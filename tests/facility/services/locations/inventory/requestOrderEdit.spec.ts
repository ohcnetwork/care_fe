import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

interface Location {
  id: string;
  name: string;
}

test.describe("Internal stock request edit", () => {
  test("keeps Deliver From locked and shows the saved intent on reopen", async ({
    page,
    request,
  }) => {
    const facilityId = getFacilityId();
    const headers = getApiHeaders();
    const api = getApiUrl();
    let origin: Location;
    let destination: Location;
    let order: { id: string; name: string };

    await test.step("Create an internal stock request", async () => {
      const locationsResponse = await request.get(
        `${api}/api/v1/facility/${facilityId}/location/?mode=kind&limit=100`,
        { headers },
      );
      expect(locationsResponse.ok()).toBe(true);
      const locations = (await locationsResponse.json()) as {
        results: Location[];
      };
      expect(locations.results.length).toBeGreaterThan(1);
      [origin, destination] = locations.results;
      const created = await request.post(
        `${api}/api/v1/facility/${facilityId}/order/request/`,
        {
          headers,
          data: {
            name: `Request edit ${faker.string.alphanumeric(8)}`,
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
      order = await created.json();
    });

    const orderHeading = () =>
      page.getByRole("heading", { name: order.name, exact: true });
    const editHeading = page.getByRole("heading", { name: /^Edit Order/ });
    const intent = page.getByRole("combobox", { name: "Intent" });

    await test.step("Open the edit form from the order page", async () => {
      await page.goto(
        `/facility/${facilityId}/locations/${destination.id}/inventory/internal/receive/orders/${order.id}`,
      );
      await expect(orderHeading()).toBeVisible();
      await page.getByRole("link", { name: /^Edit/ }).click();
      await expect(editHeading).toBeVisible();
    });

    await test.step("Deliver From is shown but cannot be changed", async () => {
      const deliverFrom = page.getByRole("textbox", { name: "Deliver From" });
      await expect(deliverFrom).toHaveValue(origin.name);
      await expect(deliverFrom).not.toBeEditable();
      await expect(
        page.getByText(
          "The Deliver From location can't be changed after the order is created.",
        ),
      ).toBeVisible();
    });

    await test.step("Change the intent and save only editable fields", async () => {
      await expect(intent).toHaveText("Order");
      await intent.click();
      await page.getByRole("option", { name: "Plan", exact: true }).click();
      await expect(intent).toHaveText("Plan");

      const [response] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.request().method() === "PUT" &&
            res.url().includes(`/order/request/${order.id}/`),
        ),
        page.getByRole("button", { name: "Save" }).click(),
      ]);
      expect(response.ok(), await response.text()).toBe(true);
      const body = response.request().postDataJSON();
      expect(body.intent).toBe("plan");
      expect(body).not.toHaveProperty("origin");
      expect(body).not.toHaveProperty("destination");
      expect(body).not.toHaveProperty("supplier");
      await expect(orderHeading()).toBeVisible();
    });

    await test.step("Reopening the edit form shows the saved intent", async () => {
      await page.getByRole("link", { name: /^Edit/ }).click();
      await expect(editHeading).toBeVisible();
      await expect(intent).toHaveText("Plan");
    });
  });
});
