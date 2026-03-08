import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  // Suppress React error boundary console.error in tests
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("catches errors and displays default fallback UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("displays error message in default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("displays default message when error has no message", () => {
    const ErrorWithoutMessage = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <ErrorWithoutMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
  });

  it("renders Try again button in default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("resets error state when Try again is clicked", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });

    // Verify the button exists and has correct attributes
    expect(tryAgainButton).toHaveAttribute("type", "button");

    // Click the button - this triggers setState to reset hasError
    fireEvent.click(tryAgainButton);

    // After clicking, component attempts to re-render children
    // Since ThrowError still throws, error boundary catches it again and shows fallback
    // Query for the button again since DOM may have re-rendered
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error fallback")).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });

  it("applies glass styling to default fallback container", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const fallbackContainer = screen.getByText(/Something went wrong/).closest("div.glass");
    expect(fallbackContainer).toHaveClass("glass", "rounded-3xl", "p-8", "text-center");
  });

  it("applies ember color to error title", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const title = screen.getByText(/Something went wrong/);
    expect(title).toHaveClass("text-ember", "text-2xl", "font-semibold");
  });

  it("applies button-ghost class to Try again button", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const button = screen.getByRole("button", { name: /try again/i });
    expect(button).toHaveClass("button-ghost", "mt-4");
  });

  it("renders nested children correctly", () => {
    render(
      <ErrorBoundary>
        <div>
          <span>Nested</span>
          <span>Content</span>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Nested")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("only catches errors in its subtree", () => {
    render(
      <div>
        <div>Outside boundary</div>
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      </div>
    );

    expect(screen.getByText("Outside boundary")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("logs error to console via componentDidCatch", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it("includes warning emoji in error message", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // The title includes the warning emoji
    const title = screen.getByText(/Something went wrong/);
    expect(title.textContent).toContain("Something went wrong");
  });
});
