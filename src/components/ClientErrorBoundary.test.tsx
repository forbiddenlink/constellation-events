import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClientErrorBoundary from "./ClientErrorBoundary";

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

// Component that can be controlled to throw
function ControlledError({ error }: { error: Error | null }) {
  if (error) {
    throw error;
  }
  return <div>Content rendered successfully</div>;
}

describe("ClientErrorBoundary", () => {
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
      <ClientErrorBoundary>
        <div>Child content</div>
      </ClientErrorBoundary>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("catches errors and displays fallback UI", () => {
    render(
      <ClientErrorBoundary>
        <ThrowError />
      </ClientErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("displays error message in fallback", () => {
    render(
      <ClientErrorBoundary>
        <ThrowError />
      </ClientErrorBoundary>
    );

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders Try again button in fallback", () => {
    render(
      <ClientErrorBoundary>
        <ThrowError />
      </ClientErrorBoundary>
    );

    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("applies glass styling to fallback container", () => {
    render(
      <ClientErrorBoundary>
        <ThrowError />
      </ClientErrorBoundary>
    );

    const fallbackContainer = screen.getByText(/Something went wrong/).closest("div.glass");
    expect(fallbackContainer).toHaveClass("glass", "rounded-3xl", "p-8", "text-center");
  });

  it("applies ember color to error title", () => {
    render(
      <ClientErrorBoundary>
        <ThrowError />
      </ClientErrorBoundary>
    );

    const title = screen.getByText(/Something went wrong/);
    expect(title).toHaveClass("text-ember", "text-2xl", "font-semibold");
  });

  it("applies button-ghost class to Try again button", () => {
    render(
      <ClientErrorBoundary>
        <ThrowError />
      </ClientErrorBoundary>
    );

    const button = screen.getByRole("button", { name: /try again/i });
    expect(button).toHaveClass("button-ghost", "mt-4");
  });

  it("handles error without message", () => {
    const ErrorWithoutMessage = () => {
      throw new Error();
    };

    render(
      <ClientErrorBoundary>
        <ErrorWithoutMessage />
      </ClientErrorBoundary>
    );

    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
  });

  it("renders nested children correctly", () => {
    render(
      <ClientErrorBoundary>
        <div>
          <span>Nested</span>
          <span>Content</span>
        </div>
      </ClientErrorBoundary>
    );

    expect(screen.getByText("Nested")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("only catches errors in its subtree", () => {
    render(
      <div>
        <div>Outside boundary</div>
        <ClientErrorBoundary>
          <ThrowError />
        </ClientErrorBoundary>
      </div>
    );

    expect(screen.getByText("Outside boundary")).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it("logs error to console", () => {
    render(
      <ClientErrorBoundary>
        <ThrowError />
      </ClientErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });
});
