"use client";

export default function PlannerDate() {
  const today = new Date();
  const formatted = today.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return <span>Tonight, {formatted}</span>;
}
