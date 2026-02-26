import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads and displays key elements", async ({ page }) => {
    await page.goto("/");

    // Check header is visible (use first to handle layout + page headers)
    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.getByText("Constellation")).toBeVisible();

    // Check navigation links exist
    await expect(page.getByRole("link", { name: "Tonight", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Events", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dark-Sky", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Planner", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Marketplace", exact: true })).toBeVisible();

    // Check footer is visible
    await expect(page.locator("footer")).toBeVisible();
  });

  test("events page loads", async ({ page }) => {
    await page.goto("/events");

    await expect(page.getByText("Celestial calendar")).toBeVisible();
    await expect(page.getByText("Filters")).toBeVisible();
  });

  test("locations page loads", async ({ page }) => {
    await page.goto("/locations");

    await expect(page.getByText("Light pollution intelligence")).toBeVisible();
  });

  test("planner page loads", async ({ page }) => {
    await page.goto("/planner");

    await expect(page.getByText("Build your stargazing itinerary")).toBeVisible();
  });

  test("marketplace page loads", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(page.getByText("Curated telescope marketplace")).toBeVisible();
  });

  test("navigation works correctly", async ({ page }) => {
    await page.goto("/");

    // Navigate to Events
    await page.getByRole("link", { name: "Events", exact: true }).click();
    await expect(page).toHaveURL("/events");

    // Navigate to Locations
    await page.getByRole("link", { name: "Dark-Sky", exact: true }).click();
    await expect(page).toHaveURL("/locations");

    // Navigate back home
    await page.getByRole("link", { name: "Tonight", exact: true }).click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("API Health Checks", () => {
  test("events API returns data", async ({ request }) => {
    const response = await request.get("/api/events");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.events).toBeDefined();
    expect(Array.isArray(data.events)).toBeTruthy();
  });

  test("locations API returns data", async ({ request }) => {
    const response = await request.get("/api/locations");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.locations).toBeDefined();
    expect(Array.isArray(data.locations)).toBeTruthy();
  });

  test("marketplace API returns data", async ({ request }) => {
    const response = await request.get("/api/marketplace");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.listings).toBeDefined();
    expect(Array.isArray(data.listings)).toBeTruthy();
  });

  test("weather API returns data", async ({ request }) => {
    const response = await request.get("/api/weather/sky-quality?lat=36.1147&lng=-115.1728");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.quality).toBeDefined();
    expect(typeof data.quality).toBe("number");
  });

  test("aurora API returns forecast data", async ({ request }) => {
    const response = await request.get("/api/aurora?lat=45");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.current).toBeDefined();
    expect(typeof data.current.kp).toBe("number");
    expect(data.visibility).toBeDefined();
    expect(data.source).toBeDefined();
  });
});
