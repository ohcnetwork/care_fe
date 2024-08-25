"use client";

import React from "react";
import dynamic from "next/dynamic";

const AppRouter = dynamic(() => import("../../Routers/AppRouter"), {
  ssr: false,
});

export function ClientOnly() {
  return <AppRouter />;
}
