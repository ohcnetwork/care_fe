import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const assets = new Map<string, { body: string | Buffer; contentType: string }>();

test.describe.configure({ mode: "default" });

test.beforeAll(async () => {
  const { build } = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  const { default: tailwindcss } = await import("@tailwindcss/vite");
  const result = await build({
    configFile: false,
    root: path.resolve("tests/fixtures/date-range-picker"),
    base: "/__date-range-test/",
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": path.resolve("src") } },
    logLevel: "error",
    build: { write: false, target: "esnext" },
  });
  for (const bundle of Array.isArray(result) ? result : [result]) {
    if (!("output" in bundle)) throw new Error("Expected an in-memory Vite build");
    for (const file of bundle.output) {
      assets.set(`/__date-range-test/${file.fileName}`, {
        body: file.type === "chunk" ? file.code : Buffer.from(file.source),
        contentType: file.fileName.endsWith(".html") ? "text/html"
          : file.fileName.endsWith(".css") ? "text/css" : "application/javascript",
      });
    }
  }
});

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 20, 12) });
  await page.route("**/__date-range-test/**", (route) => {
    const asset = assets.get(new URL(route.request().url()).pathname);
    if (!asset) return route.abort();
    return route.fulfill(asset);
  });
});

async function open(page: Page, query = "") {
  await page.goto(`/__date-range-test/index.html?${query}`);
  if (query.includes("menu")) {
    await page.getByRole("button", { name: "Open date filter" }).click();
  }
}

const day = (page: Page, date: string) =>
  page.locator(`[data-day="${date}"] button`);
const from = (page: Page) => page.getByRole("textbox", { name: /^start date$/i });
const to = (page: Page) => page.getByRole("textbox", { name: /^end date$/i });
const apply = (page: Page) => page.getByRole("button", { name: "Apply", exact: true });

test("first click registers, active end can be corrected, and range count is inclusive", async ({ page }) => {
  await open(page, "menu");
  const firstDay = day(page, "2026-11-03");
  await firstDay.hover();
  const original = await firstDay.elementHandle();
  await firstDay.click();
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(from(page)).toHaveValue("03/11/2026");
  await day(page, "2026-11-16").click();
  await expect(to(page)).toHaveValue("16/11/2026");
  await expect(page.getByText("14 days", { exact: true })).toBeVisible();
  await expect(apply(page)).toBeFocused();
  await day(page, "2026-11-01").click();
  await expect(from(page)).toHaveValue("01/11/2026");
  await expect(to(page)).toHaveValue("16/11/2026");
  await apply(page).click();
  await expect(page.getByTestId("applied")).toContainText('"count":1');
});

