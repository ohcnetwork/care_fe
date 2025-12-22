import { existsSync, readFileSync } from "fs";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import currentStockJson from "./data/CURSTOCK.json";
import locationMasterJson from "./data/LOCATION_MASTER.json";

type SupplyDeliveryRow = {
  ITEM_ID: number;
  QTY: number;
  LOCATION_ID: number;
  CARE_LOCATION_ID?: string;
};

const stock = currentStockJson as SupplyDeliveryRow[];

const dir = path.join(__dirname, "data");

async function writePayloads(payload: Record<string, object[]>) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  for (const [key, value] of Object.entries(payload)) {
    await writeFile(
      path.join(dir, `${key}.json`),
      JSON.stringify(value, null, 2),
    );
  }
}

const addCareLocationToStock = () => {
  const csv = readFileSync(
    `./sudheendra-scripts/inventory-from-db/data/ssmm-locations.csv`,
    { encoding: "utf-8" },
  );
  const [header, ...rows] = csv.split("\n");
  for (const row of rows) {
    const [ssmLocation, careLocationId] = row.split(",");
    const id = locationMasterJson.find(
      (location) => location.DESCRIPTION === ssmLocation,
    )?.ID;
    if (id) {
      stock.forEach((item) => {
        if (item.LOCATION_ID === id) {
          item.CARE_LOCATION_ID = careLocationId;
        }
      });
    }
  }
  return stock;
};

async function main() {
  addCareLocationToStock();
  writePayloads({
    stock: stock,
  });
}

main();
