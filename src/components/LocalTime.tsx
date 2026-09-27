"use client";

import { useEffect, useState } from "react";

type LocalTimeProps = {
  /** ISO 8601 instant (or any string `new Date()` can parse). */
  iso: string;
  /** Formats the parsed date in the viewer's own locale/timezone. */
  format: (date: Date) => string;
  className?: string;
};

/**
 * Renders `iso` formatted for the viewer's own locale and timezone, without
 * a hydration mismatch.
 *
 * Client components are still rendered once on the server, and the browser
 * runs that same render function again for its first (pre-hydration) pass.
 * `toLocaleDateString`/`toLocaleTimeString` called directly in a render body
 * use the SERVER's locale/timezone during both of those passes — the
 * viewer's locale/timezone is only available to code that actually runs in
 * their browser, i.e. after mount. If server and viewer differ (a
 * non-en-US locale, or a viewer near a UTC day boundary), the server HTML
 * and the browser's pre-hydration render disagree and React throws a
 * hydration error, then discards and re-renders the whole tree.
 *
 * Fix: the server render and the client's PRE-HYDRATION render must be
 * byte-identical, so `stableFallback` here is derived by slicing the ISO
 * string directly — no `Date`, no `Intl`, nothing environment-dependent.
 * Only after a real `useEffect` fires (which is guaranteed to run only in
 * the browser, and only after hydration has already reconciled) do we swap
 * to the formatted, viewer-local text. That swap is an ordinary client-side
 * state update, not a hydration mismatch.
 */
export default function LocalTime({ iso, format, className }: LocalTimeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const date = new Date(iso);
  const valid = !Number.isNaN(date.getTime());
  const stableFallback = valid ? iso.slice(0, 16).replace("T", " ") : iso;

  return (
    <time dateTime={valid ? date.toISOString() : undefined} className={className} suppressHydrationWarning>
      {mounted && valid ? format(date) : stableFallback}
    </time>
  );
}
