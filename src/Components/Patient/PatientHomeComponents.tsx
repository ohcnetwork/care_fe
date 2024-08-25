import { OCCUPATION_TYPES } from "../../Common/constants";

export const parseOccupation = (occupation: string | undefined) => {
  return OCCUPATION_TYPES.find((i) => i.value === occupation)?.text;
};
