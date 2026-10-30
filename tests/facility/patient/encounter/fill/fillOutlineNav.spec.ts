import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  KITCHEN_SINK_FACILITY_SLUG,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * The fill page's outline overlay (reference: Care Master, "Patient
 * Encounter questionnaire"): a slim tick rail on the canvas' left edge,
 * and a panel that floats OVER the full-width canvas on hover/click/focus
 * instead of reserving a column. These specs pin the interaction model
 * (open/close paths), the scroll-spy, the completion adornments and the
 * enable_when + multi-form behavior.
 *
 * Fixture: e2e-kitchen-sink-facility (encounter subject) — 22 top-level
 * questions of which 6 are enable_when-hidden by default, one group with
 * nested children, repeats and a protected question. See the care repo's
 * questionnaire_e2e_fixtures.py.
 */

/** Top-level rows visible before any answer: 22 authored minus the 6
 *  enable_when-hidden ones (the `disabled_display: "protected"` question
 *  stays visible). */
const DEFAULT_VISIBLE_TOP_LEVEL = 16;

function outlineToggle(page: Page): Locator {
  return page.getByRole("button", { name: "Questions outline" });
}

function outlinePanel(page: Page): Locator {
  return page.locator("#fill-outline-panel");
}

function outlineNav(page: Page): Locator {
  return page.getByRole("navigation", { name: "Questions" });
}

function railTicks(page: Page): Locator {
  return page.locator("[data-question-tick]");
}

function activeTick(page: Page): Locator {
  return page.locator("[data-question-tick][data-active]");
}

async function openOutline(page: Page): Promise<void> {
  const toggle = outlineToggle(page);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(outlinePanel(page)).toHaveCSS("opacity", "1");
}

