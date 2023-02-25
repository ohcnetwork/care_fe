import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { listICD11Diagnosis } from "../../../Redux/actions";
import AutoCompleteAsync from "../../Form/AutoCompleteAsync";

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
  const dispatch: any = useDispatch();
  const fetchDisease = useCallback(
    async (search: string) => {
      const res = await dispatch(listICD11Diagnosis({ query: search }, ""));
      return (res?.data as Array<any>).reduce(
        (disease, cur) => disease.concat(cur.label),
        []
      );
    },
    [dispatch]
  );

  const setItem = (object: DiseaseDetails, i: number) => {
    setDiseases(
      diseases.map((disease, index) => (index === i ? object : disease))
    );
  };

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="mt-2">
      {diseases.map((cur, i) => (
        <div
          key={i}
          className={`border-2 ${
            activeIdx === i ? "border-primary-500" : "border-gray-500"
          } mb-2 border-dashed border-spacing-2 p-3 rounded-md text-sm text-gray-600`}
        >
          <div className="flex flex-wrap md:flex-row md:gap-4 gap-2 items-center mb-2">
            <h4 className="text-base font-medium text-gray-700">
              Disease No. {i + 1}
            </h4>
            <button
              type="button"
              className="h-full flex justify-center items-center gap-1.5 text-gray-100 rounded-md text-sm transition hover:bg-red-600 px-3 py-1 bg-red-500"
              onClick={() => {
                setDiseases(diseases.filter((_, index) => i != index));
              }}
            >
              Delete Disease
              <CareIcon className="care-l-trash-alt w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 flex-col">
            <div className="w-full">
              <div className="mb-2">
                Disease
                <span className="font-bold text-danger-500">{" *"}</span>
              </div>
              <AutoCompleteAsync
                placeholder="Disease"
                selected={cur.disease}
                fetchData={fetchDisease}
                optionLabel={(option) => option}
                onChange={(selected) => {
                  setItem(
                    {
                      ...cur,
                      disease: selected,
                    },
                    i
                  );
                }}
                className="-mt-1 z-10"
                onFocus={() => setActiveIdx(i)}
                onBlur={() => setActiveIdx(null)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-full">
                <div className="mb-1">Details</div>
                <input
                  type="text"
                  className="cui-input-base"
                  value={cur.details}
                  placeholder="Details"
                  onChange={(e) => {
                    setItem(
                      {
                        ...cur,
                        details: e.target.value,
                      },
                      i
                    );
                  }}
                  required
                />
              </div>
              <div className="w-full">
                <div className="mb-1">Date</div>
                <input
                  type="date"
                  className="cui-input-base"
                  value={cur.date}
                  placeholder="Date"
                  onChange={(e) => {
                    setItem(
                      {
                        ...cur,
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
      ))}
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
