"use client";

import { useEffect } from "react";

export function AitDevtools() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      void import("@apps-in-toss/devtools/panel");
    }
  }, []);

  return null;
}
