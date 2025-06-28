import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sbomFolderPath = path.join(__dirname, "..", "public", "sbom");

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const fetchSbomData = async (repo: `${string}/${string}`, retries = 3) => {
  const url = `https://api.github.com/repos/${repo}/dependency-graph/sbom`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (response.ok) {
        return await response.json();
      }

      if (attempt === retries) {
        throw new Error(
          `Error fetching SBOM data from ${url}: ${response.statusText}`,
        );
      }

      // Wait before retrying (exponential backoff)
      await delay(Math.pow(2, attempt) * 1000);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await delay(Math.pow(2, attempt) * 1000);
    }
  }
};

async function main() {
  await fs.mkdir(sbomFolderPath, { recursive: true });

  const feSbom = await fetchSbomData("ohcnetwork/care_fe");
  await fs.writeFile(
    path.join(sbomFolderPath, "care_fe-sbom.json"),
    JSON.stringify(feSbom),
  );

  const beSbom = await fetchSbomData("ohcnetwork/care");
  await fs.writeFile(
    path.join(sbomFolderPath, "care-sbom.json"),
    JSON.stringify(beSbom),
  );
}

main();
