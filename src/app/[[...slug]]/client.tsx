"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ReduxProvider } from "../../ReduxProvider";
import "../../style/index.css";

const App = dynamic(() => import("../../App"), { ssr: false });

export function ClientOnly() {
  return (
    <ReduxProvider>
      <App></App>
    </ReduxProvider>
  );
}
