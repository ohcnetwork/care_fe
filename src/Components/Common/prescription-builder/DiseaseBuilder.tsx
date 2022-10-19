import { PrescriptionDropdown } from "./PrescriptionDropdown";

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const vaccines = require("./assets/vaccines");

interface DiseaseBuilderProps<T> {
  diseases: T[];
  setDiseases: React.Dispatch<React.SetStateAction<T[]>>;
}

export type DiseaseDetails = {
  disease?: string;
  details?: string;
  date?: string;
  precision?: number;
};

export const emptyValues = {
  disease: "",
  details: "",
  date: "",
  precision: 0,
};

export default function DiseaseBuilder(
  props: DiseaseBuilderProps<DiseaseDetails>
) {
  const { diseases, setDiseases } = props;

  const setItem = (object: DiseaseDetails, i: number) => {
    setDiseases(
      diseases.map((disease, index) => (index === i ? object : disease))
    );
  };

  return (
    <div className="mt-2">
      {diseases.map((disease, i) => {
        const setDisease = (dis: string) => {
          setItem(
            {
              ...disease,
              disease: dis,
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
                  value={disease.disease || ""}
                  setValue={setDisease}
                />
              </div>
              <div>
                Doses
                <input
                  type="string"
                  className="w-full focus:ring-primary-500 focus:border-primary-500 block border border-gray-400 rounded py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 focus:outline-none focus:bg-white"
                  value={disease.details}
                  placeholder="Details"
                  onChange={(e) => {
                    setItem(
                      {
                        ...disease,
                        details: e.target.value,
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
                  value={disease.date}
                  placeholder="Date"
                  onChange={(e) => {
                    setItem(
                      {
                        ...disease,
                        date: e.target.value,
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
                  setDiseases(diseases.filter((disease, index) => i != index));
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
          setDiseases([...diseases, emptyValues]);
        }}
        className="shadow-sm mt-4 bg-gray-200 w-full font-bold block px-4 py-2 text-sm leading-5 text-left text-gray-700 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900"
      >
        + Add Disease History
      </button>
    </div>
  );
}