test("shortcuts and Enter move focus and apply exactly once inside a menu", async ({ page }) => {
  await open(page, "menu");
  await from(page).fill("3/11/26");
  await from(page).press("Enter");
  await expect(to(page)).toBeFocused();
  await to(page).fill("t");
  await to(page).press("Enter");
  await expect(to(page)).toHaveValue("20/11/2026");
  await expect(apply(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("applied")).toContainText('"count":1');
  await expect(page.getByTestId("applied")).toContainText('"to":"2026-11-20"');
});

test("invalid dates never commit, bounds show inline errors, and a typed reversed range swaps", async ({ page }) => {
  await open(page, "min&max");
  await from(page).fill("31/02/2026");
  await from(page).press("Tab");
  await expect(from(page)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Enter a valid date as DD/MM/YYYY")).toBeVisible();
  await expect(apply(page)).toBeDisabled();
  await expect(page.getByTestId("applied")).toContainText('"count":0');
  await from(page).fill("01/01/2026");
  await expect(from(page)).toHaveAttribute("aria-invalid", "true");
  await from(page).fill("16/11/2026");
  await to(page).fill("03/11/2026");
  await to(page).press("Enter");
  await expect(from(page)).toHaveValue("03/11/2026");
  await expect(to(page)).toHaveValue("16/11/2026");
  await to(page).fill("21/11/2026");
  await expect(to(page)).toHaveAttribute("aria-invalid", "true");
  await expect(apply(page)).toBeDisabled();
});

test("mask respects short hand-written dates and supports all accepted formats", async ({ page }) => {
  await open(page);
  await from(page).pressSequentially("03112026");
  await expect(from(page)).toHaveValue("03/11/2026");
  for (const value of ["1/5/26", "1-5-2026", "1.5.2026", "01052026"]) {
    await from(page).fill(value);
    if (value === "1/5/26") await expect(from(page)).toHaveValue(value);
    await from(page).press("Enter");
    await expect(from(page)).toHaveValue("01/05/2026");
  }
  await from(page).fill("01/01/1899");
  await expect(from(page)).toHaveAttribute("aria-invalid", "true");
});

test("future days/months and bound navigation are disabled; month grid is single-level", async ({ page }) => {
  await open(page, "min&max");
  await expect(day(page, "2026-11-21")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next month", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "November 2026", exact: true }).click();
  await expect(page.getByRole("button", { name: "Dec", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Sept?$/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next year", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Previous year", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Oct", exact: true }).click();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(day(page, "2026-10-09")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Today", exact: true })).toBeVisible();
});

test("popover discards drafts on Escape and outside click, and closes on Apply", async ({ page }) => {
  await open(page, "popover");
  const trigger = page.getByRole("button", { name: "Select date range", exact: true });
  await trigger.click();
  await day(page, "2026-11-03").click();
  await page.getByRole("button", { name: "November 2026", exact: true }).focus();
  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(from(page)).toHaveValue("");
  await day(page, "2026-11-03").click();
  await page.getByTestId("outside").click();
  await trigger.click();
  await expect(from(page)).toHaveValue("");
  await day(page, "2026-11-03").click();
  await apply(page).click();
  await expect(page.locator('[data-slot="date-range-picker"]')).toHaveCount(0);
  await expect(page.getByTestId("applied")).toContainText('"count":1');
});

test("open-ended rules, clear controls and To-only summary", async ({ page }) => {
  await open(page, "required");
  await day(page, "2026-11-03").click();
  await expect(apply(page)).toBeDisabled();
  await day(page, "2026-11-16").click();
  await expect(apply(page)).toBeEnabled();
  await page.getByRole("button", { name: /^clear start date$/i }).click();
  await expect(from(page)).toHaveValue("");
  await expect(to(page)).toHaveValue("16/11/2026");
  await expect(apply(page)).toBeDisabled();
  await expect(page.getByText("On or before 16 Nov 2026")).toBeVisible();
});

test("320px layout and 200% zoom have no inner scrolling or native date inputs", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await open(page, "menu");
  await expect(apply(page)).toBeInViewport();
  for (const monthView of [false, true]) {
    if (monthView) await page.getByRole("button", { name: "November 2026", exact: true }).click();
    const layout = await page.locator('[data-slot="date-range-picker"]').evaluate((root) => ({
      width: root.getBoundingClientRect().width,
      overflow: root.scrollWidth > root.clientWidth,
      scrollers: [...root.querySelectorAll("*")].filter(element =>
        ["auto", "scroll"].includes(getComputedStyle(element).overflowY) &&
        element.scrollHeight > element.clientHeight + 1,
      ).length,
      nativeDates: root.querySelectorAll('input[type="date"]').length,
    }));
    expect(layout.width).toBeLessThanOrEqual(320);
    expect(layout.overflow).toBe(false);
    expect(layout.scrollers).toBe(0);
    expect(layout.nativeDates).toBe(0);
    await page.screenshot({ path: test.info().outputPath(`320-${monthView ? "months" : "days"}.png`), animations: "disabled" });
  }
  await page.setViewportSize({ width: 1280, height: 1800 });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect(apply(page)).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the real multi-filter passes bounds through and returns to presets after Apply", async ({ page }) => {
  await open(page, "menu&integration&max");
  await page.getByRole("menuitem", { name: /custom date range/i }).click();
  await expect(page.locator('input[type="date"]')).toHaveCount(0);
  await expect(day(page, "2026-11-21")).toBeDisabled();
  await from(page).pressSequentially("03112026");
  await from(page).press("Enter");
  await expect(to(page)).toBeFocused();
  await day(page, "2026-11-16").click();
  await expect(page.getByText("14 days", { exact: true })).toBeVisible();
  await apply(page).click();
  await expect(page.getByRole("menuitem", { name: /custom date range/i })).toBeVisible();
  await expect(page.getByTestId("applied")).toContainText('"count":1');
  await page.getByRole("menuitem", { name: /custom date range/i }).click();
  await expect(from(page)).toHaveValue("03/11/2026");
  await expect(to(page)).toHaveValue("16/11/2026");
});

test("hover preview preserves day nodes and editing From clears an earlier To", async ({ page }) => {
  await open(page, "value");
  const firstDay = await day(page, "2026-11-03").elementHandle();
  await day(page, "2026-11-16").hover();
  await expect(page.locator('[data-day="2026-11-12"]')).toHaveClass(/bg-primary\/10/);
  await day(page, "2026-11-18").hover();
  expect(await firstDay!.evaluate((element) => element.isConnected)).toBe(true);
  await from(page).focus();
  await day(page, "2026-11-20").click();
  await expect(from(page)).toHaveValue("20/11/2026");
  await expect(to(page)).toHaveValue("");
  await expect(to(page)).toBeFocused();
});

test("short years stay uncommitted until Enter and yesterday uses a local date", async ({ page }) => {
  await open(page);
  await from(page).fill("1/5/26");
  await expect(page.getByText("Pick a start date", { exact: true })).toBeVisible();
  await from(page).press("Enter");
  await expect(page.getByText("On or after 1 May 2026", { exact: true })).toBeVisible();
  await to(page).fill("yesterday");
  await to(page).press("Enter");
  await expect(to(page)).toHaveValue("19/11/2026");
  await page.getByRole("button", { name: /^clear start date$/i }).click();
  await from(page).fill("031126");
  await from(page).press("Enter");
  await expect(from(page)).toHaveValue("03/11/2026");
});

test("a constrained popover keeps Apply visible without a nested panel scroller", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 360 });
  await open(page, "popover");
  await page.getByRole("button", { name: "Select date range", exact: true }).click();
  await expect(apply(page)).toBeInViewport({ ratio: 1 });
  const panel = page.locator('[data-slot="date-range-picker"]');
  await expect(panel).not.toHaveCSS("overflow-y", "auto");
  await from(page).fill("03/11/2026");
  await apply(page).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByTestId("applied")).toContainText('"count":1');
});

