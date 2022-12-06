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
            className="border-b border-b-gray-500 border-dashed py-2 text-xs text-gray-600"
          >
            <div className="flex gap-2 flex-col">
              <div className="flex flex-col gap-2 md:flex-row w-full shrink-0 justify-between">
                <div className="w-full">
                  Procedure
                  <input
                    type="text"
                    className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                    placeholder="Procedure"
                    maxLength={100}
                    value={procedure.procedure || ""}
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
                <div className="flex gap-2 flex-col md:flex-row">
                  <div className="shrink-0">
                    Repetitive
                    <br />
                    <input
                      type="checkbox"
                      className="mt-2 inline-block"
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
                      Frequency
                      <PrescriptionDropdown
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
              </div>
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-full">
                  Notes
                  <input
                    type="text"
                    className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                    placeholder="Notes"
                    value={procedure.notes || ""}
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
                <button
                  type="button"
                  className="text-gray-400 text-base transition hover:text-red-500 mt-3 ml-2"
                  onClick={() =>
                    setProcedures(
                      procedures.filter((procedure, index) => i != index)
                    )
                  }
                >
                  <i className="fas fa-trash" />
                </button>
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
