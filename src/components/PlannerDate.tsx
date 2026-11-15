"use client";

import { useEffect, useReducer } from "react";

export default function PlannerDate() {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timer = setTimeout(() => { refresh(); schedule(); }, midnight.getTime() - now.getTime() + 1);
    };
    const resume = () => { refresh(); schedule(); };
    schedule();
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);
  const today = new Date();
  const formatted = today.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return <span>Tonight, {formatted}</span>;
}
