import {
  Investigation,
  InvestigationResponse,
} from "@/components/Facility/Investigations/Reports/types";

const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();
  const MAX_CACHE_SIZE = 1000;
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = args
      .map((arg) =>
        typeof arg === "object"
          ? arg instanceof Date
            ? arg.getTime().toString()
            : JSON.stringify(Object.entries(arg).sort())
          : String(arg),
      )
      .join("|");
    if (!cache.has(key)) {
      if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey: any = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, fn(...args));
    }
    return cache.get(key)!;
  }) as T;
};

export const transformData = memoize((data: InvestigationResponse) => {
  const sessions = Array.from(
    new Map(
      data.map((value: any) => [
        value.session_object.session_external_id,
        {
          ...value.session_object,
          facility_name: value.consultation_object?.facility_name,
          facility_id: value.consultation_object?.facility,
        },
      ]),
    ).values(),
  ).sort(
    (a, b) =>
      new Date(b.session_created_date).getTime() -
      new Date(a.session_created_date).getTime(),
  );

  const groupByInvestigation = Object.values(
    data.reduce(
      (acc, value: Investigation) => {
        const key = value.investigation_object.external_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(value);
        return acc;
      },
      {} as { [key: string]: Investigation[] },
    ),
  );

  const sessionMap = new Map(
    sessions.map((session, index) => [session.session_external_id, index]),
  );
  const reqData = groupByInvestigation.map((value: any) => {
    const sessionValues = Array.from({ length: sessions.length });
    value.forEach((val: any) => {
      const sessionIndex =
        sessionMap.get(val.session_object.session_external_id) ?? -1;
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
