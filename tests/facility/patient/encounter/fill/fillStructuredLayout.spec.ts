import { expect, type Locator, type Page, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const NARROW_TYPES = [
  "encounter",
  "allergy_intolerance",
  "service_request",
  "diagnosis",
  "symptom",
  "files",
  "time_of_death",
  "charge_item",
  "appointment",
  "x_e2e.layout_plugin",
];
const MEDICATION_TYPES = ["medication_request", "medication_statement"];

async function openLayoutFixture(page: Page, nested: boolean) {
  const questionnaireId = crypto.randomUUID();
  const structured = (type: string) => ({
    id: type,
    link_id: type,
    text: `Layout ${type}`,
    type: "structured",
    structured_type: type,
    required: false,
    questions: [],
  });
  const leaves = [...NARROW_TYPES, ...MEDICATION_TYPES].map(structured);
  const questions = nested
    ? [
        {
          id: "mixed-group",
          link_id: "mixed-group",
          text: "Mixed clinical group",
          type: "group",
          styling_metadata: { containerClasses: "grid grid-cols-2" },
          questions: [
            {
              id: "nested-group",
              link_id: "nested-group",
              text: "Nested clinical group",
              type: "group",
              styling_metadata: { containerClasses: "grid grid-cols-2" },
              questions: leaves,
            },
          ],
        },
      ]
    : leaves;

  await page.route(`**/api/v1/questionnaire/${questionnaireId}/`, (route) =>
    route.fulfill({
      json: {
        id: questionnaireId,
        version: "1",
        slug: `layout-${questionnaireId}`,
        title: "Structured question width regression",
        status: "active",
        subject_type: "encounter",
        questions,
      },
    }),
  );

  for (const type of ["diagnosis", "symptom"]) {
    await page.route(
      `**/api/v1/patient/${getPatientId()}/${type}/**`,
      (route) =>
        route.fulfill({
          json: {
            count: 1,
            results: [
              {
                id: crypto.randomUUID(),
                code: {
                  code: `LAYOUT-${type}`,
                  system: "test",
                  display: `A populated ${type} with a descriptive clinical label`,
                },
                clinical_status: "active",
                verification_status: "confirmed",
                severity: "moderate",
                category:
                  type === "diagnosis" ? "encounter_diagnosis" : "encounter",
                onset: { onset_datetime: "2025-01-01" },
                note: `Saved ${type} note for layout verification`,
                encounter: getEncounterId(),
                created_date: "2025-01-01T00:00:00Z",
                created_by: null,
                updated_by: null,
              },
            ],
          },
        }),
    );
  }

  await page.goto(
    `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
  );
  await expect(
    page.getByRole("button", { name: "Save Changes" }),
  ).toBeVisible();
  return (type: string) => page.locator(`[data-question-id="${type}"]`);
}

async function bounds(locator: Locator) {
  await expect(locator).toBeVisible();
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      x: box.x,
      width: box.width,
      right: box.right,
      center: box.x + box.width / 2,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    };
  });
}

for (const width of [1440, 390]) {
  for (const nested of [false, true]) {
    test(`${nested ? "nested mixed" : "top-level"} structured questions use the centered column except medications at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      const block = await openLayoutFixture(page, nested);
      const medication = await bounds(block("medication_request"));
      const statement = await bounds(block("medication_statement"));
      expect(Math.abs(medication.width - statement.width)).toBeLessThanOrEqual(
        2,
      );
      if (width > 768) expect(medication.width).toBeGreaterThan(1100);

      for (const type of NARROW_TYPES) {
        const box = await bounds(block(type));
        expect(
          box.width,
          `${type} exceeds the shared column`,
        ).toBeLessThanOrEqual(1024);
        expect(
          Math.abs(box.center - medication.center),
          `${type} is off-center`,
        ).toBeLessThanOrEqual(2);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
        expect(
          box.scrollWidth,
          `${type} content escapes its card`,
        ).toBeLessThanOrEqual(box.clientWidth + 2);
        // Group grid columns must not halve structured-question widths.
        if (width > 768) expect(box.width).toBeGreaterThanOrEqual(1000);
      }
      if (nested && width > 768) {
        expect((await bounds(block("mixed-group"))).width).toBeGreaterThan(
          1000,
        );
        expect((await bounds(block("nested-group"))).width).toBeGreaterThan(
          900,
        );
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);

      for (const type of ["diagnosis", "symptom", ...MEDICATION_TYPES]) {
        if (!MEDICATION_TYPES.includes(type)) {
          await expect(
            block(type)
              .getByText(
                `A populated ${type} with a descriptive clinical label`,
                { exact: true },
              )
              .filter({ visible: true }),
          ).toBeVisible();
        }
        await block(type).scrollIntoViewIfNeeded();
        if (type === "diagnosis" && width > 768) {
          const tableMetrics = await block(type).evaluate((element) => {
            const table = element.querySelector("table")!;
            const container = table.closest('[data-slot="table-container"]')!;
            return {
              sectionWidth: element.getBoundingClientRect().width,
              tableWidth: table.getBoundingClientRect().width,
              containerWidth: container.clientWidth,
              contentWidth: container.scrollWidth,
            };
          });
          await testInfo.attach("diagnosis-table-widths.json", {
            body: JSON.stringify(tableMetrics),
            contentType: "application/json",
          });
          console.log(
            `${nested ? "Nested" : "Flat"} diagnosis widths: ${JSON.stringify(tableMetrics)}`,
          );
        }
        await page.screenshot({
          path: testInfo.outputPath(
            `${type}-${nested ? "nested" : "flat"}-${width}.png`,
          ),
        });
      }
    });
  }
}
