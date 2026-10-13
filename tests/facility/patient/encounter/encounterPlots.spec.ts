import { expect, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Plots Tab", () => {
  let plotsUrl: string;

  test.beforeEach(() => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    plotsUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/plots`;
  });

  test("renders empty state without crashing when plots config is empty", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error);
    });

    await test.step("Stub the plots config endpoint with an empty array", async () => {
      await page.route("**/config/plots.json*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        }),
      );
    });

    await test.step("Navigate to the Plots tab", async () => {
      await page.goto(plotsUrl);
      await expect(page.getByRole("tab", { name: "Plots" })).toHaveAttribute(
        "data-state",
        "active",
      );
    });

    await test.step("Verify the empty state renders", async () => {
      await expect(page.getByText("No plots configured")).toBeVisible();
    });

    await test.step("Verify the tab did not crash", async () => {
      expect(pageErrors).toHaveLength(0);
    });
  });

  test("shows no data message when observations have no results", async ({
    page,
  }) => {
    let analyseHits = 0;
    await test.step("Stub observations with empty results per code", async () => {
      await page.route(/\/observation\/analyse\//, (route) => {
        analyseHits++;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [
              { code: { code: "8867-4", display: "Pulse" }, results: [] },
            ],
          }),
        });
      });
    });

    await test.step("Navigate to the Plots tab", async () => {
      await page.goto(plotsUrl);
    });

    await test.step("Verify the no data message is shown", async () => {
      await expect.poll(() => analyseHits).toBeGreaterThan(0);
      await expect(page.getByText("No data available").first()).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Full History" }).first(),
      ).toBeVisible();
    });
  });

  test("shows no data message only for charts without observations", async ({
    page,
  }) => {
    let analyseHits = 0;
    await test.step("Stub observations with one empty and one filled code", async () => {
      await page.route(/\/observation\/analyse\//, (route) => {
        analyseHits++;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [
              { code: { code: "8867-4", display: "Pulse" }, results: [] },
              {
                code: { code: "8310-5", display: "Temperature" },
                results: [
                  {
                    effective_datetime: "2026-10-13T06:56:32Z",
                    status: "final",
                    value: { value: "37.2" },
                    note: "",
                    data_entered_by: {
                      first_name: "Test",
                      last_name: "Doctor",
                      username: "test",
                    },
                  },
                ],
              },
            ],
          }),
        });
      });
    });

    await test.step("Navigate to the Plots tab", async () => {
      await page.goto(plotsUrl);
    });

    await test.step("Verify empty charts show the message and filled charts render", async () => {
      await expect.poll(() => analyseHits).toBeGreaterThan(0);
      await expect(page.getByText("No data available").first()).toBeVisible();
      await expect(page.locator("svg.recharts-surface").first()).toBeVisible();
    });
  });
});
