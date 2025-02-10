import { writeFile } from "fs/promises";
import path from "path";

const headersPath = path.join(__dirname, "../public/_headers");

async function main() {
  const headersBase64 = process.env.HEADERS_BASE64;

  if (!headersBase64) {
    console.error("HEADERS_BASE64 environment variable is not set.");
    return;
  }

  const headers = Buffer.from(headersBase64, "base64").toString("utf-8");
  await writeFile(headersPath, headers, "utf-8");

  console.log(`Headers written to: '${headersPath}'`);
}

main();
