import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { jsPDF } from "jspdf";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const LOAD_ERROR =
  "Unable to load all reports and attachments. Please reload the page and try again.";

function createIdentifier(autoMaintained = false, use = "official") {
  return {
    config: {
      id: faker.string.uuid(),
      config: {
        display: `Patient ID ${faker.string.alphanumeric(8)}`,
        use,
        auto_maintained: autoMaintained,
      },
    },
    value: faker.string.alphanumeric(12),
  };
}

function createReport(
  patientId: string,
  serviceRequestId: string,
  identifiers: {
    instance_identifiers?: ReturnType<typeof createIdentifier>[];
    facility_identifiers?: ReturnType<typeof createIdentifier>[];
  } = {},
) {
  return {
    id: faker.string.uuid(),
    status: "final",
    code: { system: "test", code: "panel", display: faker.word.words(3) },
    category: { system: "test", code: "lab", display: "Laboratory" },
    encounter: {
      patient: {
        id: patientId,
        name: faker.person.fullName(),
        gender: "male",
        date_of_birth: "1990-01-01",
        instance_identifiers: identifiers.instance_identifiers ?? [],
        facility_identifiers: identifiers.facility_identifiers ?? [],
      },
    },
    service_request: { id: serviceRequestId, title: faker.word.words(3) },
    observations: [],
    conclusion: "",
    created_date: new Date().toISOString(),
  };
}

async function mockReport(
  page: Page,
  patientId: string,
  report: ReturnType<typeof createReport>,
) {
  await page.route(
    `**/api/v1/patient/${patientId}/diagnostic_report/${report.id}/`,
    (route) => route.fulfill({ json: report }),
  );
}

