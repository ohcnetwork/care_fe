import type { Metadata } from "next";
import * as Sentry from "@sentry/browser";
import { ReduxProvider } from "../ReduxProvider";
import App from "./App";

export const metadata: Metadata = {
  title: "My App",
  description: "My App is a...",
};

// // Initialize Sentry
// if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
//   Sentry.init({
//     environment: process.env.NODE_ENV,
//     dsn: "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632",
//   });
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>%REACT_APP_TITLE%</title>
        <meta name="description" content="%REACT_APP_META_DESCRIPTION%" />
        <meta property="og:title" content="%REACT_APP_TITLE%" />
        <meta
          property="og:description"
          content="%REACT_APP_META_DESCRIPTION%"
        />
        <meta property="og:image" content="%REACT_APP_COVER_IMAGE%" />
        <meta property="og:url" content="%REACT_PUBLIC_URL%" />
        <meta property="og:site_name" content="%REACT_APP_TITLE%" />
        <meta name="twitter:title" content="%REACT_APP_TITLE%" />
        <meta
          name="twitter:description"
          content="%REACT_APP_META_DESCRIPTION%"
        />
        <meta name="twitter:image" content="%REACT_APP_COVER_IMAGE%" />
        <meta name="twitter:card" content="summary" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Care" />
        <meta name="theme-color" content="#0e9f6e" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link
          rel="apple-touch-icon"
          href="/images/icons/apple-touch-icon-180x180.png"
        />
      </head>
      <body>
        {
          <ReduxProvider>
            <App>{children}</App>
          </ReduxProvider>
        }
      </body>
    </html>
  );
}
