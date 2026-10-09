import { expect, type Locator, type Page, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const OTHER_STRUCTURED_TYPES = [
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
  const prescriptionId = crypto.randomUUID();
  const structured = (type: string) => ({
    id: type,
    link_id: type,
    text: `Layout ${type}`,
    type: "structured",
    structured_type: type,
    required: false,
    questions: [],
  });
  const leaves = [
    {
      id: "ordinary-note",
      link_id: "ordinary-note",
      text: "Ordinary clinical note",
      type: "string",
      required: false,
      // The authored grid may still put ordinary fields into separate
      // columns. This one explicitly spans them for a like-for-like check.
      styling_metadata: { containerClasses: "col-span-full" },
      questions: [],
    },
    ...[...OTHER_STRUCTURED_TYPES, ...MEDICATION_TYPES].map(structured),
  ];
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

  for (const type of MEDICATION_TYPES) {
    const record = {
      id: crypto.randomUUID(),
      medication: {
        code: `LAYOUT-${type}`,
        system: "test",
        display: `Populated ${type} medication`,
      },
      status: "active",
      intent: "order",
      category: "outpatient",
      priority: "routine",
      do_not_perform: false,
      dosage_instruction: [{ as_needed_boolean: false }],
      dosage_text: "One tablet daily",
      information_source: "patient",
      effective_period: { start: "2025-01-01T00:00:00Z" },
      authored_on: "2025-01-01T00:00:00Z",
      note: `Saved ${type} note`,
      encounter: getEncounterId(),
      created_by: null,
      updated_by: null,
      created_date: "2025-01-01T00:00:00Z",
    };
    await page.route(
      `**/api/v1/patient/${getPatientId()}/medication/${type === "medication_request" ? "request" : "statement"}/**`,
      (route) => route.fulfill({ json: { count: 1, results: [record] } }),
    );
  }
  await page.route(
    `**/api/v1/patient/${getPatientId()}/medication/prescription/**`,
    (route) =>
      route.fulfill({
        json: { id: prescriptionId, status: "active", medications: [] },
      }),
  );

  await page.goto(
    `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}?prescription=${prescriptionId}`,
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
    test(`${nested ? "nested mixed" : "top-level"} ordinary and structured questions share one centered column at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      const block = await openLayoutFixture(page, nested);
      const ordinary = await bounds(block("ordinary-note"));
      await block("ordinary-note")
        .getByRole("textbox")
        .fill("Ordinary field remains usable");
      await block("ordinary-note").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath(
          `ordinary-${nested ? "nested" : "flat"}-${width}.png`,
        ),
      });

      for (const type of [...OTHER_STRUCTURED_TYPES, ...MEDICATION_TYPES]) {
        const box = await bounds(block(type));
        expect(
          box.width,
          `${type} exceeds the shared column`,
        ).toBeLessThanOrEqual(1024);
        expect(
          Math.abs(box.center - ordinary.center),
          `${type} is off-center`,
        ).toBeLessThanOrEqual(2);
        expect(
          Math.abs(box.width - ordinary.width),
          `${type} differs from the ordinary question width`,
        ).toBeLessThanOrEqual(2);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
        expect(
          box.scrollWidth,
          `${type} content escapes its card`,
        ).toBeLessThanOrEqual(box.clientWidth + 2);
        // Group grid columns must not halve structured-question widths.
        if (width > 768)
          expect(box.width).toBeGreaterThanOrEqual(nested ? 900 : 1000);
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
        if (MEDICATION_TYPES.includes(type)) {
          const medicationLabel =
            type === "medication_statement" && width >= 1024
              ? block(type).getByRole("heading", {
                  name: `1. Populated ${type} medication`,
                  exact: true,
                })
              : block(type)
                  .getByText(`Populated ${type} medication`, { exact: true })
                  .filter({ visible: true });
          await expect(medicationLabel).toBeVisible();
          if (width < 1024) await medicationLabel.click();
          const note = block(type).getByPlaceholder("Enter additional notes", {
            exact: true,
          });
          await expect(note).toHaveValue(`Saved ${type} note`);
          await note.fill(`Edited ${type} in the shared column`);
          await note.scrollIntoViewIfNeeded();
          await expect(note).toBeInViewport({ ratio: 0.9 });
          await expect(note).toHaveValue(`Edited ${type} in the shared column`);
          const editedBox = await bounds(block(type));
          expect(editedBox.scrollWidth).toBeLessThanOrEqual(
            editedBox.clientWidth + 2,
          );
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width);
        } else {
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
