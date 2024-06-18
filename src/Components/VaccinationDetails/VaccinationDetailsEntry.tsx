import AccordionV2 from "../Common/components/AccordionV2";
import { VaccinationDetailsView } from "./VaccinationDetailsView";

export const VaccinationDetailsEntry = (props: any) => {
  return (
    <div className=" w-full rounded-lg border border-gray-400 bg-white p-3">
      <AccordionV2
        title={
          <div>
            <div className=" text-lg font-semibold text-gray-600">
              {props.detailsObj.vaccine_name} Details
            </div>
          </div>
        }
      >
        <VaccinationDetailsView
          vaccineNameFunc={props.vaccineNameFunc}
          detailsObj={props.detailsObj}
          fieldsClassName={props.fieldsClassName}
        />
      </AccordionV2>
    </div>
  );
};
