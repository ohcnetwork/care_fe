import { PrescriptionDropdown } from "./PrescriptionDropdown";

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const vaccines = require("./assets/vaccines");

interface VaccinationBuilderProps<T> {
  vaccinations: T[];
  setVaccinations: React.Dispatch<React.SetStateAction<T[]>>;
}

export type VaccinationDetails = {
  vaccine?: string;
  doses?: number;
  last_vaccinated_date?: string;
};

export const emptyValues = {
  vaccines: "",
  doses: 0,
  last_vaccinated_date: "",
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
            className="border-b border-b-gray-500 border-dashed py-2 text-xs text-gray-600"
          >
            <div className="flex gap-2 flex-col md:flex-row">
              <div>
                Vaccine
                <PrescriptionDropdown
                  placeholder="Vaccine"
                  options={vaccines}
                  value={vaccination.vaccine || ""}
                  setValue={setVaccine}
                />
              </div>
              <div>
                Doses
                <input
                  type="number"
                  className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                  value={vaccination.doses}
                  placeholder="Doses"
                  min={0}
                  defaultValue={0}
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
                Date
                <input
                  type="date"
                  className="focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                  value={vaccination.last_vaccinated_date}
                  placeholder="Date"
                  onChange={(e) => {
                    setItem(
                      {
                        ...vaccination,
                        last_vaccinated_date: e.target.value,
                      },
                      i
                    );
                  }}
                  required
                />
              </div>
              <button
                type="button"
                className="text-gray-400 text-base transition hover:text-red-500"
                onClick={() => {
                  setVaccinations(
                    vaccinations.filter((vaccination, index) => i != index)
                  );
                }}
              >
                <i className="fas fa-trash" />
              </button>
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
