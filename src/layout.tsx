import type { Metadata } from 'next'
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'My App',
  description: 'My App is a...',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>%REACT_APP_TITLE%</title>
        <meta name="description" content="%REACT_APP_META_DESCRIPTION%" />
        <meta property="og:title" content="%REACT_APP_TITLE%" />
        <meta property="og:description" content="%REACT_APP_META_DESCRIPTION%" />
        <meta property="og:image" content="%REACT_APP_COVER_IMAGE%" />
        <meta property="og:url" content="%REACT_PUBLIC_URL%" />
        <meta property="og:site_name" content="%REACT_APP_TITLE%" />
        <meta name="twitter:title" content="%REACT_APP_TITLE%" />
        <meta name="twitter:description" content="%REACT_APP_META_DESCRIPTION%" />
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
        <div id="root">{children}</div>
        {/* Add any external scripts here */}
        <Script id="plausible" strategy="afterInteractive">
          {`
            window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };
          `}
        </Script>
    </html>
  )
}
