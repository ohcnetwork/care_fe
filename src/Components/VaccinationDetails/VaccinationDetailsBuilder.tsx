import CareIcon from "../../CAREUI/icons/CareIcon";
import { AddVaccinationDetails } from "./AddVaccinationDetails";
import { VaccinationDetailsEntry } from "./VaccinationDetailsEntry";

export const VaccinationDetailsBuilder = (props: any) => {
  return (
    <div className=" flex w-full flex-col gap-4 rounded-lg border border-gray-400 bg-gray-200 p-8 shadow-md">
      {props.value.length !== 0 && (
        <div className="my-7 flex flex-col gap-8">
          {props.value.map((detail: any, idx: any) => (
            <div className="flex w-full gap-2 rounded-lg border border-gray-400 p-3 shadow-md">
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

      <div>
        <AddVaccinationDetails
          vaccinesLoading={props.vaccinesLoading}
          vaccines={props.vaccineOptions}
          disallowed={props.value.map((obj: any) => obj.vaccine_name)}
          onAdd={(details: any) => {
            props.onChange([...props.value, details]);
          }}
        />
      </div>
    </div>
  );
};
