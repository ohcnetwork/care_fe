import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const assets = new Map<
  string,
  { body: string | Buffer; contentType: string }
>();

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
    if (!("output" in bundle))
      throw new Error("Expected an in-memory Vite build");
    for (const file of bundle.output) {
      assets.set(`/__date-range-test/${file.fileName}`, {
        body: file.type === "chunk" ? file.code : Buffer.from(file.source),
        contentType: file.fileName.endsWith(".html")
          ? "text/html"
          : file.fileName.endsWith(".css")
            ? "text/css"
            : "application/javascript",
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
const from = (page: Page) =>
  page.getByRole("textbox", { name: /^start date$/i });
const to = (page: Page) => page.getByRole("textbox", { name: /^end date$/i });
const apply = (page: Page) =>
  page.getByRole("button", { name: "Apply", exact: true });

test("first click registers, active end can be corrected, and range count is inclusive", async ({
  page,
}) => {
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

test("shortcuts and Enter move focus and apply exactly once inside a menu", async ({
  page,
}) => {
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

test("invalid dates never commit, bounds show inline errors, and a typed reversed range swaps", async ({
  page,
}) => {
  await open(page, "min&max");
  await from(page).fill("31/02/2026");
  await from(page).press("Tab");
  await expect(from(page)).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("Enter a valid date as DD/MM/YYYY"),
  ).toBeVisible();
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

test("mask respects short hand-written dates and supports all accepted formats", async ({
  page,
}) => {
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

test("bounds disable unavailable years, year pages, months and days", async ({
  page,
}) => {
  await open(page, "min&max");
  await expect(day(page, "2026-11-21")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Next month", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Nov 2026", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "2025", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "2027", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /^Previous:/i }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Next:/i })).toBeDisabled();
  await page.getByRole("button", { name: "2026", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Dec", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Sept?$/ })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Next year", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Previous year", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Oct", exact: true }).click();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(day(page, "2026-10-09")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Today", exact: true }),
  ).toBeVisible();
});

test("year pages and month selection navigate without editing the draft", async ({
  page,
}) => {
  await open(page, "menu&value");
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: true });
  await button("Nov 2026").press("Enter");
  await expect(button("2026")).toBeFocused();
  await button(/^Next:/i).click();
  await expect(button("2044")).toBeVisible();
  await button(/^Previous:/i).click();
  await button("2032").press("Enter");
  await expect(button("Jan")).toBeFocused();
  await button("Dec").press("Enter");
  await expect(button("Dec 2032")).toBeFocused();
  await button("Next month").click();
  await expect(day(page, "2033-01-15")).toBeVisible();
  await button("Previous month").click();
  await expect(day(page, "2032-12-15")).toBeVisible();
  await expect(from(page)).toHaveValue("09/11/2026");
  await expect(to(page)).toHaveValue("19/11/2026");
  await expect(page.getByTestId("applied")).toContainText('"count":0');
  await day(page, "2032-12-15").click();
  await day(page, "2032-12-20").click();
  await apply(page).click();
  await expect(page.getByTestId("applied")).toContainText(
    '"from":"2032-12-15"',
  );
  await expect(page.getByTestId("applied")).toContainText('"to":"2032-12-20"');
});

test("popover: Escape discards drafts, dismissing keeps applicable drafts", async ({
  page,
}) => {
  await open(page, "popover&required");
  const trigger = page.getByRole("button", {
    name: "Select date range",
    exact: true,
  });
  await trigger.click();
  await day(page, "2026-11-03").click();
  await day(page, "2026-11-16").click();
  await page.getByRole("button", { name: "Nov 2026", exact: true }).focus();
  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(from(page)).toHaveValue("");

  // A draft Apply would reject (missing End) is discarded silently.
  await day(page, "2026-11-03").click();
  await page.getByTestId("outside").click();
  await expect(from(page)).toBeHidden();
  await trigger.click();
  await expect(from(page)).toHaveValue("");
  await expect(page.getByTestId("applied")).toContainText('"count":0');

  await day(page, "2026-11-16").click();
  await day(page, "2026-11-03").click();
  // Apply is enabled by this click, so focus moves after it renders.
  await expect(apply(page)).toBeFocused();
  await page.getByTestId("outside").click();
  await expect(from(page)).toBeHidden();
  await expect(page.getByTestId("applied")).toContainText(
    '{"from":"2026-11-03","to":"2026-11-16","count":1}',
  );

  // Reopening and dismissing without edits applies nothing.
  const filled = page.getByRole("button", {
    name: "3 Nov – 16 Nov 2026",
    exact: true,
  });
  await filled.click();
  await expect(from(page)).toHaveValue("03/11/2026");
  await filled.click();
  await expect(from(page)).toBeHidden();
  await expect(page.getByTestId("applied")).toContainText('"count":1');

  await filled.click();
  await to(page).fill("20/11/2026");
  await apply(page).click();
  await expect(page.locator('[data-slot="date-range-picker"]')).toHaveCount(0);
  await expect(page.getByTestId("applied")).toContainText(
    '{"from":"2026-11-03","to":"2026-11-20","count":2}',
  );
});

test("closing an open-ended picker applies only complete ranges", async ({
  page,
}) => {
  await open(page, "popover");
  const trigger = page.getByRole("button", {
    name: "Select date range",
    exact: true,
  });
  await trigger.click();
  await day(page, "2026-11-03").click();
  await expect(apply(page)).toBeEnabled();
  await page.getByTestId("outside").click();
  await expect(from(page)).toBeHidden();
  await expect(page.getByTestId("applied")).toContainText('"count":0');

  await trigger.click();
  await day(page, "2026-11-03").click();
  await day(page, "2026-11-16").click();
  await page.getByTestId("outside").click();
  await expect(page.getByTestId("applied")).toContainText(
    '{"from":"2026-11-03","to":"2026-11-16","count":1}',
  );
});

test("open-ended rules, clear controls and To-only summary", async ({
  page,
}) => {
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

test("320px layout and 200% zoom have no inner scrolling or native date inputs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await open(page, "menu");
  await expect(apply(page)).toBeInViewport();
  for (const view of ["days", "years", "months"]) {
    if (view === "years")
      await page.getByRole("button", { name: "Nov 2026", exact: true }).click();
    if (view === "months")
      await page.getByRole("button", { name: "2026", exact: true }).click();
    const layout = await page
      .locator('[data-slot="date-range-picker"]')
      .evaluate((root) => ({
        width: root.getBoundingClientRect().width,
        overflow: root.scrollWidth > root.clientWidth,
        scrollers: [...root.querySelectorAll("*")].filter(
          (element) =>
            ["auto", "scroll"].includes(getComputedStyle(element).overflowY) &&
            element.scrollHeight > element.clientHeight + 1,
        ).length,
        nativeDates: root.querySelectorAll('input[type="date"]').length,
      }));
    expect(layout.width).toBeLessThanOrEqual(320);
    expect(layout.overflow).toBe(false);
    expect(layout.scrollers).toBe(0);
    expect(layout.nativeDates).toBe(0);
    await page.screenshot({
      path: test.info().outputPath(`320-${view}.png`),
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1280, height: 1800 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(apply(page)).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("date presets fit without scrolling on a desktop and still apply", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "menu&integration");
  const menu = page.locator('[data-slot="dropdown-menu-content"]');
  const options = menu.getByRole("menuitem");
  await expect(options).toHaveCount(9);
  for (const option of await options.all()) {
    await expect(option).toBeInViewport({ ratio: 1 });
  }
  await expect(page.getByText("Navigate", { exact: true })).toBeVisible();
  expect(
    await menu.evaluate(
      (element) => element.scrollHeight <= element.clientHeight + 1,
    ),
  ).toBe(true);
  await page.getByRole("menuitem", { name: "Today", exact: true }).click();
  await expect(page.getByTestId("applied")).toContainText(
    '"from":"2026-11-20"',
  );
  await expect(page.getByTestId("applied")).toContainText('"count":1');
});

test("the applied preset is marked with a check and footer hints use Kbd", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "menu&integration&value");
  const menu = page.locator('[data-slot="dropdown-menu-content"]');
  const custom = page.getByRole("menuitem", { name: /custom date range/i });
  await expect(menu.locator("[aria-current]")).toHaveCount(1);
  await expect(custom).toHaveAttribute("aria-current", "true");
  await expect(custom.locator("svg.lucide-check")).toHaveCount(1);
  await expect(custom).toHaveCSS("border-top-width", "0px");
  await expect(menu.locator('kbd[data-slot="kbd"]')).toHaveCount(4);
  await page.getByRole("menuitem", { name: "Today", exact: true }).click();
  const today = page.getByRole("menuitem", { name: "Today", exact: true });
  await expect(today).toHaveAttribute("aria-current", "true");
  await expect(custom).not.toHaveAttribute("aria-current");
  await expect(menu.locator("svg.lucide-check")).toHaveCount(1);
});

test("short screens use one menu scroller and keyboard navigation reaches custom range", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 360 });
  await open(page, "menu&integration");
  const menu = page.locator('[data-slot="dropdown-menu-content"]');
  const scrollers = await menu.evaluate(
    (root) =>
      [root, ...root.querySelectorAll("*")].filter(
        (element) =>
          ["auto", "scroll"].includes(getComputedStyle(element).overflowY) &&
          element.scrollHeight > element.clientHeight + 1,
      ).length,
  );
  expect(scrollers).toBe(1);
  const custom = page.getByRole("menuitem", { name: /custom date range/i });
  await page.getByRole("menuitem", { name: "Today", exact: true }).focus();
  await page.keyboard.press("ArrowUp");
  await expect(custom).toBeFocused();
  await expect(custom).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("Enter");
  await expect(from(page)).toBeFocused();
});

test("Custom date range opens on the start date with a standard back button", async ({
  page,
}) => {
  for (const [width, size] of [
    [320, 48],
    [1280, 40],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "menu&integration&value");
    await page.getByRole("menuitem", { name: /custom date range/i }).click();
    await expect(from(page)).toBeFocused();
    const back = page.getByRole("button", { name: "Back", exact: true });
    await expect(back).toHaveAttribute("data-size", "icon");
    await expect(back).toHaveCSS("width", `${size}px`);
    await expect(back).toHaveCSS("height", `${size}px`);
    await back.click();
    await expect(
      page.getByRole("menuitem", { name: /custom date range/i }),
    ).toBeVisible();
  }
});

test("clearing End on a reopened range keeps the calendar in sync and picks a new End", async ({
  page,
}) => {
  const selected = (date: string) =>
    page.locator(`[data-day="${date}"][data-selected="true"]`);
  await open(page, "menu&integration&value");
  await page.getByRole("menuitem", { name: /custom date range/i }).click();
  await expect(from(page)).toBeFocused();
  await page.getByRole("button", { name: /^clear end date$/i }).click();
  await expect(to(page)).toHaveValue("");
  await expect(to(page)).toBeFocused();
  await expect(page.getByText("On or after 9 Nov 2026")).toBeVisible();
  await expect(selected("2026-11-19")).toHaveCount(0);
  await day(page, "2026-11-05").click();
  await expect(from(page)).toHaveValue("05/11/2026");
  await expect(to(page)).toHaveValue("09/11/2026");
  await expect(apply(page)).toBeFocused();
  await expect(selected("2026-11-07")).toHaveCount(1);
  await expect(selected("2026-11-12")).toHaveCount(0);
  await page.getByRole("button", { name: /^clear end date$/i }).click();
  await day(page, "2026-11-12").click();
  await expect(from(page)).toHaveValue("05/11/2026");
  await expect(to(page)).toHaveValue("12/11/2026");
  await from(page).fill("10/11/2026");
  await expect(selected("2026-11-07")).toHaveCount(0);
  await expect(selected("2026-11-11")).toHaveCount(1);
  await apply(page).click();
  await expect(page.getByTestId("applied")).toContainText(
    '"from":"2026-11-10"',
  );
  await expect(page.getByTestId("applied")).toContainText('"to":"2026-11-12"');
});

test("re-picking a range in another month keeps that month in view", async ({
  page,
}) => {
  await open(page, "value");
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  await day(page, "2026-10-20").click();
  await expect(to(page)).toBeFocused();
  await expect(to(page)).toHaveValue("19/11/2026");
  // Blurring the unchanged End must not jump the calendar back to November.
  await day(page, "2026-10-25").click();
  await expect(from(page)).toHaveValue("20/10/2026");
  await expect(to(page)).toHaveValue("25/10/2026");
  await expect(apply(page)).toBeFocused();
});

test("the real multi-filter passes bounds through and returns to presets after Apply", async ({
  page,
}) => {
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
  await expect(
    page.getByRole("menuitem", { name: /custom date range/i }),
  ).toBeVisible();
  await expect(page.getByTestId("applied")).toContainText('"count":1');
  await page.getByRole("menuitem", { name: /custom date range/i }).click();
  await expect(from(page)).toHaveValue("03/11/2026");
  await expect(to(page)).toHaveValue("16/11/2026");
});

test("hover preview preserves day nodes and editing From clears an earlier To", async ({
  page,
}) => {
  await open(page, "value");
  const firstDay = await day(page, "2026-11-03").elementHandle();
  await to(page).focus();
  await day(page, "2026-11-16").hover();
  await expect(page.locator('[data-day="2026-11-12"]')).toHaveClass(
    /bg-primary\/10/,
  );
  await day(page, "2026-11-18").hover();
  expect(await firstDay!.evaluate((element) => element.isConnected)).toBe(true);
  await from(page).focus();
  await day(page, "2026-11-20").click();
  await expect(from(page)).toHaveValue("20/11/2026");
  await expect(to(page)).toHaveValue("");
  await expect(to(page)).toBeFocused();
});

test("short years stay uncommitted until Enter and yesterday uses a local date", async ({
  page,
}) => {
  await open(page);
  await from(page).fill("1/5/26");
  await expect(
    page.getByText("Pick a start date", { exact: true }),
  ).toBeVisible();
  await from(page).press("Enter");
  await expect(
    page.getByText("On or after 1 May 2026", { exact: true }),
  ).toBeVisible();
  await to(page).fill("yesterday");
  await to(page).press("Enter");
  await expect(to(page)).toHaveValue("19/11/2026");
  await page.getByRole("button", { name: /^clear start date$/i }).click();
  await from(page).fill("031126");
  await from(page).press("Enter");
  await expect(from(page)).toHaveValue("03/11/2026");
});

test("a constrained popover keeps Apply visible without a nested panel scroller", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 360 });
  await open(page, "popover");
  await page
    .getByRole("button", { name: "Select date range", exact: true })
    .click();
  await expect(apply(page)).toBeInViewport({ ratio: 1 });
  const panel = page.locator('[data-slot="date-range-picker"]');
  await expect(panel).not.toHaveCSS("overflow-y", "auto");
  await from(page).fill("03/11/2026");
  await apply(page).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByTestId("applied")).toContainText('"count":1');
});

