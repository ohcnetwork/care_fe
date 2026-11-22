import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// The patient search, registration, home and clinical history pages read
// their query string with typed search schemas
// (`src/lib/router/search/patient.ts`).

test.describe("Patient pages search params", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
  });

  const newPhoneNumber = () =>
    `+91${faker.helpers.arrayElement([7, 8, 9])}${faker.string.numeric(9)}`;

  test("searches the phone number in the URL", async ({ page }) => {
    const phoneNumber = newPhoneNumber();
    const request = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        new URL(request.url()).pathname === "/api/v1/patient/search/" &&
        request.postDataJSON()?.value === phoneNumber,
    );

    await page.goto(
      `/facility/${facilityId}/patients?${new URLSearchParams({ phone_number: phoneNumber })}`,
    );

    await request;
  });

  test("starts the registration form with the phone number in the URL", async ({
    page,
  }) => {
    const phoneNumber = newPhoneNumber();
    // The input formats the number, so allow spaces between its digits.
    const digits = phoneNumber.slice(3).split("").join("\\s*");

    await page.goto(
      `/facility/${facilityId}/patient/create?${new URLSearchParams({ phone_number: phoneNumber })}`,
    );

    await expect(
      page.getByRole("textbox", { name: /phone number.*\*/i }).first(),
    ).toHaveValue(new RegExp(digits));
  });

  test("opens the patient home from the patient page", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}`);

    const verify = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/v1/patient/search_retrieve/",
    );
    await page.getByRole("link", { name: "Patient Home", exact: true }).click();

    await expect(page).toHaveURL(/\/patients\/home\?/);
    const params = new URL(page.url()).searchParams;
    expect(params.get("partial_id")).toBe(patientId.slice(0, 5));
    expect(params.get("year_of_birth")).toMatch(/^\d{4}$/);
    expect(params.get("phone_number")).toBeTruthy();
    expect((await verify).status()).toBe(200);
    await expect(
      page.getByText("Missing required parameters for patient verification"),
    ).toBeHidden();
  });

  test("asks for the missing patient verification params", async ({ page }) => {
    // No year of birth: the page cannot verify the patient.
    const search = new URLSearchParams({
      phone_number: newPhoneNumber(),
      partial_id: patientId.slice(0, 5),
    });
    await page.goto(`/facility/${facilityId}/patients/home?${search}`);

    await expect(
      page.getByText("Missing required parameters for patient verification"),
    ).toBeVisible();
  });

  test("lists the first page of encounters for a page below 1", async ({
    page,
  }) => {
    const request = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/v1/encounter/" &&
        url.searchParams.get("patient") === patientId &&
        url.searchParams.get("limit") === "5"
      );
    });

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounters?page=-5`,
    );

    expect(new URL((await request).url()).searchParams.get("offset")).toBe("0");
    // The router drops the invalid page when the page loads.
    await expect(page).not.toHaveURL(/page=-5/);
  });

  test("goes back to the source URL of the clinical history", async ({
    page,
  }) => {
    const encounterPath = `/facility/${facilityId}/patient/${patientId}/encounter/${getEncounterId()}/updates`;
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/history/responses?${new URLSearchParams({ sourceUrl: encounterPath })}`,
    );

    const back = page.getByText("Back to Encounter", { exact: true });
    await expect(back).toBeVisible();
    await back.locator("..").getByRole("button").click();

    await expect(page).toHaveURL(encounterPath);
  });

  test("goes back to the patient without a source URL", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/history/responses`,
    );

    const back = page.getByText("Back to Patient", { exact: true });
    await expect(back).toBeVisible();
    await back.locator("..").getByRole("button").click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}`,
    );
  });

  test("goes back to the patient for a source URL on another origin", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/history/responses?${new URLSearchParams({ sourceUrl: "https://example.com/" })}`,
    );

    // The schema reads the other origin as no source URL.
    const back = page.getByText("Back to Patient", { exact: true });
    await expect(back).toBeVisible();
    await back.locator("..").getByRole("button").click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}`,
    );
  });
});
