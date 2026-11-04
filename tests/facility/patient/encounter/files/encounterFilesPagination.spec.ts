import { faker } from "@faker-js/faker";
import { expect, test, type Request } from "@playwright/test";
import * as fs from "fs";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// Must match the `limit` that the Files tab gives to `useFilters`.
const PAGE_SIZE = 15;
const FILES_TO_CREATE = PAGE_SIZE + 1;

const isEncounterFilesListRequest = (request: Request, encounterId: string) => {
  if (request.method() !== "GET") return false;
  const url = new URL(request.url());
  return (
    url.pathname === "/api/v1/files/" &&
    url.searchParams.get("file_type") === "encounter" &&
    url.searchParams.get("associating_id") === encounterId
  );
};

// The Files table shows each file as its name followed by its extension.
const fileLabel = (file: { name: string; extension: string }) =>
  `${file.name}${file.extension}`;

test.describe("Encounter Files Pagination", () => {
  test("sends a numeric offset and paginates encounter files", async ({
    page,
    request,
  }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();
    const namePrefix = `pagination-${faker.string.alphanumeric(8)}`;
    const fileData = fs
      .readFileSync("tests/fixtures/images/sample_img1.png")
      .toString("base64");

    // Create more files than one page holds, so that a second page exists.
    for (let i = 0; i < FILES_TO_CREATE; i++) {
      const response = await request.post(
        `${getApiUrl()}/api/v1/files/upload-file/`,
        {
          headers: getApiHeaders(),
          data: {
            original_name: "sample_img1.png",
            name: `${namePrefix}-${i}`,
            file_type: "encounter",
            file_category: "unspecified",
            associating_id: encounterId,
            file_data: fileData,
          },
        },
      );
      expect(response.ok()).toBeTruthy();
    }

    // Record every list request so that no request can send a bad offset.
    const listRequests: URL[] = [];
    page.on("request", (req) => {
      if (isEncounterFilesListRequest(req, encounterId)) {
        listRequests.push(new URL(req.url()));
      }
    });

    // Page 1
    const firstPageResponsePromise = page.waitForResponse((response) =>
      isEncounterFilesListRequest(response.request(), encounterId),
    );
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/files`,
    );
    const firstPageResponse = await firstPageResponsePromise;
    expect(firstPageResponse.status()).toBe(200);

    const firstPageUrl = new URL(firstPageResponse.url());
    expect(firstPageUrl.searchParams.get("limit")).toBe(String(PAGE_SIZE));
    expect(firstPageUrl.searchParams.get("offset")).toBe("0");

    const firstPage = await firstPageResponse.json();
    expect(firstPage.count).toBeGreaterThanOrEqual(FILES_TO_CREATE);
    expect(firstPage.results).toHaveLength(PAGE_SIZE);
    await expect(
      page.getByRole("row").filter({ hasText: fileLabel(firstPage.results[0]) }),
    ).toBeVisible();

    // Page 2
    const secondPageResponsePromise = page.waitForResponse(
      (response) =>
        isEncounterFilesListRequest(response.request(), encounterId) &&
        new URL(response.url()).searchParams.get("offset") ===
          String(PAGE_SIZE),
    );
    await page.locator("#page-2").click();
    const secondPageResponse = await secondPageResponsePromise;
    expect(secondPageResponse.status()).toBe(200);

    const secondPageUrl = new URL(secondPageResponse.url());
    expect(secondPageUrl.searchParams.get("limit")).toBe(String(PAGE_SIZE));

    const secondPage = await secondPageResponse.json();
    expect(secondPage.results).toHaveLength(
      Math.min(PAGE_SIZE, secondPage.count - PAGE_SIZE),
    );

    // Page 2 must show different files than page 1.
    const firstPageIds = new Set(
      firstPage.results.map((file: { id: string }) => file.id),
    );
    for (const file of secondPage.results) {
      expect(firstPageIds.has(file.id)).toBe(false);
    }
    await expect(
      page.getByRole("row").filter({ hasText: fileLabel(secondPage.results[0]) }),
    ).toBeVisible();

    // No list request can send a missing or non-numeric offset.
    expect(listRequests.length).toBeGreaterThan(0);
    for (const url of listRequests) {
      const offset = url.searchParams.get("offset");
      expect(offset, `offset in ${url.search}`).toMatch(/^\d+$/);
    }
  });
});