test("blank input cannot apply and clearing one edge preserves the other field's error", async ({
  page,
}) => {
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

test("summary includes both years only across years and uses inclusive counts", async ({
  page,
}) => {
  await open(page);
  await from(page).fill("31/12/2026");
  await to(page).fill("02/01/2027");
  await expect(
    page.getByText("31 Dec 2026 – 2 Jan 2027", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("3 days", { exact: true })).toBeVisible();
  await from(page).fill("01/01/2027");
  await expect(
    page.getByText("1 Jan – 2 Jan 2027", { exact: true }),
  ).toBeVisible();
});

test("range text stays readable in both themes and month buttons mark today and the range", async ({
  page,
}) => {
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
    await expect(endpoint).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  }
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  await page.getByRole("button", { name: "Oct 2026", exact: true }).click();
  await page.getByRole("button", { name: "2026", exact: true }).click();
  const november = page.getByRole("button", { name: "Nov", exact: true });
  await expect(november).toHaveAttribute("data-variant", "outline");
  await expect(november.locator('span[aria-hidden="true"]')).toHaveCount(1);
});

test("a populated popover opens on the start date", async ({ page }) => {
  await open(page, "popover&value");
  await page
    .getByRole("button", { name: "9 Nov – 19 Nov 2026", exact: true })
    .click();
  await expect(from(page)).toBeFocused();
  await day(page, "2026-11-16").click();
  await expect(from(page)).toHaveValue("16/11/2026");
  await expect(to(page)).toHaveValue("19/11/2026");
});

test("focusing a date field shows that date's month", async ({ page }) => {
  const caption = (name: string) =>
    page.getByRole("button", { name, exact: true });
  await open(page, "popover&value");
  await page
    .getByRole("button", { name: "9 Nov – 19 Nov 2026", exact: true })
    .click();
  await from(page).fill("20/10/2026");
  await apply(page).click();
  await page
    .getByRole("button", { name: "20 Oct – 19 Nov 2026", exact: true })
    .click();
  await expect(from(page)).toBeFocused();
  await expect(caption("Oct 2026")).toBeVisible();
  await to(page).click();
  await expect(caption("Nov 2026")).toBeVisible();
  await from(page).click();
  await expect(caption("Oct 2026")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(to(page)).toBeFocused();
  await expect(caption("Nov 2026")).toBeVisible();
  await day(page, "2026-11-12").click();
  await expect(from(page)).toHaveValue("20/10/2026");
  await expect(to(page)).toHaveValue("12/11/2026");
});

test("arrow keys select and edit date segments, clamping month and leap-year ends", async ({
  page,
}) => {
  await open(page);
  const input = from(page);
  await input.fill("31/01/2024");
  await input.evaluate((element: HTMLInputElement) =>
    element.setSelectionRange(0, 2),
  );
  await input.press("ArrowRight");
  expect(
    await input.evaluate((element: HTMLInputElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([3, 5]);
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

test("selected segments accept numeric replacement and advance to the next segment", async ({
  page,
}) => {
  await open(page);
  const input = from(page);
  await input.fill("09/11/2026");
  await input.evaluate((element: HTMLInputElement) =>
    element.setSelectionRange(0, 2),
  );
  await input.pressSequentially("16052027");
  await expect(input).toHaveValue("16/05/2027");
  expect(
    await input.evaluate((element: HTMLInputElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([6, 10]);
  await input.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await input.pressSequentially("03112026");
  await expect(input).toHaveValue("03/11/2026");
});

test("T commits today immediately and Escape clears only the focused edge without dismissing", async ({
  page,
}) => {
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

test("shared CARE input and button sizes are retained at mobile and desktop widths", async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 48],
    [1280, 40],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    await expect(page.locator('[data-slot="input-group"]').first()).toHaveCSS(
      "height",
      `${height}px`,
    );
    await expect(apply(page)).toHaveAttribute("data-size", "default");
    await expect(apply(page)).toHaveCSS("height", `${height}px`);
    const caption = page.getByRole("button", {
      name: "Nov 2026",
      exact: true,
    });
    await expect(caption).toHaveAttribute("data-variant", "ghost");
    await expect(caption).toHaveCSS("height", `${height}px`);
    const next = page.getByRole("button", { name: "Next month", exact: true });
    await expect(next).toHaveAttribute("data-size", "icon");
    await expect(next).toHaveCSS("width", `${height}px`);
    await expect(next).toHaveCSS("height", `${height}px`);
    await caption.click();
    const calendar = page.locator('[id$="-calendar"]');
    // Three year rows and four month rows, with only the standard gaps and padding.
    expect((await calendar.boundingBox())!.height).toBeLessThanOrEqual(
      3 * (height + 8),
    );
    await page.getByRole("button", { name: "2026", exact: true }).click();
    expect((await calendar.boundingBox())!.height).toBeLessThanOrEqual(
      4 * (height + 8),
    );
    const nextYear = page.getByRole("button", {
      name: "Next year",
      exact: true,
    });
    await expect(nextYear).toHaveCSS("width", `${height}px`);
    await expect(nextYear).toHaveCSS("height", `${height}px`);
    await expect(
      page.getByRole("button", { name: "Nov", exact: true }),
    ).toHaveCSS("height", `${height}px`);

    await open(page, "popover");
    const trigger = page.getByRole("button", {
      name: "Select date range",
      exact: true,
    });
    await expect(trigger).toHaveAttribute("data-slot", "popover-trigger");
    await expect(trigger).toHaveAttribute("type", "button");
    await expect(trigger).toHaveCSS("height", `${height}px`);
  }
});

test("the short month caption fits beside Today without clipping", async ({
  page,
}) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const next = page.getByRole("button", { name: "Next month", exact: true });
    await next.click();
    await expect(
      page.getByRole("button", { name: "Dec 2026", exact: true }),
    ).toBeVisible();
    for (let index = 0; index < 12; index++) {
      await expect(
        page.getByRole("button", { name: "Today", exact: true }),
      ).toBeVisible();
      const clipped = await page
        .locator('[aria-controls$="-calendar"] span > span')
        .evaluateAll((parts) =>
          parts.some((part) => part.scrollWidth > part.clientWidth),
        );
      expect(clipped).toBe(false);
      await next.click();
    }
  }
});

test("segment stepping validates bounds and an empty field can start with the arrow keys", async ({
  page,
}) => {
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

test("populated date fields fit, with side-by-side desktop fields and only clear buttons", async ({
  page,
}) => {
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "menu&integration&value");
    await page.getByRole("menuitem", { name: /custom date range/i }).click();
    const first = await from(page).boundingBox();
    const second = await to(page).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (width >= 768) {
      expect(first!.y).toBeCloseTo(second!.y, 0);
      expect(first!.x + first!.width).toBeLessThanOrEqual(second!.x);
    } else {
      expect(second!.y).toBeGreaterThan(first!.y);
    }
    for (const input of [from(page), to(page)]) {
      const fits = await input.evaluate((element: HTMLInputElement) => {
        const style = getComputedStyle(element);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        return (
          context.measureText(element.value).width <=
          element.clientWidth -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight)
        );
      });
      expect(fits).toBe(true);
    }
    await expect(
      page.getByRole("button", { name: /select date.*(start|end) date/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^clear start date$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^clear end date$/i }),
    ).toBeVisible();
    await page.getByTestId("outside").evaluate((element) => {
      element.style.display = "none";
    });
    await page.getByTestId("applied").evaluate((element) => {
      element.style.display = "none";
    });
    await expect(apply(page)).toBeInViewport({ ratio: 1 });
    await page.mouse.move(width - 1, 850);
    await page.locator('[data-slot="dropdown-menu-content"]').screenshot({
      path: test.info().outputPath(`after-${width}.png`),
      animations: "disabled",
    });
    if (width === 1280) {
      await page
        .locator('[data-slot="date-range-picker"]')
        .evaluate((element) => {
          (element as HTMLElement).style.width = "220px";
        });
      const narrowFrom = await from(page).boundingBox();
      const narrowTo = await to(page).boundingBox();
      expect(narrowTo!.y).toBeGreaterThan(narrowFrom!.y);
    }
  }
});
