import { faker } from "@faker-js/faker";
import { expect, test, type Page, type Request } from "@playwright/test";
import { format, subDays } from "date-fns";
import { readFileSync } from "fs";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Signatures of the browser talking to object storage directly.
 *
 * CARE mediates every byte in and out of storage, so none of these may ever
 * appear in a request the app makes. Matching on provider hostnames and
 * signed-URL query parameters rather than on a port keeps this independent of
 * which provider a given deployment is configured with.
 */
const PROVIDER_REQUEST =
  /(amazonaws\.com|storage\.googleapis\.com|\.r2\.cloudflarestorage\.com|\.blob\.core\.windows\.net|localstack|127\.0\.0\.1:4566|X-Amz-Signature|X-Amz-Credential|GoogleAccessId|X-Goog-Signature)/i;

const API_ORIGIN = process.env.REACT_CARE_API_URL ?? "http://127.0.0.1:9000";

function trackRequests(page: Page) {
  const requests: Request[] = [];
  page.on("request", (request) => requests.push(request));
  return requests;
}

function assertNoProviderTraffic(requests: Request[]) {
  const offenders = requests
    .map((request) => request.url())
    .filter((url) => PROVIDER_REQUEST.test(url));

  expect(
    offenders,
    `Expected no direct object-storage traffic, got:\n${offenders.join("\n")}`,
  ).toEqual([]);
}

test.describe("Provider-neutral file transport", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    const viewEncounterLink = page
      .getByRole("link", { name: "View Encounter" })
      .first();
    await expect(viewEncounterLink).toBeVisible({ timeout: 10000 });
    await viewEncounterLink.click();

    await expect(page).toHaveURL(/\/encounter\//, { timeout: 10000 });
    await page.goto(page.url().split("/encounter/")[0]);

    const filesTab = page.getByRole("tab", { name: "Files" });
    await expect(filesTab).toBeVisible({ timeout: 10000 });
    await filesTab.click();

    await expect(page.getByRole("button", { name: "Add Files" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("uploads as multipart to CARE, never base64 and never to a bucket", async ({
    page,
  }) => {
    const requests = trackRequests(page);
    const displayName = faker.system.fileName();

    await page.getByRole("button", { name: "Add Files" }).click();
    await expect(page.locator('input[type="file"]')).toBeAttached({
      timeout: 5000,
    });
    await page
      .locator('input[type="file"]')
      .setInputFiles("tests/fixtures/images/sample_img1.png");

    await expect(
      page.getByRole("textbox", { name: "File Name" }).first(),
    ).toBeVisible({ timeout: 5000 });
    await page
      .getByRole("textbox", { name: "File Name" })
      .first()
      .fill(displayName);

    const uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/files/upload-file/") &&
        response.request().method() === "POST",
      { timeout: 15000 },
    );

    await page.getByRole("button", { name: "Upload" }).click();
    const response = await uploadPromise;
    expect(response.status()).toBe(200);

    const request = response.request();

    // The browser sets the multipart content type, including the boundary.
    const contentType = (await request.headerValue("content-type")) ?? "";
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);

    // The response carries a CARE route and no signed URL of any kind.
    const payload = await response.json();
    expect(payload.download_url).toMatch(/^\/api\/v1\/files\/.+\/download\/$/);
    expect(payload).not.toHaveProperty("signed_url");
    expect(payload).not.toHaveProperty("read_signed_url");

    // Reading the file back proves the raw bytes were sent: a base64 or
    // otherwise re-encoded body would not round-trip byte for byte.
    // (Playwright cannot surface a streamed multipart body, so the transport is
    // asserted through its content type above and its result here.)
    const token = await page.evaluate(() =>
      localStorage.getItem("care_access_token"),
    );
    const stored = await page.request.get(
      `${API_ORIGIN}${payload.download_url}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(stored.status()).toBe(200);
    expect(Buffer.from(await stored.body())).toEqual(
      readFileSync("tests/fixtures/images/sample_img1.png"),
    );

    await expect(page.getByText("File Uploaded Successfully")).toBeVisible({
      timeout: 10000,
    });

    // No signed-upload handshake: the old flow began with POST /api/v1/files/.
    const initiateCalls = requests.filter(
      (r) =>
        r.method() === "POST" && new URL(r.url()).pathname === "/api/v1/files/",
    );
    expect(initiateCalls).toEqual([]);

    assertNoProviderTraffic(requests);
  });

  test("downloads through the CARE download route", async ({ page }) => {
    const requests = trackRequests(page);
    const displayName = faker.system.fileName();

    await page.getByRole("button", { name: "Add Files" }).click();
    await expect(page.locator('input[type="file"]')).toBeAttached({
      timeout: 5000,
    });
    await page
      .locator('input[type="file"]')
      .setInputFiles("tests/fixtures/images/sample_img1.png");
    await expect(
      page.getByRole("textbox", { name: "File Name" }).first(),
    ).toBeVisible({ timeout: 5000 });
    await page
      .getByRole("textbox", { name: "File Name" })
      .first()
      .fill(displayName);
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByText("File Uploaded Successfully")).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Close toast" }).click();

    const downloadPromise = page.waitForResponse(
      (response) =>
        /\/api\/v1\/files\/[^/]+\/download\/$/.test(
          new URL(response.url()).pathname,
        ) && response.request().method() === "GET",
      { timeout: 15000 },
    );

    await expect(
      page.getByRole("button", { name: /view/i }).first(),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /view/i }).first().click();

    const downloadResponse = await downloadPromise;
    expect(downloadResponse.status()).toBe(200);

    // Served by CARE, and authenticated with the app's bearer token.
    expect(downloadResponse.url()).toContain(API_ORIGIN);
    expect(
      await downloadResponse.request().headerValue("authorization"),
    ).toMatch(/^Bearer /);

    assertNoProviderTraffic(requests);
  });
});
