# Browser Support Configuration

## Overview

This document describes the browser support configuration for the CARE frontend application and how unsupported browser detection works.

## Configuration

Browser support is configured in `package.json` under the `browserslist` section. The configuration uses explicit minimum version thresholds to ensure consistent browser support.

### Production Browser Requirements

```json
{
  "browserslist": {
    "production": [
      "chrome >= 110",
      "firefox >= 142",
      "safari >= 11",
      "edge >= 139",
      "and_chr >= 141",
      "and_ff >= 143",
      "ios_saf >= 11",
      "samsung >= 28"
    ]
  }
}
```

### Key Version Requirements

- **Chrome Desktop**: Version 110 or higher
- **Firefox**: Version 142 or higher
- **Safari**: Version 11 or higher
- **Edge**: Version 139 or higher
- **Chrome Mobile (Android)**: Version 141 or higher
- **Firefox Mobile (Android)**: Version 143 or higher
- **iOS Safari**: Version 11 or higher
- **Samsung Internet**: Version 28 or higher

## How It Works

### 1. Build-Time Generation

During the build process (or when running `npm run supported-browsers`), the `scripts/generate-supported-browsers.mjs` script:

1. Reads the browserslist configuration from `package.json`
2. Uses `browserslist-useragent-regexp` to generate a regex pattern
3. Writes the regex to `src/supportedBrowsers.ts` (auto-generated, in `.gitignore`)

### 2. Runtime Detection

When the application loads:

1. The `BrowserWarning` component imports the generated regex from `supportedBrowsers.ts`
2. It tests the user's browser User Agent string against the regex
3. If the browser is unsupported, it displays a warning dialog and sticky banner

### Example Code

```typescript
import supportedBrowsers from "@/supportedBrowsers";

const notSupported = React.useMemo(() => {
  const userAgent = window.navigator.userAgent;
  if (!supportedBrowsers.test(userAgent)) {
    // Browser is not supported - show warning
    const browser = bowser.getParser(userAgent).getBrowser();
    return {
      name: browser.name || "Unknown",
      version: browser.version || "Unknown",
    };
  }
  return null;
}, []);
```

## Testing

### Automated Testing

Run the comprehensive browser detection test suite:

```bash
# Generate the supportedBrowsers.ts file
npm run supported-browsers

# Run the test suite
node scripts/test-browser-detection.mjs
```

The test suite validates detection for:
- Desktop browsers (Chrome, Firefox, Edge, Safari)
- Mobile browsers (Chrome Mobile, iOS Safari, Samsung Internet)
- Edge cases and version boundaries

### Manual Testing

For manual testing in different browsers:

1. Build the application: `npm run build`
2. Start the preview server: `npm run preview`
3. Access from different browsers/versions to test the warning

## Historical Context

### Previous Configuration (Usage-Based)

Prior to this fix, the browserslist configuration used usage-based queries:

```json
{
  "production": [
    ">0.2%",
    "not dead",
    "not op_mini all"
  ]
}
```

**Problem**: This approach included older browser versions (Chrome 105, 109, 112) that still had significant usage share (>0.2% of users), even though they were not officially supported.

### Fix: Explicit Minimum Versions

The new configuration uses explicit minimum version thresholds, ensuring that:
- Chrome 109 and earlier are correctly detected as unsupported
- Only browsers meeting the minimum requirements are supported
- No ambiguity based on usage statistics

## Maintenance

### When to Update Browser Requirements

Consider updating browser requirements when:

1. **New JavaScript/CSS features needed**: If the application requires features only available in newer browsers
2. **Security concerns**: When older browsers have known security vulnerabilities
3. **Build target changes**: When updating the Vite/esbuild target (currently `es2022`)
4. **Annual review**: Periodically review and update based on browser update cycles

### How to Update

1. Update the browserslist configuration in `package.json`
2. Run `npm run supported-browsers` to regenerate the regex
3. Run the test suite to verify: `node scripts/test-browser-detection.mjs`
4. Build and test the application
5. Update this documentation with new requirements

## Resources

- [Browserslist Documentation](https://github.com/browserslist/browserslist)
- [Can I Use](https://caniuse.com/) - Browser feature support tables
- [MDN Browser Compatibility Data](https://github.com/mdn/browser-compat-data)

## Security Considerations

Browser support directly impacts security:

- Older browsers may not support modern security features (CSP, SameSite cookies, etc.)
- Unmaintained browsers don't receive security patches
- Healthcare applications must balance accessibility with security requirements

The current minimum versions represent a balance between supporting recent browsers while maintaining security standards for healthcare data handling.
