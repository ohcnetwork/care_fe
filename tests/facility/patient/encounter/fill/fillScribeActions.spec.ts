import { expect, type Page, test } from "@playwright/test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// There is no host UI for invoking a federated Scribe action. This browser
// integration harness mounts the real hook and questionnaire renderer, with
// fixture clinical API responses. Run against `npm run dev`; preview builds
// intentionally do not expose their source modules.
test.use({ storageState: "tests/.auth/user.json" });

const harnessFilename = `fillActionHarness-${crypto.randomUUID()}.tsx`;

const harnessSource = `
import React, { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useStore } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { QuestionnaireFormProvider } from "@/components/QuestionnaireV2/form/FormContext";
import { QuestionBlock } from "@/components/QuestionnaireV2/form/QuestionBlock";
import { useFillActions } from "@/components/QuestionnaireV2/fill/useFillActions";
import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";

await i18n.use(initReactI18next).init({
  lng: "en", fallbackLng: "en",
  resources: { en: { translation: await (await fetch("/locale/en.json")).json() } },
});
const subject = { type: "encounter", patientId: "scribe-patient", encounterId: "scribe-encounter", facilityId: "scribe-facility" };
const questions = [
  { id: "date", link_id: "date", text: "Date", type: "date" },
  { id: "dateTime", link_id: "dateTime", text: "Date and time", type: "dateTime" },
  { id: "time", link_id: "time", text: "Time", type: "time" },
  { id: "diagnosis", link_id: "diagnosis", text: "Diagnoses", type: "structured", structured_type: "diagnosis" },
  { id: "symptom", link_id: "symptom", text: "Symptoms", type: "structured", structured_type: "symptom" },
];
const questionnaire = { id: "scribe", slug: "scribe", title: "Scribe integration", version: "1", status: "active", subject_type: "encounter", questions };
const forms = [{ key: "scribe", isPrimary: true, questionnaire }];
function Form() {
  const store = useStore();
  const getStore = useCallback(() => store, [store]);
  const actions = useFillActions({ subject, forms, getStore });
  useEffect(() => {
    window.fillActionHarness = {
      invoke: (input) => actions.invoke("questionnaire.response.set", input),
      list: () => actions.invoke("questionnaire.forms.list", {}),
      responses: () => store.get(responsesAtom),
    };
  }, [actions.invoke, store]);
  return <main>{questions.map((question, index) => <QuestionBlock key={question.id} question={question} index={index} siblingCount={questions.length} parentId={null} depth={0} />)}</main>;
}
createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <QuestionnaireFormProvider questionnaire={questionnaire} subject={subject} mode="fill"><Form /></QuestionnaireFormProvider>
  </QueryClientProvider>
);
`;

interface HarnessWindow extends Window {
  fillActionHarness: {
    invoke: (input: {
      link_id: string;
      values: unknown[];
    }) => Promise<{ ok: boolean; error?: string }>;
    list: () => Promise<{
      ok: boolean;
      data: {
        questions: {
          link_id: string;
          structured_type?: string;
          values?: unknown[];
        }[];
      }[];
    }>;
    responses: () => Record<
      string,
      { values: { type: string; value: unknown }[] }
    >;
  };
}

function existingClinicalRow(type: string) {
  return {
    id: `existing-${type}`,
    code: {
      code: `existing-${type}`,
      system: "test",
      display: `Existing ${type}`,
    },
    clinical_status: "active",
    verification_status: "confirmed",
    severity: "moderate",
    category:
      type === "diagnosis" ? "encounter_diagnosis" : "problem_list_item",
    encounter: "scribe-encounter",
    created_date: "2026-09-08T00:00:00Z",
  };
}

async function setAnswer(page: Page, linkId: string, values: unknown[]) {
  return page.evaluate(
    (input) => (window as HarnessWindow).fillActionHarness.invoke(input),
    { link_id: linkId, values },
  );
}

