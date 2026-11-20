import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  openServiceLocation,
  waitForListRequest,
} from "tests/facility/services/helpers";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// A new medication return opens with `dispenseOrderIds`: the dispense orders
// that the medicines return from. The return page reads it with a typed
// search schema (`src/lib/router/search/pharmacy.ts`) and lists the
// dispensed medicines of those orders.

test("a new medication return lists the dispenses of the orders in the URL", async ({
  page,
}) => {
  const pharmacyPath = await openServiceLocation(
    page,
    getFacilityId(),
    "Main Pharmacy",
    "Pharmacy",
  );

  await test.step("Select a completed dispense order of a patient", async () => {
    await page.goto(
      `${pharmacyPath}/medication_dispense?exclude_status=history`,
    );
    const completedOrder = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .filter({ hasText: "Completed" })
      .first();
    await expect(completedOrder).toBeVisible();
    await completedOrder.getByRole("cell").first().click();
    await expect(page).toHaveURL(/[?&]patientId=/);
    await expect(page).toHaveURL(/[?&]exclude_status=history(&|$)/);

    await page
      .getByRole("checkbox", { name: "Select dispense", exact: true })
      .first()
      .check();
  });

  await test.step("Create the return", async () => {
    await page.getByRole("button", { name: /^Return Medicines/ }).click();
    const sheet = page.getByRole("dialog", {
      name: "Create Medication Return",
    });
    await sheet
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(`Return ${faker.string.alphanumeric(8)}`);

    const dispenses = waitForListRequest(
      page,
      "/medication/dispense/",
      (params) => params.has("order"),
    );
    await sheet.getByRole("button", { name: "Create Return" }).click();

    await expect(page).toHaveURL(
      /\/medication_return\/order\/[^/?]+\?dispenseOrderIds=[0-9a-f-]+$/,
    );
    const orderId = new URL(page.url()).searchParams.get("dispenseOrderIds");
    expect(new URL((await dispenses).url()).searchParams.get("order")).toBe(
      orderId,
    );
  });
});
