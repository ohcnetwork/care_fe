import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  listInvestigationGroups,
  listInvestigations,
} from "../../../Redux/actions";
import { PrescriptionDropdown } from "./PrescriptionDropdown";
import { PrescriptionMultiDropdown } from "./PrescriptionMultiselect";
import CareIcon from "../../../CAREUI/icons/CareIcon";
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

export default function InvestigationBuilder(
  props: InvestigationBuilderProps<InvestigationType>
) {
  const { investigations, setInvestigations } = props;
  const [investigationsList, setInvestigationsList] = useState<string[]>([]);
  const dispatch: any = useDispatch();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
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

  const setItem = (object: InvestigationType, i: number) => {
    setInvestigations(
      investigations.map((investigation, index) =>
        index === i ? object : investigation
      )
    );
  };

  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    const invs = await fetchInvestigations();
    const groups = await fetchInvestigationGroups();

    let additionalStrings: string[] = [];
    additionalInvestigations.forEach((investigation) => {
      additionalStrings.push((investigation[0] as string) + " (GROUP)");
      additionalStrings = [
        ...additionalStrings,
        ...(investigation[1] as string[]).map(
          (i: any) => i + " -- ( " + investigation[0] + " )"
        ),
      ];
    });

    setInvestigationsList([...groups, ...invs, ...additionalStrings]);
  };

  const fetchInvestigations = async () => {
    const res = await dispatch(listInvestigations({}));
    if (res && res.data) {
      return res.data.results.map(
        (investigation: any) =>
          investigation.name +
          " -- " +
          investigation.groups
            .map((group: any) => " ( " + group.name + " ) ")
            .join(", ")
      );
    }
    return [];
  };

  const fetchInvestigationGroups = async () => {
    const res = await dispatch(listInvestigationGroups({}));
    if (res && res.data) {
      return res.data.results.map((group: any) => group.name + " (GROUP)");
    }
    return [];
  };

  return (
    <div className="mt-2">
      {investigations.map((investigation, i) => {
        const setFrequency = (frequency: string) => {
          setItem(
            {
              ...investigation,
              frequency,
            },
            i
          );
        };

        const setType = (type: string[]) => {
          setItem(
            {
              ...investigation,
              type,
            },
            i
          );
        };

        return (
          <div
            key={i}
            className={`border-2 ${
              activeIdx === i ? "border-primary-500" : "border-gray-500"
            } mb-2 border-spacing-2 rounded-md border-dashed p-3 text-sm text-gray-600`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 md:flex-row md:gap-4">
              <h4 className="text-base font-medium text-gray-700">
                Investigation No. {i + 1}
              </h4>
              <button
                type="button"
                className="flex h-full items-center justify-center gap-1.5 rounded-md bg-red-500 px-3 py-1 text-sm text-gray-100 transition hover:bg-red-600"
                onClick={() =>
                  setInvestigations(
                    investigations.filter((investigation, index) => i != index)
                  )
                }
              >
                Delete Investigation
                <CareIcon className="care-l-trash-alt h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex w-full flex-col justify-between">
                <div>
                  Investigations Recommended
                  <span className="text-danger-500">{" *"}</span>
                </div>
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
              <div className="flex w-full shrink-0 flex-col justify-between">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex shrink-0 cursor-pointer items-center gap-2 md:mt-3">
                    Is the investigation repetitive?
                    <br />
                    <input
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
                          i
                        );
                      }}
                    />
                  </div>
                  {investigation.repetitive ? (
                    <div className="w-full">
                      <div className="mb-1">
                        Frequency<span className="text-danger-500">{" *"}</span>
                      </div>
                      <PrescriptionDropdown
                        placeholder="Frequency"
                        options={FREQUENCY}
                        value={investigation.frequency || ""}
                        setValue={setFrequency}
                        onFocus={() => setActiveIdx(i)}
                        onBlur={() => setActiveIdx(null)}
                      />
                    </div>
                  ) : (
                    <div className="w-full">
                      Time<span className="text-danger-500">{" *"}</span>
                      <input
                        type="datetime-local"
                        className="block w-[calc(100%-5px)] rounded border border-gray-400 bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-primary-500"
                        value={investigation.time || ""}
                        onChange={(e) => {
                          setItem(
                            {
                              ...investigation,
                              time: e.currentTarget.value,
                            },
                            i
                          );
                        }}
                        onFocus={() => setActiveIdx(i)}
                        onBlur={() => setActiveIdx(null)}
                      />
                    </div>
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
                        i
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
        className="mt-4 block w-full bg-gray-200 px-4 py-2 text-left text-sm font-bold leading-5 text-gray-700 shadow-sm hover:bg-gray-300 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none"
      >
        + Add Investigation
      </button>
    </div>
  );
}
