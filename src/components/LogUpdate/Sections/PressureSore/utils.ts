import { IPressureSore } from "@/components/Patient/models";

import {
  PressureSoreExudateAmountOptions,
  PressureSoreTissueTypeOptions,
} from "@/common/constants";

const areaIntervalPoints = [0.0, 0.3, 0.6, 1.0, 2.2, 3.0, 4.0, 8.0, 12.0, 24.0];

const getAreaScore = (area: number): number => {
  const index = areaIntervalPoints.findIndex((p) => area <= p);
  return index === -1 ? 10 : index;
};

const getIndexScore = <T>(arr: readonly T[], value: T) => {
  const index = arr.indexOf(value);
  return index === -1 ? 0 : index;
};

export const calculatePushScore = (obj: IPressureSore): number => {
  return (
    getAreaScore(obj.length * obj.width) +
    getIndexScore(PressureSoreExudateAmountOptions, obj.exudate_amount) +
    getIndexScore(PressureSoreTissueTypeOptions, obj.tissue_type)
  );
};