test.describe("Fill outline overlay", () => {
  test.beforeEach(async ({ page }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      KITCHEN_SINK_FACILITY_SLUG,
    );
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );
    await expect(questionBlock(page, "Primary symptom")).toBeVisible();
  });

  test("collapsed by default: the canvas takes the full width behind a tick rail", async ({
    page,
  }) => {
    await test.step("the panel starts closed", async () => {
      await expect(outlineToggle(page)).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(outlinePanel(page)).toHaveCSS("opacity", "0");
      await expect(outlinePanel(page)).toHaveCSS("pointer-events", "none");
    });

    await test.step("no reserved outline column — the canvas starts at the shell's left edge", async () => {
      const canvas = await page
        .getByRole("region", { name: "Form canvas" })
        .boundingBox();
      // The old fixed aside was 288px wide; the canvas now starts inside
      // the card border (single-digit-to-few-px offset, not a column).
      expect(canvas).not.toBeNull();
      expect(canvas!.x).toBeLessThan(60);
    });

    await test.step("one tick per visible top-level question", async () => {
      await expect(railTicks(page)).toHaveCount(DEFAULT_VISIBLE_TOP_LEVEL);
      // Exactly one tick tracks the question currently in view.
      await expect(activeTick(page)).toHaveCount(1);
    });
  });

  test("click opens the panel; a row scrolls its question into view and takes the active state", async ({
    page,
  }) => {
    await openOutline(page);

    await test.step("rows are numbered and land on their question", async () => {
      const nav = outlineNav(page);
      await expect(nav).toBeVisible();
      const row = nav.getByRole("button", {
        name: /Medications taken \(repeats\)/,
      });
      await expect(row).toContainText("21.");
      await row.click();
      await expect(
        questionBlock(page, "Medications taken (repeats)"),
      ).toBeInViewport();
    });

    await test.step("scroll-spy follows: the clicked row becomes current, the rail tick moves with it", async () => {
      await expect(
        outlineNav(page).getByRole("button", {
          name: /Medications taken \(repeats\)/,
        }),
      ).toHaveAttribute("aria-current", "true");
      await expect(activeTick(page)).toHaveCount(1);
    });

    await test.step("Escape closes and returns focus to the rail", async () => {
      await page.keyboard.press("Escape");
      await expect(outlineToggle(page)).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(outlineToggle(page)).toBeFocused();
    });
  });

  test("hover opens; leaving both rail and panel closes after the grace delay", async ({
    page,
  }) => {
    await outlineToggle(page).hover();
    await expect(outlineToggle(page)).toHaveAttribute("aria-expanded", "true");

    // Crossing from the rail into the panel must not close it.
    await outlineNav(page)
      .getByRole("button", { name: /Detailed history/ })
      .hover();
    await expect(outlineToggle(page)).toHaveAttribute("aria-expanded", "true");

    // Leaving for the canvas closes it (200ms grace + transition).
    await page.mouse.move(900, 400);
    await expect(outlineToggle(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("focusing the rail opens the panel for keyboard users", async ({
    page,
  }) => {
    await outlineToggle(page).focus();
    await expect(outlineToggle(page)).toHaveAttribute("aria-expanded", "true");
    await expect(outlineNav(page)).toBeVisible();
  });

  test("group children indent under their section and navigate the nested block", async ({
    page,
  }) => {
    await openOutline(page);
    const nav = outlineNav(page);
    await expect(
      nav.getByRole("button", { name: /Examination findings/ }),
    ).toBeVisible();
    const child = nav.getByRole("button", { name: /General appearance/ });
    await expect(child).toContainText("12.1");
    await child.click();
    await expect(questionBlock(page, "General appearance")).toBeInViewport();
  });

  test("completion adornments: answering a question flips its dot to the double-check", async ({
    page,
  }) => {
    await openOutline(page);
    const row = outlineNav(page).getByRole("button", {
      name: /Primary symptom/,
    });
    await expect(row.locator("svg.lucide-check-check")).toHaveCount(0);

    // The panel overlays the canvas — close it before typing so the click
    // lands on the input, then reopen to read the adornment.
    await page.keyboard.press("Escape");
    await questionBlock(page, "Primary symptom")
      .getByRole("textbox")
      .fill("Persistent cough");

    await openOutline(page);
    await expect(row.locator("svg.lucide-check-check")).toHaveCount(1);
  });

  test("enable_when: rows and ticks appear exactly when their condition turns true", async ({
    page,
  }) => {
    await openOutline(page);
    const nav = outlineNav(page);
    await expect(
      nav.getByRole("button", { name: /Stability notes/ }),
    ).toHaveCount(0);
    await expect(railTicks(page)).toHaveCount(DEFAULT_VISIBLE_TOP_LEVEL);

    await test.step('answer "Is the patient stable?" = Yes', async () => {
      await page.keyboard.press("Escape");
      const block = questionBlock(page, "Is the patient stable?");
      await block.scrollIntoViewIfNeeded();
      await block.getByRole("radio", { name: "Yes", exact: true }).click();
    });

    await test.step("the dependent question gains a row and a tick", async () => {
      await openOutline(page);
      await expect(
        nav.getByRole("button", { name: /Stability notes/ }),
      ).toBeVisible();
      await expect(railTicks(page)).toHaveCount(DEFAULT_VISIBLE_TOP_LEVEL + 2);
    });
  });
});

test.describe("Fill outline overlay — multi-questionnaire sessions", () => {
  test("each form contributes its own outline section and rail segment", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(
      "respiratory_status-v3",
    );
    await page.goto(
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaireId}`,
    );
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
    const primaryTicks = await railTicks(page).count();

    await test.step("add a second questionnaire to the session", async () => {
      await page.getByRole("button", { name: "Add questionnaire" }).click();
      await page.getByPlaceholder("Search Forms").fill("Feedback");
      await page.getByRole("option", { name: /Feedback Form/ }).click();
      await expect(page.locator("[data-form-key]")).toHaveCount(2);
    });

    await test.step("the panel stacks one titled nav per form", async () => {
      await outlineToggle(page).click();
      // With several forms each outline landmark takes its form's title,
      // so the stacked navs stay distinguishable to a screen reader.
      await expect(
        page.getByRole("navigation", { name: /Respiratory/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: /Feedback Form/ }),
      ).toBeVisible();
    });

    await test.step("the rail carries both forms' ticks", async () => {
      expect(await railTicks(page).count()).toBeGreaterThan(primaryTicks);
    });
  });
});
