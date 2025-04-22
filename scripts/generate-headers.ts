import { writeFile } from "fs/promises";
import path from "path";
import yaml from "yaml";

const headers = process.env.HEADERS;
const header_folder = path.join(__dirname, "..", "public");

async function writeHeaders() {
  if (!headers) {
    console.warn("HEADERS environment variable is not set.");
    process.exit(0);
  }

  console.log("HEADERS environment variable is set.");

  try {
    const headerEntries = headers.split(" | ");

    // Generate standard _headers file
    const headersPath = path.join(header_folder, "_headers");
    console.log(`Writing eaders to file at path: ${headersPath}`);

    let formattedHeaders = "/*\n";
    for (const header of headerEntries) {
      formattedHeaders += `  ${header}\n`;
    }

    await writeFile(headersPath, formattedHeaders, "utf-8");
    console.log("Headers written to file successfully.");

    // Generate headers for Digital Ocean
    const appYamlPath = path.join(header_folder, "app.yaml");
    console.log(
      `Writing Digital Ocean headers to file at path: ${appYamlPath}`,
    );

    const headerMap: Record<string, string> = {};
    for (const header of headerEntries) {
      const [key, value] = header.split(": ");
      headerMap[key] = value;
    }

    const appConfig = {
      routes: [
        {
          path: "/*",
          http_headers: headerMap,
        },
      ],
    };

    const yamlContent = yaml.stringify(appConfig);
    await writeFile(appYamlPath, yamlContent, "utf-8");
    console.log("Digital Ocean headers written successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Error writing headers to files:", error);
    process.exit(1);
  }
}

writeHeaders();
