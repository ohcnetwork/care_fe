import dayjs from "dayjs";
import CareIcon from "../../CAREUI/icons/CareIcon";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";
import {
  ADMITTED_TO,
  DISCHARGE_REASONS,
  DISEASE_STATUS,
  FACILITY_TYPES,
  GENDER_TYPES,
  PATIENT_FILTER_CATEGORIES,
} from "../../Common/constants";
import useConfig from "../../Common/hooks/useConfig";
import useMergeState from "../../Common/hooks/useMergeState";
import { dateQueryString } from "../../Utils/utils";
import { DateRange } from "../Common/DateRangeInputV2";
import { FacilitySelect } from "../Common/FacilitySelect";
import { LocationSelect } from "../Common/LocationSelect";
import AccordionV2 from "../Common/components/AccordionV2";
import DistrictSelect from "../Facility/FacilityFilter/DistrictSelect";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import DateRangeFormField from "../Form/FormFields/DateRangeFormField";
import { FieldLabel } from "../Form/FormFields/FormField";
import TextFormField from "../Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FieldChangeEventHandler,
} from "../Form/FormFields/Utils";
import MultiSelectMenuV2 from "../Form/MultiSelectMenuV2";
import SelectMenuV2 from "../Form/SelectMenuV2";
import DiagnosesFilter, { FILTER_BY_DIAGNOSES_KEYS } from "./DiagnosesFilter";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

