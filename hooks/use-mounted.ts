"use client";

import { useEffect, useState } from "react";

/** Guards client-only UI (cart counts, persisted state) against hydration mismatches. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
