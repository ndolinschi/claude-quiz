"use client";

import { useEffect, useState } from "react";

export function useCountdown(
  deadline: number | null,
  enabled: boolean,
  onExpire: () => void
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled || deadline == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [deadline, enabled]);

  const remainingMs = deadline == null ? null : Math.max(0, deadline - now);

  useEffect(() => {
    if (!enabled || remainingMs == null) return;
    if (remainingMs <= 0) onExpire();
  }, [enabled, remainingMs, onExpire]);

  return remainingMs;
}