export default function PatientFilter(props: any) {
  const { kasp_enabled, kasp_string } = useConfig();
  const { filter, onChange, closeFilter, removeFilters } = props;

  const [filterState, setFilterState] = useMergeState({
    district: filter.district || "",
    facility: filter.facility || "",
    facility_type: filter.facility_type || "",
    lsgBody: filter.lsgBody || "",
    facility_ref: null,
    lsgBody_ref: null,
    district_ref: null,
    date_declared_positive_before: filter.date_declared_positive_before || null,
    date_declared_positive_after: filter.date_declared_positive_after || null,
    date_of_result_before: filter.date_of_result_before || null,
    date_of_result_after: filter.date_of_result_after || null,
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    modified_date_before: filter.modified_date_before || null,
    modified_date_after: filter.modified_date_after || null,
    category: filter.category || null,
    gender: filter.gender || null,
    disease_status: filter.disease_status || null,
    age_min: filter.age_min || null,
    age_max: filter.age_max || null,
    date_of_result: filter.date_of_result || null,
    date_declared_positive: filter.date_declared_positive || null,
    last_consultation_medico_legal_case:
      filter.last_consultation_medico_legal_case || null,
    last_consultation_encounter_date_before:
      filter.last_consultation_encounter_date_before || null,
    last_consultation_encounter_date_after:
      filter.last_consultation_encounter_date_after || null,
    last_consultation_discharge_date_before:
      filter.last_consultation_discharge_date_before || null,
    last_consultation_discharge_date_after:
      filter.last_consultation_discharge_date_after || null,
    last_consultation_admitted_bed_type_list:
      filter.last_consultation_admitted_bed_type_list
        ? filter.last_consultation_admitted_bed_type_list.split(",")
        : [],
    last_consultation_current_bed__location:
      filter.last_consultation_current_bed__location || "",
    last_consultation__new_discharge_reason:
      filter.last_consultation__new_discharge_reason || null,
    srf_id: filter.srf_id || null,
    number_of_doses: filter.number_of_doses || null,
    covin_id: filter.covin_id || null,
    is_kasp: filter.is_kasp || null,
    is_declared_positive: filter.is_declared_positive || null,
    last_consultation_symptoms_onset_date_before:
      filter.last_consultation_symptoms_onset_date_before || null,
    last_consultation_symptoms_onset_date_after:
      filter.last_consultation_symptoms_onset_date_after || null,
    last_vaccinated_date_before: filter.last_vaccinated_date_before || null,
    last_vaccinated_date_after: filter.last_vaccinated_date_after || null,
    last_consultation_is_telemedicine:
      filter.last_consultation_is_telemedicine || null,
    is_antenatal: filter.is_antenatal || null,
    ventilator_interface: filter.ventilator_interface || null,
    diagnoses: filter.diagnoses || null,
    diagnoses_confirmed: filter.diagnoses_confirmed || null,
    diagnoses_provisional: filter.diagnoses_provisional || null,
    diagnoses_unconfirmed: filter.diagnoses_unconfirmed || null,
    diagnoses_differential: filter.diagnoses_differential || null,
    review_missed: filter.review_missed || null,
  });

  useQuery(routes.getAnyFacility, {
    pathParams: { id: filter.facility },
    prefetch: !!filter.facility,
    onResponse: ({ data }) => setFilterState({ facility_ref: data }),
  });

  useQuery(routes.getDistrict, {
    pathParams: { id: filter.district },
    prefetch: !!filter.district,
    onResponse: ({ data }) => setFilterState({ district_ref: data }),
  });

  useQuery(routes.getLocalBody, {
    pathParams: { id: filter.lsgBody },
    prefetch: !!filter.lsgBody,
    onResponse: ({ data }) => setFilterState({ lsgBody_ref: data }),
  });

  const VACCINATED_FILTER = [
    { id: "0", text: "Unvaccinated" },
    { id: "1", text: "1st dose only" },
    { id: "2", text: "Both doses" },
    { id: "3", text: "Booster dose" },
  ];

  const DECLARED_FILTER = [
    { id: "false", text: "Not Declared" },
    { id: "true", text: "Declared" },
  ];

  const RESPIRATORY_SUPPORT_FILTER = [
    { id: "UNKNOWN", text: "None" },
    { id: "OXYGEN_SUPPORT", text: "O2 Support" },
    { id: "NON_INVASIVE", text: "NIV" },
    { id: "INVASIVE", text: "IV" },
  ];

  const TELEMEDICINE_FILTER = [
    { id: "true", text: "Yes" },
    { id: "false", text: "No" },
  ];

  const setFilterWithRef = (name: string, selected?: any) => {
    setFilterState({
      [`${name}_ref`]: selected,
      [name]: selected?.id,
    });
  };

  const lsgSearch = async (search: string) => {
    const { data } = await request(routes.getAllLocalBody, {
      query: { local_body_name: search },
    });
    return data?.results;
  };

  const applyFilter = () => {
    const {
      district,
      facility,
      facility_type,
      lsgBody,
      date_declared_positive_before,
      date_declared_positive_after,
      date_of_result_before,
      date_of_result_after,
      created_date_before,
      created_date_after,
      modified_date_before,
      modified_date_after,
      category,
      gender,
      disease_status,
      age_min,
      age_max,
      date_of_result,
      last_consultation_medico_legal_case,
      last_consultation_encounter_date_before,
      last_consultation_encounter_date_after,
      last_consultation_discharge_date_before,
      last_consultation_discharge_date_after,
      last_consultation_admitted_bed_type_list,
      last_consultation__new_discharge_reason,
      last_consultation_current_bed__location,
      number_of_doses,
      covin_id,
      srf_id,
      is_kasp,
      is_declared_positive,
      last_consultation_symptoms_onset_date_before,
      last_consultation_symptoms_onset_date_after,
      last_vaccinated_date_before,
      last_vaccinated_date_after,
      last_consultation_is_telemedicine,
      is_antenatal,
      ventilator_interface,
      diagnoses,
      diagnoses_confirmed,
      diagnoses_provisional,
      diagnoses_unconfirmed,
      diagnoses_differential,
      review_missed,
    } = filterState;
    const data = {
      district: district || "",
      lsgBody: lsgBody || "",
      facility: facility || "",
      last_consultation_current_bed__location:
        last_consultation_current_bed__location || "",
      facility_type: facility_type || "",
      date_declared_positive_before: dateQueryString(
        date_declared_positive_before
      ),
      date_declared_positive_after: dateQueryString(
        date_declared_positive_after
      ),
      date_of_result_before: dateQueryString(date_of_result_before),
      date_of_result_after: dateQueryString(date_of_result_after),
      created_date_before: dateQueryString(created_date_before),
      created_date_after: dateQueryString(created_date_after),
      modified_date_before: dateQueryString(modified_date_before),
      modified_date_after: dateQueryString(modified_date_after),
      date_of_result: dateQueryString(date_of_result),
      last_consultation_medico_legal_case:
        last_consultation_medico_legal_case || "",
      last_consultation_encounter_date_before: dateQueryString(
        last_consultation_encounter_date_before
      ),
      last_consultation_encounter_date_after: dateQueryString(
        last_consultation_encounter_date_after
      ),
      last_consultation_discharge_date_before: dateQueryString(
        last_consultation_discharge_date_before
      ),
      last_consultation_discharge_date_after: dateQueryString(
        last_consultation_discharge_date_after
      ),
      category: category || "",
      gender: gender || "",
      disease_status:
        (disease_status == "Show All" ? "" : disease_status) || "",
      age_min: age_min || "",
      age_max: age_max || "",
      last_consultation_admitted_bed_type_list:
        last_consultation_admitted_bed_type_list || [],
      last_consultation__new_discharge_reason:
        last_consultation__new_discharge_reason || "",
      srf_id: srf_id || "",
      number_of_doses: number_of_doses || "",
      covin_id: covin_id || "",
      is_kasp: is_kasp || "",
      is_declared_positive: is_declared_positive || "",
      last_consultation_symptoms_onset_date_before: dateQueryString(
        last_consultation_symptoms_onset_date_before
      ),
      last_consultation_symptoms_onset_date_after: dateQueryString(
        last_consultation_symptoms_onset_date_after
      ),
      last_vaccinated_date_before: dateQueryString(last_vaccinated_date_before),
      last_vaccinated_date_after: dateQueryString(last_vaccinated_date_after),
      last_consultation_is_telemedicine:
        last_consultation_is_telemedicine || "",
      is_antenatal: is_antenatal || "",
      ventilator_interface: ventilator_interface || "",
      diagnoses: diagnoses || "",
      diagnoses_confirmed: diagnoses_confirmed || "",
      diagnoses_provisional: diagnoses_provisional || "",
      diagnoses_unconfirmed: diagnoses_unconfirmed || "",
      diagnoses_differential: diagnoses_differential || "",
      review_missed: review_missed || "",
    };
    onChange(data);
  };

  const handleDateRangeChange = (event: FieldChangeEvent<DateRange>) => {
    const filterData: any = { ...filterState };
    filterData[`${event.name}_after`] = event.value.start?.toString();
    filterData[`${event.name}_before`] = event.value.end?.toString();
    setFilterState(filterData);
  };

  const handleFormFieldChange: FieldChangeEventHandler<string> = (event) =>
    setFilterState({ ...filterState, [event.name]: event.value });

  return (
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        removeFilters();
        closeFilter();
      }}
    >
      <AccordionV2
        title={
          <h1 className="mb-4 text-left text-xl font-bold text-purple-500">
            Patient Details based
          </h1>
        }
        expanded={true}
        className="w-full rounded-md"
      >
        <div className="grid w-full grid-cols-1 gap-4">
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Gender</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={GENDER_TYPES}
              optionLabel={(o) => o.text}
              optionIcon={(o) => <i className="text-base">{o.icon}</i>}
              optionValue={(o) => o.id}
              value={filterState.gender}
              onChange={(v) => setFilterState({ ...filterState, gender: v })}
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Category</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={PATIENT_FILTER_CATEGORIES}
              optionLabel={(o) => o.text}
              optionValue={(o) => o.id}
              value={filterState.category}
              onChange={(v) => setFilterState({ ...filterState, category: v })}
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Age</FieldLabel>
            <div className="flex justify-between gap-4">
              <TextFormField
                name="age_min"
                placeholder="Min. age"
                label={null}
                value={
                  filterState.age_min &&
                  (filterState.age_min > 0 ? filterState.age_min : 0)
                }
                type="number"
                min={0}
                onChange={handleFormFieldChange}
                errorClassName="hidden"
              />
              <TextFormField
                name="age_max"
                placeholder="Max. age"
                label={null}
                type="number"
                min={0}
                value={
                  filterState.age_max &&
                  (filterState.age_max > 0 ? filterState.age_max : 0)
                }
                onChange={handleFormFieldChange}
                errorClassName="hidden"
              />
            </div>
          </div>
          <div className="w-full flex-none" id="bed-type-select">
            <FieldLabel className="text-sm">Admitted to (Bed Types)</FieldLabel>
            <MultiSelectMenuV2
              id="last_consultation_admitted_bed_type_list"
              placeholder="Select bed types"
              options={ADMITTED_TO}
              value={filterState.last_consultation_admitted_bed_type_list}
              optionValue={(o) => o.id}
              optionLabel={(o) => o.text}
              onChange={(o) =>
                setFilterState({
                  ...filterState,
                  last_consultation_admitted_bed_type_list: o,
                })
              }
            />
          </div>
          <div className="w-full flex-none" id="discharge-reason-select">
            <FieldLabel className="text-sm">Discharge Reason</FieldLabel>
            <SelectMenuV2
              id="last_consultation__new_discharge_reason"
              placeholder="Select discharge reason"
              options={DISCHARGE_REASONS}
              value={filterState.last_consultation__new_discharge_reason}
              optionValue={(o) => o.id}
              optionLabel={(o) => o.text}
              onChange={(o) =>
                setFilterState({
                  ...filterState,
                  last_consultation__new_discharge_reason: o,
                })
              }
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Telemedicine</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={TELEMEDICINE_FILTER}
              optionLabel={(o) => o.text}
              optionValue={(o) => o.id}
              value={filterState.last_consultation_is_telemedicine}
              onChange={(v) =>
                setFilterState({
                  ...filterState,
                  last_consultation_is_telemedicine: v,
                })
              }
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Respiratory Support</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={RESPIRATORY_SUPPORT_FILTER}
              optionLabel={(o) => o.text}
              optionValue={(o) => o.id}
              value={filterState.ventilator_interface}
              onChange={(v) =>
                setFilterState({
                  ...filterState,
                  ventilator_interface: v,
                })
              }
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Is Antenatal</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={["true", "false"]}
              optionLabel={(o) =>
                o === "true" ? "Antenatal" : "Non-antenatal"
              }
              value={filterState.is_antenatal}
              onChange={(v) =>
                setFilterState({ ...filterState, is_antenatal: v })
              }
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Review Missed</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={["true", "false"]}
              optionLabel={(o) => (o === "true" ? "Yes" : "No")}
              value={filterState.review_missed}
              onChange={(v) =>
                setFilterState({ ...filterState, review_missed: v })
              }
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">Is Medico-Legal Case</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={["true", "false"]}
              optionLabel={(o) =>
                o === "true" ? "Medico-Legal" : "Non-Medico-Legal"
              }
              value={filterState.last_consultation_medico_legal_case}
              onChange={(v) =>
                setFilterState({
                  ...filterState,
                  last_consultation_medico_legal_case: v,
                })
              }
            />
          </div>
        </div>
      </AccordionV2>
      <AccordionV2
        title={
          <h1 className="mb-4 text-left text-xl font-bold text-purple-500">
            ICD-11 Diagnoses based
          </h1>
        }
        expanded
        className="w-full"
      >
        {FILTER_BY_DIAGNOSES_KEYS.map((name) => (
          <DiagnosesFilter
            key={name}
            name={name}
            value={filterState[name]}
            onChange={handleFormFieldChange}
          />
        ))}
      </AccordionV2>
      <AccordionV2
        title={
          <h1 className="mb-4 text-left text-xl font-bold text-purple-500">
            Date based
          </h1>
        }
        expanded={true}
        className="w-full rounded-md"
      >
        <div className="grid w-full grid-cols-1 gap-4">
          <DateRangeFormField
            labelClassName="text-sm"
            name="created_date"
            label="Registration Date"
            value={{
              start: getDate(filterState.created_date_after),
              end: getDate(filterState.created_date_before),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />
          <DateRangeFormField
            labelClassName="text-sm"
            name="modified_date"
            label="Modified Date"
            value={{
              start: getDate(filterState.modified_date_after),
              end: getDate(filterState.modified_date_before),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />
          <DateRangeFormField
            labelClassName="text-sm"
            name="last_consultation_encounter_date"
            label="Admit Date"
            value={{
              start: getDate(
                filterState.last_consultation_encounter_date_after
              ),
              end: getDate(filterState.last_consultation_encounter_date_before),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />
          <DateRangeFormField
            labelClassName="text-sm"
            name="last_consultation_discharge_date"
            label="Discharge Date"
            value={{
              start: getDate(
                filterState.last_consultation_discharge_date_after
              ),
              end: getDate(filterState.last_consultation_discharge_date_before),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />
          <DateRangeFormField
            labelClassName="text-sm"
            name="last_consultation_symptoms_onset_date"
            label="Onset of Symptoms Date"
            value={{
              start: getDate(
                filterState.last_consultation_symptoms_onset_date_after
              ),
              end: getDate(
                filterState.last_consultation_symptoms_onset_date_before
              ),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />
        </div>
      </AccordionV2>
      <AccordionV2
        title={
          <h1 className="mb-4 text-left text-xl font-bold text-purple-500">
            Geography based
          </h1>
        }
        expanded={true}
        className="rounded-md"
      >
        <div className="space-y-4">
          <div>
            <FieldLabel className="text-sm">Facility</FieldLabel>
            <FacilitySelect
              multiple={false}
              name="facility"
              showAll={false}
              selected={filterState.facility_ref}
              setSelected={(obj) => setFilterWithRef("facility", obj)}
            />
          </div>
          {filterState.facility && (
            <div>
              <FieldLabel className="text-sm">Location</FieldLabel>
              <LocationSelect
                name="facility"
                errorClassName="hidden"
                selected={filterState.last_consultation_current_bed__location}
                multiple={false}
                facilityId={filterState.facility}
                setSelected={(selected) =>
                  setFilterState({
                    ...filterState,
                    last_consultation_current_bed__location: selected,
                  })
                }
              />
            </div>
          )}
          <div>
            <FieldLabel className="text-sm">Facility type</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={FACILITY_TYPES}
              optionLabel={(o) => o.text}
              optionValue={(o) => o.text}
              value={filterState.facility_type}
              onChange={(v) =>
                setFilterState({ ...filterState, facility_type: v })
              }
              optionIcon={() => (
                <CareIcon icon="l-hospital" className="text-lg" />
              )}
            />
          </div>
          <div>
            <FieldLabel className="text-sm">LSG Body</FieldLabel>
            <div className="">
              <AutoCompleteAsync
                name="lsg_body"
                selected={filterState.lsgBody_ref}
                fetchData={lsgSearch}
                onChange={(obj) => setFilterWithRef("lsgBody", obj)}
                optionLabel={(option) => option.name}
                compareBy="id"
              />
            </div>
          </div>

          <div>
            <FieldLabel className="text-sm">District</FieldLabel>
            <DistrictSelect
              multiple={false}
              name="district"
              selected={filterState.district_ref}
              setSelected={(obj) => setFilterWithRef("district", obj)}
              errors={""}
            />
          </div>
        </div>
      </AccordionV2>
      <AccordionV2
        title={
          <h1 className="mb-4 text-left text-xl font-bold text-purple-500">
            COVID Details based
          </h1>
        }
        expanded={false}
        className="w-full rounded-md"
      >
        <div className="grid w-full grid-cols-1 gap-4">
          {kasp_enabled && (
            <div className="w-full flex-none">
              <FieldLabel className="text-sm">{kasp_string}</FieldLabel>
              <SelectMenuV2
                placeholder="Show all"
                options={[true, false]}
                optionLabel={(o) =>
                  o ? `Show ${kasp_string}` : `Show Non ${kasp_string}`
                }
                value={filterState.is_kasp}
                onChange={(v) => setFilterState({ ...filterState, is_kasp: v })}
              />
            </div>
          )}

          <div className="w-full flex-none">
            <FieldLabel className="text-sm">COVID Disease status</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={DISEASE_STATUS}
              optionLabel={(o) => o}
              value={filterState.disease_status}
              onChange={(v) =>
                setFilterState({ ...filterState, disease_status: v })
              }
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">COVID Vaccinated</FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={VACCINATED_FILTER}
              optionLabel={({ text }) => text}
              optionValue={({ id }) => id}
              optionIcon={({ id }) => (
                <>
                  <CareIcon icon="l-syringe" className="mr-2 w-5" />
                  <span className="font-bold">{id}</span>
                </>
              )}
              value={filterState.number_of_doses}
              onChange={(v) =>
                setFilterState({ ...filterState, number_of_doses: v })
              }
            />
          </div>
          <div className="w-full flex-none">
            <FieldLabel className="text-sm">
              Declared as COVID Positive
            </FieldLabel>
            <SelectMenuV2
              placeholder="Show all"
              options={DECLARED_FILTER}
              optionLabel={(o) => o.text}
              optionValue={(o) => o.id}
              value={filterState.is_declared_positive}
              onChange={(v) =>
                setFilterState({ ...filterState, is_declared_positive: v })
              }
            />
          </div>

          <div className="w-full flex-none">
            <TextFormField
              id="srf_id"
              name="srf_id"
              placeholder="Filter by SRF ID"
              label={<span className="text-sm">SRF ID</span>}
              value={filterState.srf_id}
              onChange={handleFormFieldChange}
              errorClassName="hidden"
            />
          </div>
          <div className="w-full flex-none">
            <TextFormField
              id="covin_id"
              name="covin_id"
              placeholder="Filter by COWIN ID"
              label={<span className="text-sm">CoWIN ID</span>}
              value={filterState.covin_id}
              onChange={handleFormFieldChange}
              errorClassName="hidden"
            />
          </div>

          <DateRangeFormField
            labelClassName="text-sm"
            name="date_of_result"
            label="Date of result of COVID Test"
            value={{
              start: getDate(filterState.date_of_result_after),
              end: getDate(filterState.date_of_result_before),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />
          <DateRangeFormField
            labelClassName="text-sm"
            name="date_declared_positive"
            label="Date declared COVID positive"
            value={{
              start: getDate(filterState.date_declared_positive_after),
              end: getDate(filterState.date_declared_positive_before),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />

          <DateRangeFormField
            labelClassName="text-sm"
            name="last_vaccinated_date"
            label="Date of COVID Vaccination"
            value={{
              start: getDate(filterState.last_vaccinated_date_after),
              end: getDate(filterState.last_vaccinated_date_before),
            }}
            onChange={handleDateRangeChange}
            errorClassName="hidden"
          />
        </div>
      </AccordionV2>
    </FiltersSlideover>
  );
}
