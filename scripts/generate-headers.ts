import * as fs from "fs";
import * as path from "path";

const headers64 = process.env.HEADERS_64;

if (headers64) {
  console.log("HEADERS_64 environment variable is set.");
  const headersBuffer = Buffer.from(headers64, "base64");
  console.log("Decoded headers from base64.");
  const headers = headersBuffer.toString("utf-8");
  const headersPath = path.join(__dirname, "build", "_headers");
  console.log(`Writing headers to file at path: ${headersPath}`);
  fs.writeFileSync(headersPath, headers, "utf-8");
  console.log("Headers written to file successfully.");
} else {
  console.error("HEADERS_64 environment variable is not set.");
  process.exit(0);
}
