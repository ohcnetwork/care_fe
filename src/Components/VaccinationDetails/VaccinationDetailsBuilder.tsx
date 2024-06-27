import { useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { AddVaccinationDetails } from "./AddVaccinationDetails";
import { VaccinationDetailsEntry } from "./VaccinationDetailsEntry";
import { VaccineRegistrationModel } from "../Patient/models";
import ButtonV2 from "../Common/components/ButtonV2";

const initialState: VaccineRegistrationModel = {
  vaccination_center: "",
  number_of_doses: "",
  vaccine_name: "",
  batch_number: "",
  last_vaccinated_date: "",
};
export const VaccinationDetailsBuilder = (props: any) => {
  const [vaccineDetailState, setVaccineDetailState] =
    useState<VaccineRegistrationModel>(initialState);
  const [vaccineFormError, setVaccineFormError] = useState("");

  const validateVaccineDetails = (detail: any) => {
    const vaccine_names = props.value.map((val: any) => val.vaccine_name);
    if (vaccine_names.includes(detail.vaccine_name)) {
      setVaccineFormError("This Vaccine is already selected");
      return false;
    }
    return true;
  };

  return (
    <div className=" flex w-full flex-col gap-4 rounded-lg border border-gray-400 bg-gray-200 p-8 shadow-md">
      {props.value.length !== 0 && (
        <div className="my-7 flex flex-col gap-8">
          {props.value.map((detail: any, idx: any) => (
            <div className="flex w-full gap-2 rounded-lg border border-gray-400 p-3 shadow-md">
              <div>
                <CareIcon
                  className="mt-3 cursor-pointer text-3xl text-red-600"
                  icon={"l-trash-alt"}
                  onClick={() => {
                    props.onChange(
                      props.value.filter((_: any, index: any) => {
                        return index !== idx;
                      }),
                    );
                  }}
                />
              </div>
              <VaccinationDetailsEntry
                detailsObj={detail}
                fieldsClassName="min-w-fit border text-sm text-black rounded-md border-gray-400 p-3"
              />
            </div>
          ))}
        </div>
      )}
      <div>
        {props.value.length === 0 && (
          <div className=" p-6 text-center text-lg font-semibold text-gray-500">
            Atleast One Vaccination Details Entry must be added
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <AddVaccinationDetails
          name="vaccine_Form"
          value={vaccineDetailState}
          error={vaccineFormError}
          onChange={({ value }: any) => setVaccineDetailState(value)}
        />
        <div className=" my-3">
          <ButtonV2
            variant="alert"
            disabled={
              (Object.values(vaccineDetailState).reduce((acc, val) => {
                return acc || val === "";
              }, false) as boolean) && vaccineFormError == ""
            }
            onClick={(e) => {
              e.preventDefault();
              if (!validateVaccineDetails(vaccineDetailState)) return;
              props.onChange([...props.value, { ...vaccineDetailState }]);
              setVaccineDetailState({ ...initialState });
              setVaccineFormError("");
            }}
          >
            <CareIcon icon="l-plus" className="text-lg" />
            <span>Add Vaccination Details</span>
          </ButtonV2>
        </div>
      </div>
    </div>
  );
};