test.beforeEach(async ({ page, request }, testInfo) => {
  const source = await request.get("/src/lib/actions/index.ts");
  test.skip(
    !source.headers()["content-type"]?.includes("javascript"),
    "Scribe action integration requires the Vite dev server (npm run dev)",
  );
  const fixturePath = testInfo.outputPath(harnessFilename);
  await mkdir(path.dirname(fixturePath), { recursive: true });
  await writeFile(fixturePath, harnessSource);
  const modulePath = `/${path.relative(process.cwd(), fixturePath)}`;
  await page.route("**/api/v1/**", (route) => {
    const type = ["diagnosis", "symptom"].find((candidate) =>
      new URL(route.request().url()).pathname.includes(`/${candidate}/`),
    );
    return route.fulfill({
      json: type
        ? { count: 1, results: [existingClinicalRow(type)] }
        : { count: 0, results: [] },
    });
  });
  await page.route("**/__fill_action_harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from "/@react-refresh";
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        await import(${JSON.stringify(modulePath)});
      </script></body></html>`,
    }),
  );
  await page.goto("/__fill_action_harness");
  await expect(page.locator('[data-question-id="time"] input')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => !!(window as HarnessWindow).fillActionHarness),
    )
    .toBe(true);
  for (const type of ["diagnosis", "symptom"]) {
    await expect(
      page
        .locator(`[data-question-id="${type}"]`)
        .getByRole("table")
        .getByText(`Existing ${type}`, { exact: true }),
    ).toBeVisible();
  }
});

test.afterEach(async ({ page }, testInfo) => {
  await page.close();
  await rm(testInfo.outputPath(harnessFilename), { force: true });
});

for (const timezoneId of ["America/Los_Angeles", "Asia/Kolkata"]) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    test("Scribe date, datetime and time answers render in their own input formats", async ({
      page,
    }) => {
      await test.step("Set a calendar date, a local datetime and a clock time", async () => {
        expect(await setAnswer(page, "date", ["2026-09-08"])).toEqual({
          ok: true,
        });
        expect(await setAnswer(page, "dateTime", ["2026-09-08T14:35"])).toEqual(
          { ok: true },
        );
        expect(await setAnswer(page, "time", ["09:12:30"])).toEqual({
          ok: true,
        });
        await expect(page.locator('[data-question-id="date"]')).toContainText(
          "September 8th, 2026",
        );
        await expect(
          page.locator('[data-question-id="dateTime"] input[type="time"]'),
        ).toHaveValue("14:35");
        await expect(
          page.locator('[data-question-id="time"] input'),
        ).toHaveValue("09:12:30");
      });
      await test.step("Reject mixed formats without replacing the displayed answers", async () => {
        expect((await setAnswer(page, "date", ["2026-09-08T14:35"])).ok).toBe(
          false,
        );
        expect((await setAnswer(page, "dateTime", ["2026-09-08"])).ok).toBe(
          false,
        );
        expect((await setAnswer(page, "time", ["2026-09-08T14:35"])).ok).toBe(
          false,
        );
        expect((await setAnswer(page, "date", ["2026-02-30"])).ok).toBe(false);
        await expect(page.locator('[data-question-id="date"]')).toContainText(
          "September 8th, 2026",
        );
        await expect(
          page.locator('[data-question-id="dateTime"] input[type="time"]'),
        ).toHaveValue("14:35");
        await expect(
          page.locator('[data-question-id="time"] input'),
        ).toHaveValue("09:12:30");
      });
      await test.step("Display an explicit datetime offset in the clinician's timezone", async () => {
        expect(
          await setAnswer(page, "dateTime", ["2026-09-08T14:35:00+05:30"]),
        ).toEqual({ ok: true });
        await expect(
          page.locator('[data-question-id="dateTime"] input[type="time"]'),
        ).toHaveValue(timezoneId === "Asia/Kolkata" ? "14:35" : "02:05");
      });
    });
  });
}

for (const type of ["diagnosis", "symptom"]) {
  test(`Scribe ${type} rows render and duplicates preserve the current answer`, async ({
    page,
  }) => {
    const label = `Scribe ${type}`;
    const row = {
      code: { code: `scribe-${type}`, system: "test", display: label },
      clinical_status: "active",
      verification_status: "confirmed",
      severity: "moderate",
      category:
        type === "diagnosis" ? "encounter_diagnosis" : "problem_list_item",
      onset: { onset_datetime: "2026-09-08" },
      note: "Captured by Scribe",
    };
    await test.step("Reject a duplicate of an existing clinical record", async () => {
      const { id: existingId, ...existing } = existingClinicalRow(type);
      expect(await setAnswer(page, type, [existing])).toMatchObject({
        ok: false,
        error: expect.stringContaining("Duplicate"),
      });
      const summary = await page.evaluate(() =>
        (window as HarnessWindow).fillActionHarness.list(),
      );
      expect(
        summary.data[0].questions.find((question) => question.link_id === type),
      ).toMatchObject({
        structured_type: type,
        values: [expect.objectContaining({ id: existingId })],
      });
    });
    await test.step("Write a structured row through the registered action", async () => {
      expect(await setAnswer(page, type, [row])).toEqual({ ok: true });
      await expect(
        page
          .locator(`[data-question-id="${type}"]`)
          .getByRole("table")
          .getByText(label, { exact: true }),
      ).toBeVisible();
    });
    await test.step("Replace unsaved rows idempotently and reject duplicate batch rows", async () => {
      expect(await setAnswer(page, type, [row])).toEqual({ ok: true });
      const other = {
        ...row,
        code: { ...row.code, code: "new-code", display: "Another finding" },
      };
      expect(await setAnswer(page, type, [row, other])).toEqual({ ok: true });
      const before = await page.evaluate(
        (key) => (window as HarnessWindow).fillActionHarness.responses()[key],
        type,
      );
      expect(await setAnswer(page, type, [row, other, other])).toMatchObject({
        ok: false,
        error: expect.stringContaining("Duplicate"),
      });
      expect(
        await page.evaluate(
          (key) => (window as HarnessWindow).fillActionHarness.responses()[key],
          type,
        ),
      ).toEqual(before);
      await expect(
        page
          .locator(`[data-question-id="${type}"]`)
          .getByRole("table")
          .getByText(label, { exact: true }),
      ).toHaveCount(1);
    });
  });
}
