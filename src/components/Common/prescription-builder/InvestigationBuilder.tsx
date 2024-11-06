import dayjs from "dayjs";
import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { PrescriptionDropdown } from "@/components/Common/prescription-builder/PrescriptionDropdown";
import { PrescriptionMultiDropdown } from "@/components/Common/prescription-builder/PrescriptionMultiselect";
import DateFormField from "@/components/Form/FormFields/DateFormField";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { humanizeStrings } from "@/Utils/utils";

export type InvestigationType = {
  type?: string[];
  repetitive?: boolean;
  time?: string;
  frequency?: string;
  notes?: string;
};

const FREQUENCY = [
  "15 min",
  "30 min",
  "1 hr",
  "6 hrs",
  "12 hrs",
  "24 hrs",
  "48 hrs",
];

export interface InvestigationBuilderProps<T> {
  investigations: T[];
  setInvestigations: React.Dispatch<React.SetStateAction<T[]>>;
}

export const loadInvestigations = async () => {
  const fetchInvestigations = async () => {
    const { data } = await request(routes.listInvestigations);
    return (
      data?.results.map(
        (investigation) =>
          `${investigation.name} -- ${humanizeStrings(
            investigation.groups.map((group) => ` ( ${group.name} ) `),
          )}`,
      ) ?? []
    );
  };

  const fetchInvestigationGroups = async () => {
    const { data } = await request(routes.listInvestigationGroups);
    return data?.results.map((group) => `${group.name} (GROUP)`) ?? [];
  };

  const invs = await fetchInvestigations();
  const groups = await fetchInvestigationGroups();

  let additionalStrings: string[] = [];
  const additionalInvestigations = [
    ["Vitals", ["Temp", "Blood Pressure", "Respiratory Rate", "Pulse Rate"]],
    [
      "ABG",
      [
        "PO2",
        "PCO2",
        "PH",
        "HCO3",
        "Base excess",
        "Lactate",
        "Sodium",
        "Potassium",
      ],
    ],
  ];
  additionalInvestigations.forEach((investigation) => {
    additionalStrings.push((investigation[0] as string) + " (GROUP)");
    additionalStrings = [
      ...additionalStrings,
      ...(investigation[1] as string[]).map(
        (i: any) => i + " -- ( " + investigation[0] + " )",
      ),
    ];
  });

  return [...groups, ...invs, ...additionalStrings];
};

export default function InvestigationBuilder(
  props: InvestigationBuilderProps<InvestigationType>,
) {
  const { investigations, setInvestigations } = props;
  const [investigationsList, setInvestigationsList] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const setItem = (object: InvestigationType, i: number) => {
    setInvestigations(
      investigations?.map((investigation, index) =>
        index === i ? object : investigation,
      ),
    );
  };

  useEffect(() => {
    const load = async () => setInvestigationsList(await loadInvestigations());
    load();
  }, []);

  return (
    <div className="mt-2">
      {investigations?.map((investigation, i) => {
        const setFrequency = (frequency: string) => {
          setItem(
            {
              ...investigation,
              frequency,
            },
            i,
          );
        };

        const setType = (type: string[]) => {
          setItem(
            {
              ...investigation,
              type,
            },
            i,
          );
        };

        return (
          <div
            key={i}
            className={`border-2 ${
              activeIdx === i ? "border-primary-500" : "border-secondary-500"
            } mb-2 border-spacing-2 rounded-md border-dashed p-3 text-sm text-secondary-600`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 md:flex-row md:gap-4">
              <h4 className="text-base font-medium text-secondary-700">
                Investigation No. {i + 1}
              </h4>
              <button
                type="button"
                className="flex h-full items-center justify-center gap-1.5 rounded-md bg-red-500 px-3 py-1 text-sm text-secondary-100 transition hover:bg-red-600"
                onClick={() =>
                  setInvestigations(
                    investigations.filter((investigation, index) => i != index),
                  )
                }
              >
                Delete Investigation
                <CareIcon icon="l-trash-alt" className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex w-full flex-col justify-between">
                <div>
                  Investigations Recommended
                  <span className="text-danger-500">{" *"}</span>
                </div>
                <div id="search-patient-investigation">
                  <PrescriptionMultiDropdown
                    options={investigationsList}
                    placeholder="Search Investigations"
                    selectedValues={
                      investigation.type?.constructor === Array
                        ? investigation.type
                        : []
                    }
                    setSelectedValues={setType}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                  />
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col justify-between">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex shrink-0 cursor-pointer items-center gap-2 md:mt-3">
                    Is the investigation repetitive?
                    <br />
                    <input
                      id="investigation-checkbox"
                      type="checkbox"
                      onFocus={() => setActiveIdx(i)}
                      onBlur={() => setActiveIdx(null)}
                      className="inline-block h-[18px] w-[18px] rounded-md"
                      checked={investigation?.repetitive || false}
                      onChange={(e) => {
                        setItem(
                          {
                            ...investigation,
                            repetitive: e.currentTarget.checked,
                          },
                          i,
                        );
                      }}
                    />
                  </div>
                  {investigation.repetitive ? (
                    <div className="w-full">
                      <div className="mb-1">
                        Frequency<span className="text-danger-500">{" *"}</span>
                      </div>
                      <div id="investigation-frequency">
                        <PrescriptionDropdown
                          placeholder="Frequency"
                          options={FREQUENCY}
                          value={investigation.frequency || ""}
                          setValue={setFrequency}
                          onFocus={() => setActiveIdx(i)}
                          onBlur={() => setActiveIdx(null)}
                        />
                      </div>
                    </div>
                  ) : (
                    <DateFormField
                      name="time"
                      label="Time"
                      required
                      value={
                        !investigation.time
                          ? new Date()
                          : new Date(investigation.time)
                      }
                      onChange={(e) =>
                        setItem(
                          {
                            ...investigation,
                            time: dayjs(e.value).format("YYYY-MM-DDTHH:mm"),
                          },
                          i,
                        )
                      }
                      allowTime
                      errorClassName="hidden"
                      className="w-full"
                      onFocus={() => setActiveIdx(i)}
                      onBlur={() => setActiveIdx(null)}
                    />
                  )}
                </div>
                <div className="w-full">
                  <div className="mb-1">Notes</div>
                  <input
                    type="text"
                    className="cui-input-base py-2"
                    placeholder="Notes"
                    value={investigation.notes || ""}
                    onChange={(e) => {
                      setItem(
                        {
                          ...investigation,
                          notes: e.currentTarget.value,
                        },
                        i,
                      );
                    }}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          setInvestigations([...investigations, { repetitive: false }]);
        }}
        className="mt-4 block w-full bg-secondary-200 px-4 py-2 text-left text-sm font-bold leading-5 text-secondary-700 shadow-sm hover:bg-secondary-300 hover:text-secondary-900 focus:bg-secondary-100 focus:text-secondary-900 focus:outline-none"
      >
        + Add Investigation
      </button>
    </div>
  );
}
