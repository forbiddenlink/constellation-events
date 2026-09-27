import { test, expect } from "@playwright/test";

// Regression test for the hydration mismatch fixed by the shared <LocalTime>
// component. Must run against a PRODUCTION build (see
// playwright.hydration.config.ts) — dev mode masks hydration warnings.
//
// A viewer in Pacific/Auckland (UTC+12/+13) with a de-DE locale is about as
// far from a Vercel server's UTC/en-US render as a real visitor gets, so any
// leftover direct `.toLocaleDateString`/`.toLocaleTimeString` call in a
// render body will disagree between server and client here and make React
// throw a hydration error.
test.describe("hydration: viewer-local time rendering", () => {
  test("homepage has zero hydration errors in Auckland/de-DE", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hydrationIssues = consoleErrors.filter((text) =>
      /hydration|did not match|server rendered|text content does not match/i.test(text)
    );
    expect(hydrationIssues, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("TonightAtGlance renders the Auckland-local generatedAt time", async ({ page, request }) => {
    const apiResponse = await request.get("/api/sky/tonight");
    expect(apiResponse.ok()).toBeTruthy();
    const payload = await apiResponse.json();
    const generatedAt: string = payload.generatedAt;

    const expected = new Intl.DateTimeFormat("de-DE", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Pacific/Auckland"
    }).format(new Date(generatedAt));

    await page.goto("/");

    // Scope to the "Updated <time>" label inside TonightAtGlance specifically,
    // since other components on the homepage also render <time> elements.
    const updatedLabel = page.locator("span", { hasText: /^Updated/ }).locator("time");
    await expect(updatedLabel).toHaveText(expected, { timeout: 10_000 });
  });
});
