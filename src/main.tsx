import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import "@/i18n";
import "@/style/index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Extend Window interface to include CARE_API_URL
declare global {
  interface Window {
    CARE_API_URL: string;
  }
}

// Set API URL from environment variable
window.CARE_API_URL = import.meta.env.REACT_CARE_API_URL;

if ("serviceWorker" in navigator) {
  registerSW({ immediate: false });
}

const rootElement = document.getElementById("root")!;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
