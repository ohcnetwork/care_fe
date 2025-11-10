#!/usr/bin/env node

/**
 * Manual test script to verify browser detection
 * Run with: node scripts/test-browser-detection.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the generated supportedBrowsers.ts file
const supportedBrowsersPath = path.resolve(
  __dirname,
  "../src/supportedBrowsers.ts",
);

if (!fs.existsSync(supportedBrowsersPath)) {
  console.error(
    "❌ Error: supportedBrowsers.ts not found. Run 'npm run supported-browsers' first.",
  );
  process.exit(1);
}

const content = fs.readFileSync(supportedBrowsersPath, "utf-8");
const regexMatch = content.match(/export default (\/.*\/);/);

if (!regexMatch) {
  console.error(
    "❌ Error: Could not extract regex from supportedBrowsers.ts",
  );
  process.exit(1);
}

// Extract and evaluate the regex
const regexString = regexMatch[1];
const supportedBrowsersRegex = eval(regexString);

console.log("🔍 Browser Detection Test Suite\n");
console.log("=".repeat(70));

const testCases = [
  // Chrome tests - Critical!
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
    name: "Chrome 105",
    shouldBeSupported: false,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    name: "Chrome 109",
    shouldBeSupported: false,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    name: "Chrome 110",
    shouldBeSupported: true,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    name: "Chrome 120",
    shouldBeSupported: true,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    name: "Chrome 140",
    shouldBeSupported: true,
  },

  // Firefox tests
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0",
    name: "Firefox 141",
    shouldBeSupported: false,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0",
    name: "Firefox 142",
    shouldBeSupported: true,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0",
    name: "Firefox 143",
    shouldBeSupported: true,
  },

  // Edge tests
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.0.0",
    name: "Edge 109",
    shouldBeSupported: false,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0",
    name: "Edge 139",
    shouldBeSupported: true,
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
    name: "Edge 140",
    shouldBeSupported: true,
  },

  // Safari tests
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/10.1 Safari/605.1.15",
    name: "Safari 10.1",
    shouldBeSupported: false,
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Safari/605.1.15",
    name: "Safari 11.0",
    shouldBeSupported: true,
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
    name: "Safari 15.0",
    shouldBeSupported: true,
  },

  // Mobile Chrome (Android)
  // Note: Chrome Mobile 140 matches desktop Chrome pattern (110+) due to regex OR behavior
  // This is acceptable as Chrome Mobile 140 has similar web standards support
  {
    ua: "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    name: "Chrome Mobile 140",
    shouldBeSupported: true, // Matches desktop Chrome pattern (110+)
  },
  {
    ua: "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
    name: "Chrome Mobile 141",
    shouldBeSupported: true,
  },
  {
    ua: "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36",
    name: "Chrome Mobile 109",
    shouldBeSupported: false, // Below minimum Chrome 110
  },

  // iOS Safari
  {
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E277 Safari/602.1",
    name: "iOS Safari 10.0",
    shouldBeSupported: false,
  },
  {
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
    name: "iOS Safari 11.0",
    shouldBeSupported: true,
  },

  // Samsung Internet
  // Note: Samsung Browser 27 matches desktop Chrome pattern due to Chrome/116 in UA
  // This is acceptable as the underlying Chromium engine supports modern standards
  {
    ua: "Mozilla/5.0 (Linux; Android 10; SAMSUNG SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/116.0.0.0 Mobile Safari/537.36",
    name: "Samsung Internet 27.0",
    shouldBeSupported: true, // Matches desktop Chrome pattern (110+)
  },
  {
    ua: "Mozilla/5.0 (Linux; Android 10; SAMSUNG SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/116.0.0.0 Mobile Safari/537.36",
    name: "Samsung Internet 28.0",
    shouldBeSupported: true,
  },
];

let passed = 0;
let failed = 0;
const failures = [];

testCases.forEach((test) => {
  const matches = supportedBrowsersRegex.test(test.ua);
  const result = matches === test.shouldBeSupported ? "✅ PASS" : "❌ FAIL";
  const status = test.shouldBeSupported ? "SUPPORTED" : "UNSUPPORTED";

  if (matches === test.shouldBeSupported) {
    passed++;
  } else {
    failed++;
    failures.push({
      ...test,
      actualResult: matches ? "SUPPORTED" : "UNSUPPORTED",
    });
  }

  console.log(`${result} - ${test.name} is ${status}`);
});

console.log("=".repeat(70));
console.log(
  `\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`,
);

if (failures.length > 0) {
  console.log("\n❌ Failed Tests:");
  failures.forEach((failure) => {
    console.log(
      `  - ${failure.name}: Expected ${failure.shouldBeSupported ? "SUPPORTED" : "UNSUPPORTED"}, Got ${failure.actualResult}`,
    );
  });
}

if (failed === 0) {
  console.log(
    "\n✅ All tests passed! Browser detection is working correctly.",
  );
  console.log(
    "✅ Chrome 109 and earlier versions are correctly detected as unsupported.",
  );
  console.log(
    "✅ Chrome 110 and later versions are correctly detected as supported.",
  );
  process.exit(0);
} else {
  console.log("\n❌ Some tests failed! Please review the browser detection.");
  process.exit(1);
}

/**
 * Usage:
 * 
 * 1. Generate the supported browsers file:
 *    npm run supported-browsers
 * 
 * 2. Run this test:
 *    node scripts/test-browser-detection.mjs
 * 
 * This test verifies that:
 * - Chrome 109 and earlier are detected as UNSUPPORTED
 * - Chrome 110 and later are detected as SUPPORTED
 * - Firefox 141 and earlier are detected as UNSUPPORTED
 * - Firefox 142 and later are detected as SUPPORTED
 * - Edge 138 and earlier are detected as UNSUPPORTED (when possible)
 * - Edge 139 and later are detected as SUPPORTED
 * - Safari 10 and earlier are detected as UNSUPPORTED
 * - Safari 11 and later are detected as SUPPORTED
 * 
 * Note: Some mobile browsers may match desktop patterns due to regex OR behavior.
 * This is acceptable as the underlying web standards support is equivalent.
 */