test.describe("Diagnostic report printing", () => {
  let patientId: string;
  let serviceRequestId: string;
  let printUrl: string;

  test.beforeEach(() => {
    patientId = getPatientId();
    serviceRequestId = faker.string.uuid();
    printUrl = `/facility/${getFacilityId()}/patient/${patientId}/service_request/${serviceRequestId}/diagnostic_reports/print`;
  });

  test("does not offer a blank printout when there are no final reports", async ({
    page,
  }) => {
    await page.route(
      `**/api/v1/patient/${patientId}/diagnostic_report/?*`,
      (route) => route.fulfill({ json: { count: 0, results: [] } }),
    );

    await page.goto(printUrl);

    await expect(page.getByText("No Diagnostic Reports Found")).toBeVisible();
    await expect(page.getByRole("button", { name: /^print/i })).toHaveCount(0);
  });

  test("does not silently omit a report that fails to load", async ({
    page,
  }) => {
    const firstReport = createReport(patientId, serviceRequestId);
    const secondReport = createReport(patientId, serviceRequestId);
    await page.route(
      `**/api/v1/patient/${patientId}/diagnostic_report/?*`,
      (route) =>
        route.fulfill({
          json: { count: 2, results: [firstReport, secondReport] },
        }),
    );
    await mockReport(page, patientId, firstReport);
    await page.route(
      `**/api/v1/patient/${patientId}/diagnostic_report/${secondReport.id}/`,
      (route) => route.fulfill({ status: 503, json: {} }),
    );
    await page.route("**/api/v1/files/?*", (route) =>
      route.fulfill({ json: { count: 0, results: [] } }),
    );

    await page.goto(printUrl);

    await expect(
      page.getByRole("alert").filter({ hasText: LOAD_ERROR }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^print/i })).toHaveCount(0);
  });

  test("prints only final reports belonging to the requested service request", async ({
    page,
  }) => {
    const instanceIdentifier = createIdentifier();
    const facilityIdentifier = createIdentifier();
    const automaticInstanceIdentifier = createIdentifier(true);
    const automaticFacilityIdentifier = createIdentifier(true);
    const secondaryIdentifier = createIdentifier(false, "secondary");
    const report = createReport(patientId, serviceRequestId, {
      instance_identifiers: [
        instanceIdentifier,
        automaticInstanceIdentifier,
        secondaryIdentifier,
      ],
      facility_identifiers: [facilityIdentifier, automaticFacilityIdentifier],
    });
    report.conclusion =
      "## **Clinical interpretation**\n\n<u>Underlined detail</u> and ==Highlighted detail==\n\n- First finding\n- Second finding\n\n- [ ] Follow up\n- [x] Sample reviewed\n\nValues <left> and <medication> remain visible.";
    const anotherRequestReport = createReport(patientId, faker.string.uuid());
    const preliminaryReport = {
      ...createReport(patientId, serviceRequestId),
      status: "preliminary",
    };
    await page.route(
      `**/api/v1/patient/${patientId}/diagnostic_report/?*`,
      (route) =>
        route.fulfill({
          json: {
            count: 3,
            results: [report, anotherRequestReport, preliminaryReport],
          },
        }),
    );
    await mockReport(page, patientId, report);
    await mockReport(page, patientId, anotherRequestReport);
    await mockReport(page, patientId, preliminaryReport);
    await page.route("**/api/v1/files/?*", (route) =>
      route.fulfill({ json: { count: 0, results: [] } }),
    );

    await page.goto(printUrl);

    await expect(page.getByRole("button", { name: /^print/i })).toBeEnabled();
    await expect(
      page.getByRole("heading", { name: report.code.display }),
    ).toBeVisible();
    await expect(page.getByText(anotherRequestReport.code.display)).toHaveCount(
      0,
    );
    await expect(page.getByText(preliminaryReport.code.display)).toHaveCount(0);
    for (const identifier of [instanceIdentifier, facilityIdentifier]) {
      await expect(
        page.getByText(identifier.config.config.display, { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(identifier.value, { exact: true }),
      ).toBeVisible();
    }
    for (const identifier of [
      automaticInstanceIdentifier,
      automaticFacilityIdentifier,
      secondaryIdentifier,
    ]) {
      await expect(
        page.getByText(identifier.config.config.display, { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText(identifier.value, { exact: true }),
      ).toHaveCount(0);
    }
    await expect(
      page.locator("strong", { hasText: "Clinical interpretation" }),
    ).toBeVisible();
    const conclusion = page
      .getByRole("article")
      .filter({ hasText: "Clinical interpretation" });
    await expect(conclusion.getByRole("listitem")).toHaveText([
      "First finding",
      "Second finding",
      "Follow up",
      "Sample reviewed",
    ]);
    await expect(
      conclusion.getByRole("heading", {
        name: "Clinical interpretation",
        level: 2,
      }),
    ).toBeVisible();
    await expect(
      conclusion.locator("u", { hasText: "Underlined detail" }),
    ).toBeVisible();
    await expect(
      conclusion.locator("mark", { hasText: "Highlighted detail" }),
    ).toBeVisible();
    const checkboxes = conclusion.getByRole("checkbox");
    await expect(checkboxes).toHaveCount(2);
    await expect(checkboxes.nth(0)).toBeDisabled();
    await expect(checkboxes.nth(0)).not.toBeChecked();
    await expect(checkboxes.nth(1)).toBeDisabled();
    await expect(checkboxes.nth(1)).toBeChecked();
    await expect(
      conclusion.getByText("Values <left> and <medication> remain visible.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Conclusion", exact: true }),
    ).toHaveCount(0);
  });

  test("does not print a single report when its attachment list fails", async ({
    page,
  }) => {
    const report = createReport(patientId, serviceRequestId);
    await mockReport(page, patientId, report);
    await page.route("**/api/v1/files/?*", (route) =>
      route.fulfill({ status: 503, json: {} }),
    );

    await page.goto(
      `/facility/${getFacilityId()}/patient/${patientId}/diagnostic_reports/${report.id}/print`,
    );

    await expect(
      page.getByRole("alert").filter({ hasText: LOAD_ERROR }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^print/i })).toHaveCount(0);
  });

  test("waits for all PDF pages before enabling print", async ({ page }) => {
    const report = createReport(patientId, serviceRequestId);
    const fileId = faker.string.uuid();
    const pdfUrl = `/print-test-${fileId}.pdf`;
    const pdf = new jsPDF();
    pdf.text("First diagnostic report page", 20, 20);
    pdf.addPage();
    pdf.text("Second diagnostic report page", 20, 20);

    await page.route(
      `**/api/v1/patient/${patientId}/diagnostic_report/?*`,
      (route) => route.fulfill({ json: { count: 1, results: [report] } }),
    );
    await mockReport(page, patientId, report);
    await page.route("**/api/v1/files/?*", (route) =>
      route.fulfill({
        json: {
          count: 1,
          results: [
            {
              id: fileId,
              extension: "pdf",
              is_archived: false,
              upload_completed: true,
            },
          ],
        },
      }),
    );
    await page.route(`**/api/v1/files/${fileId}/?*`, (route) =>
      route.fulfill({ json: { id: fileId, read_signed_url: pdfUrl } }),
    );

    let releasePdf = () => {};
    const pdfGate = new Promise<void>((resolve) => {
      releasePdf = resolve;
    });
    await page.route(`**${pdfUrl}`, async (route) => {
      await pdfGate;
      await route.fulfill({
        contentType: "application/pdf",
        body: Buffer.from(pdf.output("arraybuffer")),
      });
    });

    try {
      const pdfRequest = page.waitForRequest(`**${pdfUrl}`, { timeout: 15000 });
      await page.goto(printUrl, { waitUntil: "domcontentloaded" });
      await pdfRequest;

      const printButton = page.getByRole("button", { name: /^print/i });
      await expect(printButton).toBeDisabled();

      releasePdf();
      await expect(page.locator(".react-pdf__Page__canvas")).toHaveCount(2);
      await expect(printButton).toBeEnabled();
      for (const canvas of await page
        .locator(".react-pdf__Page__canvas")
        .all()) {
        await expect(canvas).toBeVisible();
      }
    } finally {
      releasePdf();
    }
  });
});
