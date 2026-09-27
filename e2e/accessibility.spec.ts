import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every public, non-marketplace route. Marketplace is intentionally excluded:
// its ownership/auth model is being reworked in a parallel change, so it is
// out of scope here.
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/events",
  "/locations",
  "/planner",
  "/privacy"
];

for (const route of PUBLIC_ROUTES) {
  test(`${route || "/"} has no WCAG 2.1/2.2 A/AA violations`, async ({ page }) => {
    await page.goto(route);
    // Let client-side data fetches (sky conditions, events, map) settle so
    // the scan covers the real, populated UI rather than a loading state.
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });
}