test("blank input cannot apply and clearing one edge preserves the other field's error", async ({ page }) => {
  await open(page);
  await from(page).fill("   ");
  await expect(apply(page)).toBeDisabled();
  await from(page).fill("03/11/2026");
  await to(page).fill("16/11/2026");
  await from(page).fill("31/02/2026");
  await page.getByRole("button", { name: /^clear end date$/i }).click();
  await expect(from(page)).toHaveValue("31/02/2026");
  await expect(from(page)).toHaveAttribute("aria-invalid", "true");
  await expect(apply(page)).toBeDisabled();
});

test("summary includes both years only across years and uses inclusive counts", async ({ page }) => {
  await open(page);
  await from(page).fill("31/12/2026");
  await to(page).fill("02/01/2027");
  await expect(page.getByText("31 Dec 2026 – 2 Jan 2027", { exact: true })).toBeVisible();
  await expect(page.getByText("3 days", { exact: true })).toBeVisible();
  await from(page).fill("01/01/2027");
  await expect(page.getByText("1 Jan – 2 Jan 2027", { exact: true })).toBeVisible();
});

test("range text stays readable in both themes and month buttons mark today and the range", async ({ page }) => {
  await open(page, "value");
  const middle = page.locator(".day-range-middle button").first();
  const endpoint = page.locator(".day-range-start button").first();
  for (const dark of [false, true]) {
    await page.evaluate((enabled) => {
      document.documentElement.classList.toggle("dark", enabled);
    }, dark);
    const colors = await middle.evaluate((button) => {
      const reference = document.createElement("span");
      reference.className = "text-foreground";
      button.parentElement!.append(reference);
      const result = {
        actual: getComputedStyle(button).color,
        expected: getComputedStyle(reference).color,
      };
      reference.remove();
      return result;
    });
    expect(colors.actual).toBe(colors.expected);
    await expect(middle).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(endpoint).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  }
  await page.getByRole("button", { name: "Previous month", exact: true }).click();
  await page.getByRole("button", { name: "October 2026", exact: true }).click();
  const november = page.getByRole("button", { name: "Nov", exact: true });
  await expect(november).toHaveAttribute("data-variant", "outline");
  await expect(november.locator('span[aria-hidden="true"]')).toHaveCount(1);
});

test("a populated popover starts on To rather than letting autofocus select From", async ({ page }) => {
  await open(page, "popover&value");
  await page.getByRole("button", { name: "9 Nov – 19 Nov 2026", exact: true }).click();
  await day(page, "2026-11-16").click();
  await expect(from(page)).toHaveValue("09/11/2026");
  await expect(to(page)).toHaveValue("16/11/2026");
});

test("arrow keys select and edit date segments, clamping month and leap-year ends", async ({ page }) => {
  await open(page);
  const input = from(page);
  await input.fill("31/01/2024");
  await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(0, 2));
  await input.press("ArrowRight");
  expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([3, 5]);
  await input.press("ArrowUp");
  await expect(input).toHaveValue("29/02/2024");
  await input.press("ArrowRight");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("28/02/2025");
  await input.press("ArrowLeft");
  await input.press("ArrowLeft");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("27/02/2025");
});

