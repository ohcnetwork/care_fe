import { writeFile } from "fs/promises";
import path from "path";

const headers = process.env.HEADERS;
const header_folder = path.join(__dirname, "..", "public");

async function writeHeaders() {
  if (!headers) {
    console.warn("HEADERS environment variable is not set.");
    process.exit(0);
  }

  console.log("HEADERS environment variable is set.");
  const headersPath = path.join(header_folder, "_headers");
  console.log(`Writing headers to file at path: ${headersPath}`);

  try {
    const headerEntries = headers.split(" | ");
    let formattedHeaders = "/*\n";

    for (const header of headerEntries) {
      formattedHeaders += `  ${header}\n`;
    }

    await writeFile(headersPath, formattedHeaders, "utf-8");
    console.log("Headers written to file successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error writing headers to file:", error);
    process.exit(0);
  }
}

writeHeaders();
