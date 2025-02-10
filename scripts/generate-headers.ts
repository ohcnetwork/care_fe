import * as fs from "fs";
import * as path from "path";

const headers64 = process.env.HEADERS_64;

if (headers64) {
  const headersBuffer = Buffer.from(headers64, "base64");
  const headers = headersBuffer.toString("utf-8");
  const headersPath = path.join(__dirname, "_headers");

  fs.writeFileSync(headersPath, headers, "utf-8");
} else {
  console.error("HEADERS_64 environment variable is not set.");
  process.exit(0);
}
