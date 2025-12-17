import { createSlug } from "sudheendra-scripts/utils";
import locations from "./data/LOCATION_MASTER.json";
import pharmacyCategories from "./data/PHARM_CATEGORY.json";

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
