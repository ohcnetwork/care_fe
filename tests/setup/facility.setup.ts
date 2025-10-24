import { createAuthenticatedAPIContext } from "@/tests/utils/auth-context";
import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";
import type { FacilityRead } from "src/types/facility/facility";

const cacheDir = path.join(__dirname, "../.cache");
const facilityFile = path.join(cacheDir, "facility.json");

async function getLastFacility(): Promise<FacilityRead> {
  const apiContext = await createAuthenticatedAPIContext();

  try {
    const response = await apiContext.get("/api/v1/facility/");

    if (!response.ok()) {
      throw new Error(
        `Failed to fetch facilities: ${response.status()} ${await response.text()}`,
      );
    }

    const data = await response.json();
    const last = data?.results?.at?.(-1);

    if (last) {
      return last;
    }

    throw new Error(
      "No facilities found. Ensure backend fixtures are up to date and seeded.",
    );
  } finally {
    await apiContext.dispose();
  }
}

setup("prepare facility data", async () => {
  console.log("Fetching facility data...");

  const facility = await getLastFacility();

  // Ensure cache directory exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Save facility data to file
  fs.writeFileSync(facilityFile, JSON.stringify(facility, null, 2));

  console.log("Facility setup complete:", {
    facilityId: facility.id,
    facilityName: facility.name,
  });
});
