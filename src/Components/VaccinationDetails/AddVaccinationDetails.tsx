import TextFormField from "../Form/FormFields/TextFormField";
import DateFormField from "../Form/FormFields/DateFormField";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import Spinner from "../Common/Spinner";
import FormField from "../Form/FormFields/FormField";
import {
  FieldChangeEvent,
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { VaccineRegistrationModel, VaccinesData } from "../Patient/models";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";

type Props = FormFieldBaseProps<VaccineRegistrationModel>;
export const AddVaccinationDetails = (props: Props) => {
  const field = useFormFieldPropsResolver(props);
  const { data: vaccines, loading: isVaccinesLoading } = useQuery(
    routes.getVaccines,
  );
  const handleVaccineDetailChange = (event: FieldChangeEvent<unknown>) => {
    const fieldName: string = event.name;
    const fieldValue: any = event.value;
    field.handleChange({
      ...props.value,
      [fieldName]: fieldValue,
    });
  };

  return (
    <FormField field={field}>
      <VaccinationDetailsFormCard
        vaccineDetails={props.value}
        vaccineDetailChange={handleVaccineDetailChange}
        fetchedVaccines={vaccines?.results || []}
        fetchedVaccinesLoading={isVaccinesLoading}
      />
    </FormField>
  );
};

const VaccinationDetailsFormCard = ({
  vaccineDetails,
  vaccineDetailChange,
  fetchedVaccines,
  fetchedVaccinesLoading,
}: {
  vaccineDetails?: VaccineRegistrationModel;
  vaccineDetailChange: (event: FieldChangeEvent<unknown>) => void;
  fetchedVaccines: VaccinesData[];
  fetchedVaccinesLoading?: boolean;
}) => {
  return (
    <div className="grid w-full grid-cols-1 gap-4 rounded-lg border border-gray-400 bg-gray-100 px-4 pt-4 shadow-md md:grid-cols-2 xl:gap-x-20 xl:gap-y-6">
      <div id="vaccination_center-div">
        <TextFormField
          label="Vaccination Center"
          name="vaccination_center"
          value={vaccineDetails?.vaccination_center}
          onChange={vaccineDetailChange}
          type="text"
        />
      </div>

      <div id="number_of_doses-div">
        <TextFormField
          label="Number of Doses"
          name="number_of_doses"
          value={vaccineDetails?.number_of_doses}
          onChange={vaccineDetailChange}
          type="number"
          min={1}
        />
      </div>
      <div id="vaccine_name-div">
        {fetchedVaccinesLoading ? (
          <Spinner />
        ) : (
          <AutocompleteFormField
            name="vaccine_name"
            value={vaccineDetails?.vaccine_name}
            onChange={vaccineDetailChange}
            label="Vaccine Name"
            options={fetchedVaccines}
            optionLabel={(o: any) => o.name}
            optionValue={(o) => o.name}
          />
        )}
      </div>

      <div id="batch_number-div">
        <TextFormField
          label="Batch Number"
          name="batch_number"
          value={vaccineDetails?.batch_number}
          onChange={vaccineDetailChange}
          type="text"
        />
      </div>

      <div className=" col-span-2" id="last_vaccinated_date-div">
        <DateFormField
          name="last_vaccinated_date"
          value={vaccineDetails?.last_vaccinated_date}
          onChange={vaccineDetailChange}
          label="Last Date of Vaccination"
          disableFuture={true}
          position="LEFT"
        />
      </div>
    </div>
  );
};