test("selected segments accept numeric replacement and advance to the next segment", async ({ page }) => {
  await open(page);
  const input = from(page);
  await input.fill("09/11/2026");
  await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(0, 2));
  await input.pressSequentially("16052027");
  await expect(input).toHaveValue("16/05/2027");
  expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([6, 10]);
  await input.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await input.pressSequentially("03112026");
  await expect(input).toHaveValue("03/11/2026");
});

test("T commits today immediately and Escape clears only the focused edge without dismissing", async ({ page }) => {
  await open(page, "menu&value");
  await to(page).focus();
  await to(page).press("T");
  await expect(to(page)).toHaveValue("20/11/2026");
  await to(page).press("Escape");
  await expect(to(page)).toHaveValue("");
  await expect(from(page)).toHaveValue("09/11/2026");
  await expect(to(page)).toBeFocused();
  await expect(apply(page)).toBeVisible();
});

test("embedded calendars share the field value and honor bounds inside the parent menu", async ({ page }) => {
  await open(page, "menu&min&max");
  await page.getByRole("button", { name: /select date.*start date/i }).click();
  const popup = page.locator('[data-slot="popover-content"]');
  await expect(popup).toBeVisible();
  await expect(popup.locator('[data-day="2026-11-21"] button')).toBeDisabled();
  await popup.locator('[data-day="2026-11-03"] button').click();
  await expect(popup).toHaveCount(0);
  await expect(from(page)).toHaveValue("03/11/2026");
  await page.getByRole("button", { name: /select date.*end date/i }).click();
  await popup.locator('[data-day="2026-11-16"] button').click();
  await expect(to(page)).toHaveValue("16/11/2026");
  await expect(page.getByText("14 days", { exact: true })).toBeVisible();
  await expect(page.getByTestId("applied")).toContainText('"count":0');
});

test("Escape dismisses only the embedded calendar and returns focus to its button", async ({ page }) => {
  await open(page, "popover&value");
  await page.getByRole("button", { name: "9 Nov – 19 Nov 2026", exact: true }).click();
  const calendarButton = page.getByRole("button", { name: /select date.*end date/i });
  await calendarButton.click();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(1);
  await expect(calendarButton).toBeFocused();
  await expect(to(page)).toHaveValue("19/11/2026");
});

test("shared CARE input and button sizes are retained at mobile and desktop widths", async ({ page }) => {
  for (const [width, height] of [[320, 48], [1280, 40]]) {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    await expect(page.locator('[data-slot="input-group"]').first()).toHaveCSS("height", `${height}px`);
    await expect(apply(page)).toHaveCSS("height", "36px");
    const caption = page.getByRole("button", { name: "November 2026", exact: true });
    await expect(caption).toHaveAttribute("data-variant", "ghost");
    await expect(caption).toHaveCSS("height", "36px");
    const next = page.getByRole("button", { name: "Next month", exact: true });
    await expect(next).toHaveAttribute("data-size", "icon-sm");
    await expect(next).toHaveCSS("width", "36px");
  }
});

test("segment stepping validates bounds and an empty field can start with the arrow keys", async ({ page }) => {
  await open(page, "max");
  await from(page).focus();
  await from(page).press("ArrowDown");
  await expect(from(page)).toHaveValue("19/11/2026");
  await from(page).press("ArrowUp");
  await expect(from(page)).toHaveValue("20/11/2026");
  await from(page).press("ArrowUp");
  await expect(from(page)).toHaveValue("21/11/2026");
  await expect(from(page)).toHaveAttribute("aria-invalid", "true");
  await expect(apply(page)).toBeDisabled();
});

test("populated fields and their embedded calendar fit a 320px surface", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 680 });
  await open(page, "menu&integration&value");
  await page.getByRole("menuitem", { name: /custom date range/i }).click();
  await page.getByTestId("outside").evaluate((element) => { element.style.display = "none"; });
  await page.getByTestId("applied").evaluate((element) => { element.style.display = "none"; });
  await expect(apply(page)).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: test.info().outputPath("after-320.png"), animations: "disabled" });
  await page.getByRole("button", { name: /select date.*end date/i }).click();
  const popup = page.locator('[data-slot="popover-content"]');
  await expect(popup).toBeInViewport({ ratio: 1 });
  const overflows = await popup.evaluate((element) => element.scrollWidth > element.clientWidth);
  expect(overflows).toBe(false);
  await page.screenshot({ path: test.info().outputPath("embedded-320.png"), animations: "disabled" });
});
