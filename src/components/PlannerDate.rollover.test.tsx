import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import PlannerDate from "./PlannerDate";
afterEach(() => { cleanup(); vi.useRealTimers(); });
const formatted = (date: Date) => `Tonight, ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
describe("planner date while mounted", () => {
  it("refreshes at local midnight without a parent rerender", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));
    const { container, unmount } = render(<PlannerDate />);
    act(() => { vi.advanceTimersByTime(1002); });
    expect(container.textContent).toBe(formatted(new Date(2027, 0, 1)));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("refreshes after a suspended tab resumes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 7, 20));
    const { container } = render(<PlannerDate />);
    act(() => {
      vi.setSystemTime(new Date(2026, 2, 9, 9));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(container.textContent).toBe(formatted(new Date(2026, 2, 9)));
  });
});
