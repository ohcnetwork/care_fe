import React, { useEffect, useState, useMemo } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import {
  PATIENT_FILTER_ORDER,
  GENDER_TYPES,
  FACILITY_TYPES,
  DISEASE_STATUS,
  PATIENT_FILTER_CATEGORIES,
  PATIENT_FILTER_ADMITTED_TO,
  KASP_STRING,
  KASP_ENABLED,
} from "../../Common/constants";
import moment from "moment";
import {
  getAllLocalBody,
  getAnyFacility,
  getDistrict,
} from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { navigate } from "raviger";
import { DateRangePicker, getDate } from "../Common/DateRangePicker";
import DistrictSelect from "../Facility/FacilityFilter/DistrictSelect";
import { debounce } from "lodash";
import SelectMenuV2 from "../Form/SelectMenuV2";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldChangeEventHandler } from "../Form/FormFields/Utils";
import { FieldLabel } from "../Form/FormFields/FormField";
import MultiSelectMenuV2 from "../Form/MultiSelectMenuV2";
import DateInputFormField from "../Form/FormFields/DateInputFormField";

const useMergeState = (initialState: any) => {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
};

export default function PatientFilterV2(props: any) {
  const { filter, onChange, closeFilter } = props;

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
    ordering: filter.ordering,
    category: filter.category || null,
    gender: filter.gender || null,
    disease_status: filter.disease_status || null,
    age_min: filter.age_min || null,
    age_max: filter.age_max || null,
    date_of_result: filter.date_of_result || null,
    date_declared_positive: filter.date_declared_positive || null,
    last_consultation_admission_date_before:
      filter.last_consultation_admission_date_before || null,
    last_consultation_admission_date_after:
      filter.last_consultation_admission_date_after || null,
    last_consultation_discharge_date_before:
      filter.last_consultation_discharge_date_before || null,
    last_consultation_discharge_date_after:
      filter.last_consultation_discharge_date_after || null,
    last_consultation_admitted_to_list:
      filter.last_consultation_admitted_to_list
        ? filter.last_consultation_admitted_to_list.split(",")
        : [],
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
  });
  const dispatch: any = useDispatch();

  const clearFilterState = {
    district: "",
    facility: "",
    facility_type: "",
    lsgBody: "",
    facility_ref: null,
    lsgBody_ref: null,
    district_ref: null,
    date_declared_positive_before: null,
    date_declared_positive_after: null,
    date_of_result_before: null,
    date_of_result_after: null,
    created_date_before: null,
    created_date_after: null,
    modified_date_before: null,
    modified_date_after: null,
    ordering: "",
    category: null,
    gender: null,
    disease_status: null,
    age_min: null,
    age_max: null,
    date_of_result: null,
    date_declared_positive: null,
    last_consultation_admission_date_before: null,
    last_consultation_admission_date_after: null,
    last_consultation_discharge_date_before: null,
    last_consultation_discharge_date_after: null,
    last_consultation_admitted_to_list: [],
    srf_id: "",
    number_of_doses: null,
    covin_id: "",
    is_kasp: null,
    is_declared_positive: null,
    last_consultation_symptoms_onset_date_before: null,
    last_consultation_symptoms_onset_date_after: null,
    last_vaccinated_date_before: null,
    last_vaccinated_date_after: null,
    last_consultation_is_telemedicine: null,
    is_antenatal: null,
  };

  useEffect(() => {
    async function fetchData() {
      if (filter.facility) {
        const { data: facilityData } = await dispatch(
          getAnyFacility(filter.facility, "facility")
        );
        setFilterState({ facility_ref: facilityData });
      }

      if (filter.district) {
        const { data: districtData } = await dispatch(
          getDistrict(filter.district, "district")
        );
        setFilterState({ district_ref: districtData });
      }

      if (filter.lsgBody) {
        const { data: lsgRes } = await dispatch(getAllLocalBody({}));
        const lsgBodyData = lsgRes.results;

        setFilterState({
          lsgBody_ref: lsgBodyData.filter(
            (obj: any) => obj.id.toString() === filter.lsgBody.toString()
          )[0],
        });
      }
    }
    fetchData();
  }, [dispatch]);

  const VACCINATED_FILTER = [
    { id: 0, text: "Unvaccinated" },
    { id: 1, text: "1st dose only" },
    { id: 2, text: "Both doses" },
  ];

  const DECLARED_FILTER = [
    { id: "false", text: "Not Declared" },
    { id: "true", text: "Declared" },
  ];

  const TELEMEDICINE_FILTER = [
    { id: "true", text: "Yes" },
    { id: "false", text: "No" },
  ];

  const setFacility = (selected: any, name: string) => {
    const filterData: any = { ...filterState };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;

    setFilterState(filterData);
  };

  const lsgSearch = useMemo(
    () =>
      debounce(
        async (search: string) => {
          const res = await dispatch(
            getAllLocalBody({ local_body_name: search })
          );

          return res?.data?.results;
        },
        300,
        { leading: true }
      ),
    [dispatch]
  );

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
      ordering,
      category,
      gender,
      disease_status,
      age_min,
      age_max,
      date_of_result,
      last_consultation_admission_date_before,
      last_consultation_admission_date_after,
      last_consultation_discharge_date_before,
      last_consultation_discharge_date_after,
      last_consultation_admitted_to_list,
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
    } = filterState;
    const data = {
      district: district || "",
      lsgBody: lsgBody || "",
      facility: facility || "",
      facility_type: facility_type || "",
      date_declared_positive_before:
        date_declared_positive_before &&
        moment(date_declared_positive_before).isValid()
          ? moment(date_declared_positive_before).format("YYYY-MM-DD")
          : "",
      date_declared_positive_after:
        date_declared_positive_after &&
        moment(date_declared_positive_after).isValid()
          ? moment(date_declared_positive_after).format("YYYY-MM-DD")
          : "",
      date_of_result_before:
        date_of_result_before && moment(date_of_result_before).isValid()
          ? moment(date_of_result_before).format("YYYY-MM-DD")
          : "",
      date_of_result_after:
        date_of_result_after && moment(date_of_result_after).isValid()
          ? moment(date_of_result_after).format("YYYY-MM-DD")
          : "",
      created_date_before:
        created_date_before && moment(created_date_before).isValid()
          ? moment(created_date_before).format("YYYY-MM-DD")
          : "",
      created_date_after:
        created_date_after && moment(created_date_after).isValid()
          ? moment(created_date_after).format("YYYY-MM-DD")
          : "",
      modified_date_before:
        modified_date_before && moment(modified_date_before).isValid()
          ? moment(modified_date_before).format("YYYY-MM-DD")
          : "",
      modified_date_after:
        modified_date_after && moment(modified_date_after).isValid()
          ? moment(modified_date_after).format("YYYY-MM-DD")
          : "",
      date_of_result:
        date_of_result && moment(date_of_result).isValid()
          ? moment(date_of_result).format("YYYY-MM-DD")
          : "",
      last_consultation_admission_date_before:
        last_consultation_admission_date_before &&
        moment(last_consultation_admission_date_before).isValid()
          ? moment(last_consultation_admission_date_before).format("YYYY-MM-DD")
          : "",
      last_consultation_admission_date_after:
        last_consultation_admission_date_after &&
        moment(last_consultation_admission_date_after).isValid()
          ? moment(last_consultation_admission_date_after).format("YYYY-MM-DD")
          : "",
      last_consultation_discharge_date_before:
        last_consultation_discharge_date_before &&
        moment(last_consultation_discharge_date_before).isValid()
          ? moment(last_consultation_discharge_date_before).format("YYYY-MM-DD")
          : "",
      last_consultation_discharge_date_after:
        last_consultation_discharge_date_after &&
        moment(last_consultation_discharge_date_after).isValid()
          ? moment(last_consultation_discharge_date_after).format("YYYY-MM-DD")
          : "",
      ordering: ordering || "",
      category: category || "",
      gender: gender || "",
      disease_status:
        (disease_status == "Show All" ? "" : disease_status) || "",
      age_min: age_min || "",
      age_max: age_max || "",
      last_consultation_admitted_to_list:
        last_consultation_admitted_to_list || [],
      srf_id: srf_id || "",
      number_of_doses: number_of_doses || "",
      covin_id: covin_id || "",
      is_kasp: is_kasp || "",
      is_declared_positive: is_declared_positive || "",
      last_consultation_symptoms_onset_date_before:
        last_consultation_symptoms_onset_date_before &&
        moment(last_consultation_symptoms_onset_date_before).isValid()
          ? moment(last_consultation_symptoms_onset_date_before).format(
              "YYYY-MM-DD"
            )
          : "",
      last_consultation_symptoms_onset_date_after:
        last_consultation_symptoms_onset_date_after &&
        moment(last_consultation_symptoms_onset_date_after).isValid()
          ? moment(last_consultation_symptoms_onset_date_after).format(
              "YYYY-MM-DD"
            )
          : "",
      last_vaccinated_date_before:
        last_vaccinated_date_before &&
        moment(last_vaccinated_date_before).isValid()
          ? moment(last_vaccinated_date_before).format("YYYY-MM-DD")
          : "",
      last_vaccinated_date_after:
        last_vaccinated_date_after &&
        moment(last_vaccinated_date_after).isValid()
          ? moment(last_vaccinated_date_after).format("YYYY-MM-DD")
          : "",
      last_consultation_is_telemedicine:
        last_consultation_is_telemedicine || "",
      is_antenatal: is_antenatal || "",
    };
    onChange(data);
  };

  const handleDateRangeChange = (
    startDateId: string,
    endDateId: string,
    { startDate, endDate }: any
  ) => {
    const filterData: any = { ...filterState };
    filterData[startDateId] = startDate?.toString();
    filterData[endDateId] = endDate?.toString();

    setFilterState(filterData);
  };

  const handleFormFieldChange: FieldChangeEventHandler<string> = (event) =>
    setFilterState({ ...filterState, [event.name]: event.value });

  return (
    <div>
      <div className="flex mb-4 max-w-sm w-full fixed -ml-4 pl-4 pr-8 z-10 -mt-8 pt-8 pb-4 bg-gray-50">
        <button
          className="inline-flex items-center justify-center whitespace-nowrap py-2 px-4 rounded cursor-pointer hover:bg-gray-100 mt-1"
          onClick={closeFilter}
        >
          <i className="fa-solid fa-xmark mr-2" />
          <span className="text-sm">Cancel</span>
        </button>
        <button
          className="inline-flex items-center justify-center whitespace-nowrap py-2 px-4 rounded cursor-pointer hover:bg-gray-100 mt-1 text-red-600"
          onClick={(_) => {
            navigate("/patients");
            setFilterState(clearFilterState);
          }}
        >
          <i className="fa-solid fa-xmark mr-2" />
          <span className="text-sm">Clear Filter</span>
        </button>
        <div className="flex-1" />
        <button
          className="inline-flex items-center justify-center whitespace-nowrap py-2 px-4 rounded cursor-pointer bg-primary-500 hover:bg-primary-400 mt-1 text-white"
          onClick={applyFilter}
        >
          <span className="text-sm">Apply</span>
        </button>
      </div>
      <div className="w-full flex-none pt-16">
        <span className="text-sm">Ordering</span>
        <SelectMenuV2
          className="pt-2"
          options={PATIENT_FILTER_ORDER}
          optionLabel={(o) => o.desc}
          optionSelectedLabel={(option) => `${option.desc} (${option.order})`}
          optionDescription={(o) => o.order}
          optionIcon={(option) => (
            <i
              className={`fa-solid ${
                option.order === "Ascending"
                  ? "fa-arrow-up-short-wide"
                  : "fa-arrow-up-wide-short"
              }`}
            />
          )}
          value={filterState.ordering || undefined}
          optionValue={(o) => o.text}
          onChange={(v) => setFilterState({ ...filterState, ordering: v })}
        />
      </div>
      <div className="text-md my-6 flex items-center text-gray-700 gap-2">
        <i className="fa-solid fa-filter" />
        <p>Filter by</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-full flex-none">
          <span className="text-sm">LSG Body</span>
          <div className="">
            <AutoCompleteAsync
              className="pt-2"
              name="lsg_body"
              selected={filterState.lsgBody_ref}
              fetchData={lsgSearch}
              onChange={(selected) =>
                setFilterState({
                  ...filterState,
                  lsgBody_ref: selected,
                  lsgBody: selected.id,
                })
              }
              getOptionLabel={(option) => option.name}
            />
          </div>
        </div>

        <div className="w-full flex-none">
          <span className="text-sm">District</span>
          <DistrictSelect
            multiple={false}
            name="district"
            selected={filterState.district_ref}
            setSelected={(obj: any) => setFacility(obj, "district")}
            className="shifting-page-filter-dropdown"
            errors={""}
          />
        </div>

        <div className="w-full flex-none">
          <span className="text-sm">Facility</span>
          <FacilitySelect
            multiple={false}
            name="facility"
            selected={filterState.facility_ref}
            showAll
            setSelected={(obj) => setFacility(obj, "facility")}
            className="shifting-page-filter-dropdown"
          />
        </div>

        <div className="w-full flex-none">
          <span className="text-sm">Facility type</span>
          <SelectMenuV2
            className="pt-2"
            placeholder="Show all"
            options={FACILITY_TYPES}
            optionLabel={(o) => o.text}
            optionValue={(o) => o.text}
            value={filterState.facility_type}
            onChange={(v) =>
              setFilterState({ ...filterState, facility_type: v })
            }
            optionIcon={() => <i className="fa-solid fa-hospital" />}
          />
        </div>

        <div className="w-full flex-none">
          <span className="text-sm">Gender</span>
          <SelectMenuV2
            className="pt-2"
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
          <span className="text-sm">Is Antenatal</span>
          <SelectMenuV2
            className="pt-2"
            placeholder="Show all"
            options={[true, false]}
            optionLabel={(o) => (o ? "Antenatal" : "Non-antenatal")}
            value={filterState.is_antenatal}
            onChange={(v) =>
              setFilterState({ ...filterState, is_antenatal: v })
            }
          />
        </div>
        {KASP_ENABLED && (
          <div className="w-full flex-none">
            <span className="text-sm">{KASP_STRING}</span>
            <SelectMenuV2
              className="pt-2"
              placeholder="Show all"
              options={[true, false]}
              optionLabel={(o) =>
                o ? `Show ${KASP_STRING}` : `Show Non ${KASP_STRING}`
              }
              value={filterState.is_kasp}
              onChange={(v) => setFilterState({ ...filterState, is_kasp: v })}
            />
          </div>
        )}

        <div className="w-full flex-none">
          <span className="text-sm">Category</span>
          <SelectMenuV2
            className="pt-2"
            placeholder="Show all"
            options={PATIENT_FILTER_CATEGORIES}
            optionLabel={(o) => o.text}
            optionValue={(o) => o.id}
            value={filterState.category}
            onChange={(v) => setFilterState({ ...filterState, category: v })}
          />
        </div>

        <div className="w-full flex-none">
          <span className="text-sm">Disease Status</span>
          <SelectMenuV2
            className="pt-2"
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
          <span className="text-sm">Vaccinated</span>
          <SelectMenuV2
            className="pt-2"
            placeholder="Show all"
            options={VACCINATED_FILTER}
            optionLabel={(o) => o.text}
            optionValue={(o) => o.id}
            value={filterState.number_of_doses}
            onChange={(v) =>
              setFilterState({ ...filterState, number_of_doses: v })
            }
          />
        </div>
        <div className="w-full flex-none">
          <span className="text-sm">Declared</span>
          <SelectMenuV2
            className="pt-2"
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
          <span className="text-sm">Telemedicine</span>
          <SelectMenuV2
            className="pt-2"
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
          <TextFormField
            id="srf_id"
            name="srf_id"
            placeholder="Filter by SRF ID"
            label={<span className="text-sm">SRF ID</span>}
            value={filterState.srf_id}
            onChange={handleFormFieldChange}
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
          />
        </div>
        <div className="w-full flex-none">
          <span className="text-sm">Last Admitted to (Bed Type)</span>
          <MultiSelectMenuV2
            className="pt-2"
            id="last_consultation_admitted_to_list"
            placeholder="Select bed types"
            options={PATIENT_FILTER_ADMITTED_TO}
            value={filterState.last_consultation_admitted_to_list}
            optionValue={(o) => o.id}
            optionLabel={(o) => o.text}
            onChange={(o) =>
              setFilterState({
                ...filterState,
                last_consultation_admitted_to_list: o,
              })
            }
          />
        </div>
        <div className="w-full flex-none">
          <DateRangePicker
            startDate={getDate(filterState.date_of_result_after)}
            endDate={getDate(filterState.date_of_result_before)}
            onChange={(e) =>
              handleDateRangeChange(
                "date_of_result_after",
                "date_of_result_before",
                e
              )
            }
            endDateId={"date_of_result_before"}
            startDateId={"date_of_result_after"}
            label={"Date of result"}
            size="small"
          />
          <div className="flex gap-2">
            <DateInputFormField
              label="dtae input"
              name=""
              onChange={() => {}}
            />
            <DateInputFormField
              label="dtae input"
              name=""
              onChange={() => {}}
            />
          </div>
          <DateRangePicker
            startDate={getDate(filterState.date_declared_positive_after)}
            endDate={getDate(filterState.date_declared_positive_before)}
            onChange={(e) =>
              handleDateRangeChange(
                "date_declared_positive_after",
                "date_declared_positive_before",
                e
              )
            }
            endDateId={"date_declared_positive_before"}
            startDateId={"date_declared_positive_after"}
            label={"Date Declared Positive"}
            size="small"
          />

          <DateRangePicker
            startDate={getDate(filterState.created_date_after)}
            endDate={getDate(filterState.created_date_before)}
            onChange={(e) =>
              handleDateRangeChange(
                "created_date_after",
                "created_date_before",
                e
              )
            }
            endDateId={"created_date_before"}
            startDateId={"created_date_after"}
            label={"Created Date"}
            size="small"
          />
          <DateRangePicker
            startDate={getDate(filterState.modified_date_after)}
            endDate={getDate(filterState.modified_date_before)}
            onChange={(e) =>
              handleDateRangeChange(
                "modified_date_after",
                "modified_date_before",
                e
              )
            }
            endDateId={"modified_date_before"}
            startDateId={"modified_date_after"}
            label={"Modified Date"}
            size="small"
          />
          <DateRangePicker
            startDate={getDate(
              filterState.last_consultation_admission_date_after
            )}
            endDate={getDate(
              filterState.last_consultation_admission_date_before
            )}
            onChange={(e) =>
              handleDateRangeChange(
                "last_consultation_admission_date_after",
                "last_consultation_admission_date_before",
                e
              )
            }
            endDateId={"last_consultation_admission_date_before"}
            startDateId={"last_consultation_admission_date_after"}
            label={"Admit Date"}
            size="small"
          />
          <DateRangePicker
            startDate={getDate(
              filterState.last_consultation_discharge_date_after
            )}
            endDate={getDate(
              filterState.last_consultation_discharge_date_before
            )}
            onChange={(e) =>
              handleDateRangeChange(
                "last_consultation_discharge_date_after",
                "last_consultation_discharge_date_before",
                e
              )
            }
            endDateId={"last_consultation_discharge_date_before"}
            startDateId={"last_consultation_discharge_date_after"}
            label={"Discharge Date"}
            size="small"
          />
          <DateRangePicker
            startDate={getDate(
              filterState.last_consultation_symptoms_onset_date_after
            )}
            endDate={getDate(
              filterState.last_consultation_symptoms_onset_date_before
            )}
            onChange={(e) =>
              handleDateRangeChange(
                "last_consultation_symptoms_onset_date_after",
                "last_consultation_symptoms_onset_date_before",
                e
              )
            }
            endDateId={"last_consultation_symptoms_onset_date_before"}
            startDateId={"last_consultation_symptoms_onset_date_after"}
            label={"Onset of Symptoms Date"}
            size="small"
          />
          <DateRangePicker
            startDate={getDate(filterState.last_vaccinated_date_after)}
            endDate={getDate(filterState.last_vaccinated_date_before)}
            onChange={(e) =>
              handleDateRangeChange(
                "last_vaccinated_date_after",
                "last_vaccinated_date_before",
                e
              )
            }
            endDateId={"last_vaccinated_date_before"}
            startDateId={"last_vaccinated_date_after"}
            label={"Vaccination Date"}
            size="small"
          />
        </div>

        <div className="w-full flex-none">
          <FieldLabel>
            <span className="text-sm">Age</span>
          </FieldLabel>
          <div className="flex justify-between gap-4">
            <TextFormField
              name="age_min"
              placeholder="Min. age"
              label={null}
              value={filterState.age_min}
              onChange={handleFormFieldChange}
            />
            <TextFormField
              name="age_max"
              placeholder="Max. age"
              label={null}
              value={filterState.age_max}
              onChange={handleFormFieldChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
