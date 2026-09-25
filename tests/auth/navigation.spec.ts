import { expect, test } from "@playwright/test";

test("patient registration links preserve booking parameters in a new tab", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    localStorage.setItem(
      "care_patient_token",
      JSON.stringify({
        token: "mock-patient-session",
        phoneNumber: "+15555550100",
        createdAt: new Date().toISOString(),
      }),
    );
  });
  await context.route("**/api/**", (route) =>
    route.fulfill({ json: { count: 0, results: [] } }),
  );

  const query = new URLSearchParams({
    slotId: "test-slot",
    reason: "Follow-up & review + check",
  });
  const basePath = "/facility/test-facility/appointments/test-staff";
  await page.goto(`${basePath}/patient-select?${query}`);

  const registration = page.getByRole("link", { name: /add new patient/i });
  await expect(registration).toHaveAttribute(
    "href",
    `${basePath}/patient-registration?${query}`,
  );

  const newPagePromise = context.waitForEvent("page");
  await registration.click({ button: "middle" });
  const newPage = await newPagePromise;

  await expect(newPage).toHaveURL(
    (url) =>
      url.pathname === `${basePath}/patient-registration` &&
      url.searchParams.get("slotId") === query.get("slotId") &&
      url.searchParams.get("reason") === query.get("reason"),
  );
  await expect(page).toHaveURL(
    (url) => url.pathname === `${basePath}/patient-select`,
  );
  await newPage.close();
});
