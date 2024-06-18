import { formatDate } from "../../Utils/utils";

export const VaccinationDetailsView = (props: any) => {
  return (
    <div className=" my-4 w-full rounded-lg border border-gray-400">
      <div className="grid grid-cols-2 gap-x-20 gap-y-10 p-4">
        <div className=" flex flex-col gap-2">
          <span>Vaccination Center</span>
          <div
            className={props.fieldsClassName}
            id={"vaccinaton_center_display-div"}
          >
            {props.detailsObj.vaccination_center}
          </div>
        </div>
        <div className=" flex flex-col gap-2">
          <span>Number of Doses</span>
          <div
            className={props.fieldsClassName}
            id={"number_of_doses_display-div"}
          >
            {props.detailsObj.number_of_doses}
          </div>
        </div>
        <div className=" flex flex-col gap-2">
          <span>Vaccine Name</span>
          <div
            className={props.fieldsClassName}
            id={"vaccine_name_display-div"}
          >
            {props.detailsObj.vaccine_name}
          </div>
        </div>
        <div className=" flex flex-col gap-2">
          <span>Batch Number</span>
          <div
            className={props.fieldsClassName}
            id={"batch_number_display-div"}
          >
            {props.detailsObj.batch_number}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span>Last Date of Vaccination</span>
        </div>
        <div
          className={`${props.fieldsClassName} col-span-2`}
          id={"last_vaccinated_date_display-div"}
        >
          {formatDate(props.detailsObj.last_vaccinated_date)}
        </div>
      </div>
    </div>
  );
};
