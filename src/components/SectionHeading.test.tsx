import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionHeading from "./SectionHeading";

describe("SectionHeading", () => {
  it("renders eyebrow, title, and subtitle", () => {
    render(
      <SectionHeading
        eyebrow="Tonight"
        title="Celestial Events"
        subtitle="What to observe tonight"
      />
    );

    expect(screen.getByText("Tonight")).toBeInTheDocument();
    expect(screen.getByText("Celestial Events")).toBeInTheDocument();
    expect(screen.getByText("What to observe tonight")).toBeInTheDocument();
  });

  it("renders with h2 heading by default", () => {
    render(
      <SectionHeading
        eyebrow="Events"
        title="Upcoming Events"
        subtitle="Plan your stargazing"
      />
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Upcoming Events");
  });

  it("renders with h1 heading when specified", () => {
    render(
      <SectionHeading
        eyebrow="Welcome"
        title="Main Title"
        subtitle="Description text"
        as="h1"
      />
    );

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Main Title");
  });

  it("applies correct styling to eyebrow", () => {
    render(
      <SectionHeading
        eyebrow="Section"
        title="Title"
        subtitle="Subtitle"
      />
    );

    const eyebrow = screen.getByText("Section");
    expect(eyebrow).toHaveClass("text-xs", "uppercase", "tracking-[0.3em]", "text-aurora/70");
  });

  it("applies correct styling to title", () => {
    render(
      <SectionHeading
        eyebrow="Section"
        title="Styled Title"
        subtitle="Subtitle"
      />
    );

    const title = screen.getByText("Styled Title");
    expect(title).toHaveClass("font-display", "text-2xl", "text-starlight");
  });

  it("applies correct styling to subtitle", () => {
    render(
      <SectionHeading
        eyebrow="Section"
        title="Title"
        subtitle="Styled Subtitle"
      />
    );

    const subtitle = screen.getByText("Styled Subtitle");
    expect(subtitle).toHaveClass("mt-2", "text-sm", "text-starlight/70", "max-w-2xl");
  });

  it("has correct container margin", () => {
    const { container } = render(
      <SectionHeading
        eyebrow="Section"
        title="Title"
        subtitle="Subtitle"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("mb-6");
  });
});
