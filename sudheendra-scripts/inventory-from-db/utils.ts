import { LocationRead } from "@/types/location/location";
import { PaginatedResponse } from "@/Utils/request/types";
import dotenv from "dotenv";
import { createSlug, request } from "sudheendra-scripts/utils";
import locations from "./data/LOCATION_MASTER.json";
import pharmacyCategories from "./data/PHARM_CATEGORY.json";

dotenv.config({ path: [".env.local", ".env"] });

const FACILITY_ID = process.env.FACILITY_ID!;

export const getCategoriesToImport = async () => {
  return pharmacyCategories.map((category) => ({
    slug_value: createSlug(category.CATEGORY),
    name: category.CATEGORY,
  }));
};

export const getLocationsToImport = async () => {
  return locations.map((location) => ({
    id: location.ID,
    name: location.DESCRIPTION,
  }));
};

const getExistingPaginatedData = async <TInput, TOutput>(
  url: string,
  transform: (data: TInput) => TOutput,
) => {
  const data: TOutput[] = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const response = await request<PaginatedResponse<TInput>>(
      `${url}?limit=${pageSize}&offset=${offset}`,
      "GET",
    );

    data.push(...response.results.map(transform));

    if (response.results.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return data;
};

export const getItemsToImport = async <TExisting, TItem>(
  existingItems: TExisting[],
  importItems: TItem[],
  isSame: (existing: TExisting, item: TItem) => boolean,
) => {
  return importItems.filter((item) =>
    existingItems.every((existing) => !isSame(existing, item)),
  );
};

export const getExistingLocations = async () => {
  return getExistingPaginatedData<LocationRead, { id: string; name: string }>(
    `/api/v1/facility/${FACILITY_ID}/location/`,
    (location) => ({
      id: location.id,
      name: location.name,
    }),
  );
};
