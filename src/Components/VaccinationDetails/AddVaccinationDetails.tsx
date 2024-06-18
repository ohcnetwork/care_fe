import { useState } from "react";
import TextFormField from "../Form/FormFields/TextFormField";
import DateFormField from "../Form/FormFields/DateFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import Spinner from "../Common/Spinner";

const initForm: any = {
  vaccination_center: "",
  number_of_doses: "",
  vaccine_name: "",
  batch_number: "",
  last_vaccinated_date: "",
};
export const AddVaccinationDetails = (props: any) => {
  const [state, setState] = useState<any>({ ...initForm });
  const handleFormFieldChange = (e: any) => {
    setState((prev: any) => {
      return {
        ...prev,
        [e.name]: e.value,
      };
    });
  };
  const hasError = props.disallowed.includes(state.vaccine_name);
  return (
    <div className=" flex flex-col gap-2">
      <div className="grid w-full grid-cols-1 gap-4 rounded-lg border border-gray-400 bg-gray-100 px-4 pt-4 shadow-md md:grid-cols-2 xl:gap-x-20 xl:gap-y-6">
        <div id="vaccination_center-div">
          <TextFormField
            label="Vaccination Center"
            name="vaccination_center"
            value={state.vaccination_center}
            onChange={handleFormFieldChange}
            type="text"
          />
        </div>

        <div id="number_of_doses-div">
          <TextFormField
            label="Number of Doses"
            name="number_of_doses"
            value={state.number_of_doses}
            onChange={handleFormFieldChange}
            type="number"
            min={1}
          />
        </div>
        <div id="vaccine_name-div">
          {props.vaccinesLoading ? (
            <Spinner />
          ) : (
            <AutocompleteFormField
              name="vaccine_name"
              value={state.vaccine_name}
              onChange={handleFormFieldChange}
              label="Vaccine Name"
              options={props.vaccines}
              optionLabel={(o: any) => o.name}
              optionValue={(o) => o.name}
              error={hasError ? "This vaccine was already added" : undefined}
            />
          )}
        </div>

        <div id="batch_number-div">
          <TextFormField
            label="Batch Number"
            name="batch_number"
            value={state.batch_number}
            onChange={handleFormFieldChange}
            type="text"
          />
        </div>

        <div className=" col-span-2" id="last_vaccinated_date-div">
          <DateFormField
            name="last_vaccinated_date"
            value={state.last_vaccinated_date}
            onChange={handleFormFieldChange}
            label="Last Date of Vaccination"
            disableFuture={true}
            position="LEFT"
          />
        </div>
      </div>
      <div className=" my-3">
        <ButtonV2
          disabled={
            (Object.values(state).reduce((acc, val) => {
              return acc || val === "";
            }, false) as boolean) || hasError
          }
          variant="alert"
          onClick={(e) => {
            e.preventDefault();
            props.onAdd(state);
            setState({ ...initForm });
          }}
        >
          + Add Vaccination Details
        </ButtonV2>
      </div>
    </div>
  );
};
