import * as _ from "lodash-es";
import { findIndex, memoize } from "lodash-es";

import { InvestigationResponse } from "@/components/Facility/Investigations/Reports/types";

export const transformData = memoize((data: InvestigationResponse) => {
  const sessions = _.chain(data)
    .map((value: any) => {
      return {
        ...value.session_object,
        facility_name: value.consultation_object?.facility_name,
        facility_id: value.consultation_object?.facility,
      };
    })
    .uniqBy("session_external_id")
    .orderBy("session_created_date", "desc")
    .value();
  const groupByInvestigation = _.chain(data)
    .groupBy("investigation_object.external_id")
    .values()
    .value();
  const reqData = groupByInvestigation.map((value: any) => {
    const sessionValues = Array.from({ length: sessions.length });
    value.forEach((val: any) => {
      const sessionIndex = findIndex(sessions, [
        "session_external_id",
        val.session_object.session_external_id,
      ]);
      if (sessionIndex > -1) {
        sessionValues[sessionIndex] = {
          min: val.investigation_object.min_value,
          max: val.investigation_object.max_value,
          value: val.value,
          notes: val.notes,
        };
      }
    });
    const {
      group,
      group_object,
      id,
      investigation,
      investigation_object,
      notes,
      session,
      session_object,
    } = value[0];

    return {
      group,
      group_object,
      id,
      investigation,
      investigation_object,
      notes,
      session,
      session_object,
      sessionValues,
    };
  });
  return { sessions, data: reqData };
});

export const getColorIndex = memoize(
  ({ max, min, value }: { min?: number; max?: number; value?: number }) => {
    if (!max && min && value) {
      // 1 => yellow color
      // 5 => green color
      return value < min ? 1 : 5;
    }
    if (!min && max && value) {
      // 5 => green color
      // 7 => red color
      return value > max ? 7 : 5;
    }

    if (!min || !max || !value) {
      return -1;
    }

    const avg = (max + min) / 2;
    const buckets = avg / 3;

    if (value >= max) {
      const result = Math.abs(~~(Math.abs(max - value) / buckets));

      return 6 + (result >= 2 ? 2 : result);
    } else if (value <= min) {
      const result = Math.abs(~~(Math.abs(min - value) / buckets));

      return result >= 2 ? 2 : result;
    } else {
      const result = 3 + Math.round(Math.abs(value - avg) / buckets);
      return Math.abs(result);
    }
  },
);

export const safe = [
  {
    color: "#D6FCEA",
    text: "#047857",
  },
  {
    color: "#AFFAD4",
    text: "#047857",
  },
  {
    color: "#86F3C1",
    text: "#006837",
  },
];

export const high = [
  {
    color: "#FEE5E5",
    text: "#7C0000",
  },
  {
    color: "#FED3D3",
    text: "#7C0000",
  },
  {
    color: "#FEC1C1",
    text: "#7C0000",
  },
];

const low = [
  {
    color: "#FFF8DA",
    text: "#92400E",
  },
  {
    color: "#FFF0B2 ",
    text: "#78350F",
  },
  {
    color: "#FDE68A",
    text: "#806600",
  },
];

export const rowColor = [...low, ...safe.reverse(), ...high];
