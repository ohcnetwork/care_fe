import { expect, test, type Page } from "@playwright/test";
import {
  authorActiveQuestionnaire,
  encounterPath,
  importQuestionsInStudio,
  newEncounter,
  openFormFromEncounter,
  saveStudio,
  selectInOutline,
} from "tests/helper/authoredForms";
import { submitAndExpectSuccess } from "tests/helper/questionnaire";
import {
  getQuestionnaireViaApi,
  questionBlock,
} from "tests/helper/questionnaireV2";

test.use({ storageState: "tests/.auth/user.json" });

const LOINC = "http://loinc.org";
// Codes and card titles from public/config/plots.json → "Primary Parameters".
const PULSE = "8867-4";
const TEMPERATURE = "8310-5";
const RESPIRATORY_RATE = "9279-1";
const CAPTURE_FLAGS = [
  "Collect Time",
  "Collect Performer",
  "Collect Method",
  "Collect Body Site",
];

function plotCard(page: Page, title: string) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
}

test.describe("Observation coding authored in the studio, recorded on an encounter", () => {
  test("coded answers become observations and plot points whether capture flags are on or off; uncoded and blank ones don't", async ({
    page,
  }) => {
    const stamp = Date.now();
    const title = `QV2 Coded Vitals ${stamp}`;
    const pulse = `Pulse reading ${stamp}`;
    const temperature = `Temperature reading ${stamp}`;
    const respiratory = `Breathing rate ${stamp}`;
    const remark = `Bedside remark ${stamp}`;
    const remarkAnswer = `calm-${stamp}`;
    let id = "";
    let pulseDisplay = "";
    let temperatureDisplay = "";
    let respiratoryDisplay = "";

    await test.step("Author the questions; temperature and breathing rate arrive coded", async () => {
      id = await authorActiveQuestionnaire(page, title);
      await importQuestionsInStudio(page, [
        { text: pulse, type: "integer", link_id: "pulse" },
        {
          text: temperature,
          type: "decimal",
          link_id: "temperature",
          code: {
            system: LOINC,
            code: TEMPERATURE,
            display: "Body temperature",
          },
        },
        {
          text: respiratory,
          type: "integer",
          link_id: "respiratory",
          code: {
            system: LOINC,
            code: RESPIRATORY_RATE,
            display: "Respiratory rate",
          },
        },
        { text: remark, type: "string", link_id: "remark" },
      ]);
    });

    await test.step("Bind the pulse code from the observation search and tick every capture flag", async () => {
      await selectInOutline(page, pulse);
      await page.getByRole("tab", { name: "Coding" }).click();
      await page
        .getByRole("combobox", { name: "Search for observation codes" })
        .click();
      // The search matches display text only; each row carries its code.
      await page
        .locator('[data-slot="command-input"]')
        .first()
        .fill("heart rate");
      await page
        .getByTestId("valueset-search-results")
        .getByRole("option")
        .filter({ hasText: `(${PULSE})` })
        .click();
      await expect(page.getByText("Code Verified")).toBeVisible();
      await expect(page.getByText(`LOINC: ${PULSE}`)).toBeVisible();
      for (const name of CAPTURE_FLAGS) {
        const flag = page.getByRole("checkbox", { name, exact: true });
        await flag.click();
        await expect(flag).toHaveAttribute("aria-checked", "true");
      }
    });

    await test.step("The imported code shows on the Coding tab with every capture flag off", async () => {
      await selectInOutline(page, temperature);
      await page.getByRole("tab", { name: "Coding" }).click();
      await expect(page.getByText(`LOINC: ${TEMPERATURE}`)).toBeVisible();
      for (const name of CAPTURE_FLAGS) {
        await expect(
          page.getByRole("checkbox", { name, exact: true }),
        ).toHaveAttribute("aria-checked", "false");
      }
      await saveStudio(page);
    });

    await test.step("The server stored the codes and exactly the flags that were ticked", async () => {
      const { questions } = await getQuestionnaireViaApi(id);
      const [p, t, r, s] = questions as {
        code?: { code: string; display: string };
        collect_time?: boolean;
        collect_performer?: boolean;
        collect_method?: boolean;
        collect_body_site?: boolean;
      }[];
      expect(p).toMatchObject({
        code: { code: PULSE },
        collect_time: true,
        collect_performer: true,
        collect_method: true,
        collect_body_site: true,
      });
      expect(t.code?.code).toBe(TEMPERATURE);
      for (const flag of [
        t.collect_time,
        t.collect_performer,
        t.collect_method,
        t.collect_body_site,
      ]) {
        expect(flag ?? false).toBe(false);
      }
      expect(r.code?.code).toBe(RESPIRATORY_RATE);
      expect(s.code ?? null).toBeNull();
      pulseDisplay = p.code!.display;
      temperatureDisplay = t.code!.display;
      respiratoryDisplay = r.code!.display;
    });

    const encounter = await newEncounter();

    await test.step("Answer pulse, temperature and the remark; leave breathing rate blank", async () => {
      await openFormFromEncounter(page, encounter, title);
      await questionBlock(page, pulse).getByRole("spinbutton").fill("88");
      await questionBlock(page, temperature)
        .getByRole("spinbutton")
        .fill("37.2");
      await questionBlock(page, remark).getByRole("textbox").fill(remarkAnswer);
      await submitAndExpectSuccess(page);
      await page.waitForURL(/\/updates$/);
    });

    await test.step("Observations tab: both coded answers, nothing for the blank or uncoded one", async () => {
      await page.goto(`${encounterPath(encounter)}/observations`);
      const entry = (display: string) =>
        page
          .locator('[data-slot="card"]')
          .filter({ has: page.getByText(display, { exact: true }) });
      await expect(entry(pulseDisplay)).toHaveCount(1);
      await expect(entry(pulseDisplay)).toContainText("88");
      await expect(entry(temperatureDisplay)).toHaveCount(1);
      await expect(entry(temperatureDisplay)).toContainText("37.2");
      await expect(
        page.getByText(respiratoryDisplay, { exact: true }),
      ).toHaveCount(0);
      await expect(page.getByText(remarkAnswer)).toHaveCount(0);
    });

    await test.step("Plots tab: pulse and temperature plot, respiratory rate has no data", async () => {
      await page.goto(`${encounterPath(encounter)}/plots`);
      for (const [card, value] of [
        ["Pulse", "88"],
        ["Temperature", "37.2"],
      ] as const) {
        const plot = plotCard(page, card);
        await plot.getByRole("tab", { name: "Recent Data" }).click();
        const row = plot.getByRole("row").filter({ hasText: `${card}:` });
        await expect(row).toHaveCount(1);
        await expect(row).toContainText(value);
      }
      const respiratoryPlot = plotCard(page, "Respiratory Rate");
      await respiratoryPlot.getByRole("tab", { name: "Recent Data" }).click();
      await expect(
        respiratoryPlot
          .getByRole("row")
          .filter({ hasText: "Respiratory Rate:" }),
      ).toHaveCount(0);
    });
  });
});
