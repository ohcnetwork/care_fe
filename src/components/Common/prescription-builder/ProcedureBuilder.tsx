import dayjs from "dayjs";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { PrescriptionDropdown } from "@/components/Common/prescription-builder/PrescriptionDropdown";
import DateFormField from "@/components/Form/FormFields/DateFormField";

export type ProcedureType = {
  procedure?: string;
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

export interface Props<T> {
  procedures: T[];
  setProcedures: React.Dispatch<React.SetStateAction<T[]>>;
}

export default function ProcedureBuilder(props: Props<ProcedureType>) {
  const { procedures, setProcedures } = props;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const setItem = (object: ProcedureType, i: number) => {
    setProcedures(
      procedures.map((procedure, index) => (index === i ? object : procedure)),
    );
  };

  return (
    <div className="mt-2">
      {procedures.map((procedure, i) => {
        return (
          <div
            key={i}
            className={`border-2 ${
              activeIdx === i ? "border-primary-500" : "border-secondary-500"
            } mb-2 border-spacing-2 rounded-md border-dashed p-3 text-sm text-secondary-600`}
          >
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="flex w-full flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 md:flex-row md:gap-4">
                  <h4 className="text-base font-medium text-secondary-700">
                    Procedure No. {i + 1}
                  </h4>
                  <button
                    type="button"
                    className="flex h-full items-center justify-center gap-2 rounded-md bg-red-500 px-3 py-1 text-sm text-secondary-100 transition hover:bg-red-600"
                    onClick={() =>
                      setProcedures(
                        procedures.filter((procedure, index) => i != index),
                      )
                    }
                  >
                    Delete Procedure
                    <CareIcon icon="l-trash-alt" className="h-4 w-4" />
                  </button>
                </div>
                <div className="w-full">
                  Procedure
                  <span className="text-danger-500">{" *"}</span>
                  <input
                    id="procedure-name"
                    type="text"
                    className="mt-1 block w-full rounded border border-secondary-400 bg-secondary-100 px-4 py-2 text-sm hover:bg-secondary-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-primary-500"
                    placeholder="Procedure"
                    maxLength={100}
                    value={procedure.procedure || ""}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                    onChange={(e) => {
                      setItem(
                        {
                          ...procedure,
                          procedure: e.currentTarget.value,
                        },
                        i,
                      );
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                  <div className="flex shrink-0 cursor-pointer items-center gap-2 md:mt-3">
                    Is the procedure repetitive?
                    <br />
                    <input
                      type="checkbox"
                      onFocus={() => setActiveIdx(i)}
                      onBlur={() => setActiveIdx(null)}
                      className="inline-block h-[18px] w-[18px] rounded-md"
                      checked={procedure?.repetitive || false}
                      onChange={(e) => {
                        setItem(
                          {
                            ...procedure,
                            repetitive: e.currentTarget.checked,
                          },
                          i,
                        );
                      }}
                    />
                  </div>
                  {procedure.repetitive ? (
                    <div className="w-full">
                      <div className="mb-1">
                        Frequency
                        <span className="text-danger-500">{" *"}</span>
                      </div>
                      <PrescriptionDropdown
                        onFocus={() => setActiveIdx(i)}
                        onBlur={() => setActiveIdx(null)}
                        placeholder="Frequency"
                        options={FREQUENCY}
                        value={procedure.frequency || ""}
                        setValue={(frequency: string) => {
                          setItem(
                            {
                              ...procedure,
                              frequency,
                            },
                            i,
                          );
                        }}
                      />
                    </div>
                  ) : (
                    <DateFormField
                      id="procedure-time"
                      name="procedure-time"
                      label="Time"
                      required
                      value={
                        !procedure.time ? new Date() : new Date(procedure.time)
                      }
                      onChange={(e) =>
                        setItem(
                          {
                            ...procedure,
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
                    className="block w-full rounded border border-secondary-400 bg-secondary-100 px-4 py-2 text-sm hover:bg-secondary-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-primary-500"
                    placeholder="Notes"
                    value={procedure.notes || ""}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                    onChange={(e) => {
                      setItem(
                        {
                          ...procedure,
                          notes: e.currentTarget.value,
                        },
                        i,
                      );
                    }}
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
          setProcedures([...procedures, { repetitive: false }]);
        }}
        className="mt-4 block w-full bg-secondary-200 px-4 py-2 text-left text-sm font-bold leading-5 text-secondary-700 shadow-sm hover:bg-secondary-300 hover:text-secondary-900 focus:bg-secondary-100 focus:text-secondary-900 focus:outline-none"
      >
        + Add Procedures
      </button>
    </div>
  );
}
