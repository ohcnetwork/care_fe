import vaccines from "./assets/vaccines.json";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { useState } from "react";
import AutoCompleteAsync from "../../Form/AutoCompleteAsync";

interface VaccinationBuilderProps<T> {
  vaccinations: T[];
  setVaccinations: React.Dispatch<React.SetStateAction<T[]>>;
}

export type VaccinationDetails = {
  vaccine?: string;
  doses?: number;
  date?: string;
  precision?: number;
};

export const emptyValues = {
  vaccine: "",
  doses: 0,
  date: "",
  precision: 0,
};

export default function VaccinationBuilder(
  props: VaccinationBuilderProps<VaccinationDetails>
) {
  const { vaccinations, setVaccinations } = props;

  const setItem = (object: VaccinationDetails, i: number) => {
    setVaccinations(
      vaccinations.map((vaccination, index) =>
        index === i ? object : vaccination
      )
    );
  };

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="mt-2">
      {vaccinations.map((vaccination, i) => {
        const setVaccine = (vaccine: string) => {
          setItem(
            {
              ...vaccination,
              vaccine,
            },
            i
          );
        };

        return (
          <div
            key={i}
            className={`border-2 ${
              activeIdx === i ? "border-primary-500" : "border-gray-500"
            } mb-2 border-dashed border-spacing-2 p-3 rounded-md text-sm text-gray-600`}
          >
            <div className="flex flex-wrap md:flex-row md:gap-4 gap-2 items-center mb-2">
              <h4 className="text-base font-medium text-gray-700">
                Vaccine No. {i + 1}
              </h4>
              <button
                type="button"
                className="h-full flex justify-center items-center gap-1.5 text-gray-100 rounded-md text-sm transition hover:bg-red-600 px-3 py-1 bg-red-500"
                onClick={() => {
                  setVaccinations(
                    vaccinations.filter((_, index) => i != index)
                  );
                }}
              >
                Delete Vaccine
                <CareIcon className="care-l-trash-alt w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 flex-col md:flex-row items-center md:mb-4">
              <div className="w-full">
                <div className="mb-2">
                  Vaccine
                  <span className="font-bold text-danger-500">{" *"}</span>
                </div>
                <AutoCompleteAsync
                  placeholder="Vaccine"
                  selected={vaccination.vaccine}
                  fetchData={(search) => {
                    return Promise.resolve(
                      vaccines.filter((vaccine: string) =>
                        vaccine.toLowerCase().includes(search.toLowerCase())
                      )
                    );
                  }}
                  optionLabel={(option) => option}
                  onChange={setVaccine}
                  className="-mt-1"
                  showNOptions={vaccines.length}
                  onFocus={() => setActiveIdx(i)}
                  onBlur={() => setActiveIdx(null)}
                />
              </div>
              <div className="flex gap-2">
                <div>
                  <div className="mb-1">Doses</div>
                  <input
                    type="number"
                    className="cui-input-base"
                    value={vaccination.doses}
                    placeholder="Doses"
                    min={0}
                    onChange={(e) => {
                      let value = parseInt(e.target.value);
                      if (value < 0) {
                        value = 0;
                      }
                      setItem(
                        {
                          ...vaccination,
                          doses: value,
                        },
                        i
                      );
                    }}
                    required
                  />
                </div>
                <div>
                  <div className="mb-1">Date</div>
                  <input
                    type="date"
                    className="cui-input-base"
                    value={vaccination.date}
                    placeholder="Date"
                    onChange={(e) => {
                      setItem(
                        {
                          ...vaccination,
                          date: e.target.value,
                        },
                        i
                      );
                    }}
                    required
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
          setVaccinations([...vaccinations, emptyValues]);
        }}
        className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
      >
        + Add Vaccination History
      </button>
    </div>
  );
}
