import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { filterSelectButton } from "tests/helper/searchParams";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The prescriptions preview reads its medication search and dispense status
// with a typed search schema (`src/lib/router/search/pharmacy.ts`).

test.describe("Prescriptions preview search params", () => {
  let previewUrl: string;

  test.beforeAll(async ({ request }) => {
    const facilityId = getFacilityId();
    const api = getApiUrl();
    const headers = getApiHeaders();
    const locations = await request.get(
      `${api}/api/v1/facility/${facilityId}/location/`,
      { headers, params: { mode: "kind", name: "Pharmacy" } },
    );
    await expect(locations).toBeOK();
    const { results } = (await locations.json()) as {
      results: { id: string; name: string }[];
    };
    const pharmacy = results.find(({ name }) => name === "Pharmacy");
    if (!pharmacy) throw new Error("Seeded Pharmacy location not found");

    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    const user = await request.get(`${api}/api/v1/users/getcurrentuser/`, {
      headers,
    });
    await expect(user).toBeOK();
    const { id: prescriberId } = await user.json();
    const prescription = await request.post(
      `${api}/api/v1/patient/${patientId}/medication/prescription/`,
      {
        headers,
        data: {
          encounter: encounterId,
          prescribed_by: prescriberId,
          status: "active",
        },
      },
    );
    await expect(prescription).toBeOK();
    const { id } = await prescription.json();
    previewUrl = `/facility/${facilityId}/locations/${pharmacy.id}/medication_requests/patient/${patientId}/prescriptions/${id}`;
  });

  const searchBox = (page: Page) => page.getByPlaceholder("Search Medications");
  const statusSelect = (page: Page) =>
    filterSelectButton(page, "Dispense Status");

  test("writes the medication search and the status to the URL", async ({
    page,
  }) => {
    await page.goto(previewUrl);
    await expect(statusSelect(page)).toContainText("All");

    await searchBox(page).fill("para");
    await expect(page).toHaveURL(/[?&]search=para(&|$)/);

    await statusSelect(page).click();
    await page
      .getByRole("menuitemradio", { name: "Partial", exact: true })
      .click();
    await expect(page).toHaveURL(/[?&]status=partial(&|$)/);
    await expect(statusSelect(page)).toContainText("Partial");
  });

  test("restores the search and the status from a bookmarked URL", async ({
    page,
  }) => {
    await page.goto(`${previewUrl}?search=para&status=complete`);

    await expect(searchBox(page)).toHaveValue("para");
    await expect(statusSelect(page)).toContainText("Complete");
  });

  test("ignores an invalid status", async ({ page }) => {
    await page.goto(`${previewUrl}?status=bogus`);

    await expect(statusSelect(page)).toContainText("All");
    await expect(page).not.toHaveURL(/status=/);
  });
});
