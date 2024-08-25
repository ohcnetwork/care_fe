import { OCCUPATION_TYPES } from "../../Common/constants";
import { Occupation } from "./models";

export const parseOccupationFromExt = (occupation: Occupation) => {
  const occupationObject = OCCUPATION_TYPES.find(
    (item) => item.value === occupation,
  );
  return occupationObject?.id;
};
