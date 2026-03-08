import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders with default message", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<LoadingSpinner message="Fetching sky data..." />);
    expect(screen.getByText("Fetching sky data...")).toBeInTheDocument();
  });

  it("hides message when empty string provided", () => {
    render(<LoadingSpinner message="" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("applies small size classes", () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-4", "w-4");
  });

  it("applies medium size classes by default", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-8", "w-8");
  });

  it("applies large size classes", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("h-12", "w-12");
  });

  it("has spinning animation", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("rounded-full", "border-aurora");
  });
});
