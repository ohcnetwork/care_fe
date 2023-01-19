import { useState } from "react";
import { PrescriptionDropdown } from "./PrescriptionDropdown";

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
      procedures.map((procedure, index) => (index === i ? object : procedure))
    );
  };

  return (
    <div className="mt-2">
      {procedures.map((procedure, i) => {
        return (
          <div
            key={i}
            className={`border-2 ${
              activeIdx === i ? "border-primary-500" : "border-gray-500"
            } mb-3 border-dashed border-spacing-2 p-3 rounded-lg text-sm text-gray-600`}
          >
            <div className="flex gap-2 flex-col md:flex-row">
              <div className="flex flex-col gap-2 flex-1 w-full">
                <div className="flex gap-4 items-center">
                  <h4 className="text-base font-medium text-gray-700">
                    Procedure No. {i + 1}
                  </h4>
                  <button
                    type="button"
                    className="h-full flex justify-center items-center gap-2 text-gray-100 rounded-md text-sm transition hover:bg-red-600 px-3 py-1 bg-red-500"
                    onClick={() =>
                      setProcedures(
                        procedures.filter((procedure, index) => i != index)
                      )
                    }
                  >
                    Delete Procedure
                    <i className="fas fa-trash" />
                  </button>
                </div>
                <div className="w-full">
                  Procedure Name
                  <input
                    type="text"
                    className="mt-1 w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
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
                        i
                      );
                    }}
                  />
                </div>
                <div className="flex gap-2 md:gap-4 flex-col md:flex-row">
                  <div className="shrink-0 flex gap-2 items-center md:mt-3 cursor-pointer">
                    Is the procedure repetitive?
                    <br />
                    <input
                      type="checkbox"
                      onFocus={() => setActiveIdx(i)}
                      onBlur={() => setActiveIdx(null)}
                      className="inline-block rounded-md w-[18px] h-[18px]"
                      checked={procedure?.repetitive || false}
                      onChange={(e) => {
                        setItem(
                          {
                            ...procedure,
                            repetitive: e.currentTarget.checked,
                          },
                          i
                        );
                      }}
                    />
                  </div>
                  {procedure.repetitive ? (
                    <div className="w-full">
                      <div className="mb-1">Frequency</div>
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
                            i
                          );
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full">
                      Time
                      <input
                        type="datetime-local"
                        className="w-[calc(100%-5px)] focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                        value={procedure.time || ""}
                        onFocus={() => setActiveIdx(i)}
                        onBlur={() => setActiveIdx(null)}
                        onChange={(e) => {
                          setItem(
                            {
                              ...procedure,
                              time: e.currentTarget.value,
                            },
                            i
                          );
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="w-full">
                  Notes
                  <input
                    type="text"
                    className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
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
                        i
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
        className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
      >
        + Add Procedures
      </button>
    </div>
  );
}
