import { VaccineRegistrationModel } from "./models";

const PatientVaccinationDetails = (props: any) => {
  return (
    <div className=" my-7 overflow-hidden rounded-xl border-2 border-gray-400 shadow-lg">
      <table className="w-full ">
        <thead className=" bg-gray-400 p-10">
          <tr className="space-x-12">
            <th className=" p-3 text-start text-lg font-bold">Vaccine Name</th>
            <th className=" p-3 text-start text-lg font-bold">
              Vaccination Date
            </th>
            <th className=" p-3 text-start text-lg font-bold">
              Number of Doses
            </th>
            <th className=" p-3 text-start text-lg font-bold">
              Vaccination Center
            </th>
          </tr>
        </thead>
        <tbody>
          {props.vaccineData?.map((detail: VaccineRegistrationModel) => (
            <tr className="space-x-16">
              <td className="p-4 font-semibold">{detail.vaccine_name.name}</td>
              <td className="p-4 font-semibold">
                {detail.last_vaccinated_date}
              </td>
              <td className="p-4 font-semibold">{detail.number_of_doses}</td>
              <td className="p-4 font-semibold">{detail.vaccination_center}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default PatientVaccinationDetails;
