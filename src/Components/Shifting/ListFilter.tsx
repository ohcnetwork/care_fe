import {
  BREATHLESSNESS_LEVEL,
  DISEASE_STATUS,
  SHIFTING_FILTER_ORDER,
} from "../../Common/constants";
import { DateRange } from "../Common/DateRangeInputV2";
import React, { useEffect, useState } from "react";
import {
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
} from "../../Common/constants";
import { getAnyFacility, getUserList } from "../../Redux/actions";
import CircularProgress from "../Common/components/CircularProgress";
import { FacilitySelect } from "../Common/FacilitySelect";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { FieldLabel } from "../Form/FormFields/FormField";
import DateRangeFormField from "../Form/FormFields/DateRangeFormField";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import moment from "moment";
import { navigate } from "raviger";
import parsePhoneNumberFromString from "libphonenumber-js";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import useMergeState from "../../Common/hooks/useMergeState";
import { useTranslation } from "react-i18next";
import UserAutocompleteFormField from "../Common/UserAutocompleteFormField";

const clearFilterState = {
  orgin_facility: "",
  orgin_facility_ref: "",
  shifting_approving_facility: "",
  shifting_approving_facility_ref: "",
  assigned_facility: "",
  assigned_facility_ref: "",
  emergency: "",
  is_up_shift: "",
  created_date_before: "",
  created_date_after: "",
  modified_date_before: "",
  modified_date_after: "",
  patient_phone_number: "",
  ordering: "",
  is_kasp: "",
  status: "",
  assigned_user_ref: "",
  assigned_to: "",
  disease_status: "",
  is_antenatal: "",
  breathlessness_level: "",
};

const getDate = (value: any) =>
  value && moment(value).isValid() && moment(value).toDate();

export default function ListFilter(props: any) {
  const { kasp_enabled, kasp_string, wartime_shifting } = useConfig();
  const { filter, onChange, closeFilter } = props;
  const [isOriginLoading, setOriginLoading] = useState(false);
  const [isShiftingLoading, setShiftingLoading] = useState(false);
  const [isAssignedLoading, setAssignedLoading] = useState(false);
  const { t } = useTranslation();

  const shiftStatusOptions = (
    wartime_shifting ? SHIFTING_CHOICES_WARTIME : SHIFTING_CHOICES_PEACETIME
  ).map((option) => option.text);

  const [filterState, setFilterState] = useMergeState({
    orgin_facility: filter.orgin_facility || "",
    orgin_facility_ref: null,
    shifting_approving_facility: filter.shifting_approving_facility || "",
    shifting_approving_facility_ref: null,
    assigned_facility: filter.assigned_facility || "",
    assigned_facility_ref: null,
    emergency: filter.emergency || "",
    is_up_shift: filter.is_up_shift || "",
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    modified_date_before: filter.modified_date_before || null,
    modified_date_after: filter.modified_date_after || null,
    patient_phone_number: filter.patient_phone_number || "",
    ordering: filter.ordering || null,
    is_kasp: filter.is_kasp || "",
    status: filter.status || null,
    assigned_user_ref: null,
    assigned_to: filter.assigned_to || "",
    disease_status: filter.disease_status || "",
    is_antenatal: filter.is_antenatal || "",
    breathlessness_level: filter.breathlessness_level || "",
  });
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (filter.orgin_facility) {
        setOriginLoading(true);
        const res = await dispatch(
          getAnyFacility(filter.orgin_facility, "orgin_facility")
        );
        if (res && res.data) {
          setFilterState({ orgin_facility_ref: res.data });
        }
        setOriginLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    async function fetchData() {
      if (filter.shifting_approving_facility) {
        setShiftingLoading(true);
        const res = await dispatch(
          getAnyFacility(
            filter.shifting_approving_facility,
            "shifting_approving_facility"
          )
        );
        if (res && res.data) {
          setFilterState({ shifting_approving_facility_ref: res.data });
        }
        setShiftingLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    async function fetchData() {
      if (filter.assigned_facility) {
        setAssignedLoading(true);
        const res = await dispatch(
          getAnyFacility(filter.assigned_facility, "assigned_facility")
        );
        if (res && res.data) {
          setFilterState({ assigned_facility_ref: res.data });
        }
        setAssignedLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    async function fetchData() {
      if (filter.assigned_to) {
        const res = await dispatch(getUserList({ id: filter.assigned_to }));
        if (res && res.data && res.data.count) {
          setFilterState({
            ...filterState,
            assigned_user_ref: res.data.results[0],
          });
        }
      }
    }
    fetchData();
  }, [dispatch]);

  const setFacility = (selected: any, name: string) => {
    const filterData: any = { ...filterState };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;

    setFilterState(filterData);
  };

  const setAssignedUser = (user: any) => {
    const filterData: any = { ...filterState };
    filterData.assigned_to = user ? user.id : "";
    filterData.assigned_user_ref = user;

    setFilterState(filterData);
  };

  const handleFormFieldChange = (event: FieldChangeEvent<unknown>) => {
    setFilterState({
      ...filterState,
      [event.name]: event.value,
    });
  };

  const applyFilter = () => {
    const {
      orgin_facility,
      shifting_approving_facility,
      assigned_facility,
      emergency,
      is_up_shift,
      patient_phone_number,
      created_date_before,
      created_date_after,
      modified_date_before,
      modified_date_after,
      ordering,
      is_kasp,
      status,
      assigned_to,
      disease_status,
      is_antenatal,
      breathlessness_level,
    } = filterState;
    const data = {
      orgin_facility: orgin_facility || "",
      shifting_approving_facility: shifting_approving_facility || "",
      assigned_facility: assigned_facility || "",
      emergency: emergency || "",
      is_up_shift: is_up_shift || "",
      patient_phone_number: patient_phone_number
        ? parsePhoneNumberFromString(patient_phone_number)?.format("E.164")
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
      ordering: ordering || "",
      is_kasp: is_kasp || "",
      status: status || "",
      assigned_to: assigned_to || "",
      disease_status: disease_status || "",
      is_antenatal: is_antenatal || "",
      breathlessness_level: breathlessness_level || "",
    };
    onChange(data);
  };

  const handleDateRangeChange = (event: FieldChangeEvent<DateRange>) => {
    const filterData: any = { ...filterState };
    filterData[`${event.name}_after`] = event.value.start?.toString();
    filterData[`${event.name}_before`] = event.value.end?.toString();
    setFilterState(filterData);
  };

  return (
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        navigate("/shifting");
        setFilterState(clearFilterState);
        closeFilter();
      }}
    >
      {props.showShiftingStatus && (
        <div>
          <FieldLabel>{t("status")}</FieldLabel>
          <SelectFormField
            name="status"
            id="status"
            placeholder="Show all"
            value={filterState.status}
            options={shiftStatusOptions}
            optionLabel={(option) => option}
            optionValue={(option) => option}
            onChange={(option) => handleFormFieldChange(option)}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
      )}
      <div>
        <FieldLabel>{t("origin_facility")}</FieldLabel>
        <div className="">
          {isOriginLoading ? (
            <CircularProgress className="h-5 w-5" />
          ) : (
            <FacilitySelect
              multiple={false}
              name="orgin_facility"
              selected={filterState.orgin_facility_ref}
              setSelected={(obj) => setFacility(obj, "orgin_facility")}
              className="shifting-page-filter-dropdown"
              errors={""}
            />
          )}
        </div>
      </div>

      {wartime_shifting && (
        <div>
          <FieldLabel>{t("shifting_approving_facility")}</FieldLabel>
          <div className="">
            {isShiftingLoading ? (
              <CircularProgress className="h-5 w-5" />
            ) : (
              <FacilitySelect
                multiple={false}
                name="shifting_approving_facility"
                selected={filterState.shifting_approving_facility_ref}
                setSelected={(obj) =>
                  setFacility(obj, "shifting_approving_facility")
                }
                className="shifting-page-filter-dropdown"
                errors={""}
              />
            )}
          </div>
        </div>
      )}

      <div>
        <FieldLabel>{t("assigned_facility")}</FieldLabel>
        <div className="">
          {isAssignedLoading ? (
            <CircularProgress className="h-5 w-5" />
          ) : (
            <FacilitySelect
              multiple={false}
              name="assigned_facility"
              selected={filterState.assigned_facility_ref}
              setSelected={(obj) => setFacility(obj, "assigned_facility")}
              className="shifting-page-filter-dropdown"
              errors={""}
            />
          )}
        </div>
      </div>

      {isAssignedLoading ? (
        <CircularProgress className="h-5 w-5" />
      ) : (
        <UserAutocompleteFormField
          label={t("assigned_to")}
          name="assigned_to"
          id="assigned-to"
          value={filterState.assigned_user_ref}
          onChange={({ value }) => setAssignedUser(value)}
          errorClassName="hidden"
        />
      )}

      <div className="-mt-6">
        <FieldLabel>{t("ordering")}</FieldLabel>
        <SelectFormField
          name="ordering"
          id="ordering"
          placeholder="No ordering"
          value={filterState.ordering}
          options={SHIFTING_FILTER_ORDER}
          optionLabel={(option) => option.label}
          optionDescription={(option) => option.desc}
          optionValue={(option) => option.text}
          optionSelectedLabel={(option) => option.desc}
          onChange={(option) => {
            handleFormFieldChange(option);
          }}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div>
        <FieldLabel>{t("is_emergency_case")}</FieldLabel>
        <SelectFormField
          name="emergency"
          id="emergency"
          placeholder="Show all"
          value={filterState.emergency}
          options={["yes", "no"]}
          optionLabel={(option) => option}
          optionValue={(option) => option}
          onChange={(option) => handleFormFieldChange(option)}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      {kasp_enabled && (
        <div>
          <FieldLabel>{`${t("is")} ${kasp_string}`}</FieldLabel>
          <SelectFormField
            name="is_kasp"
            id="is-kasp"
            placeholder="Show all"
            value={filterState.is_kasp}
            options={["yes", "no"]}
            optionLabel={(option) => option}
            optionValue={(option) => option}
            onChange={(option) => handleFormFieldChange(option)}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
      )}

      <div>
        <FieldLabel>{t("is_upshift_case")}</FieldLabel>
        <SelectFormField
          name="is_up_shift"
          id="is-up-shift"
          placeholder="Show all"
          value={filterState.is_up_shift}
          options={["yes", "no"]}
          optionLabel={(option) => option}
          optionValue={(option) => option}
          onChange={(option) => handleFormFieldChange(option)}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div>
        <FieldLabel>{t("disease_status")}</FieldLabel>
        <SelectFormField
          name="disease_status"
          id="disease-status"
          placeholder="Show all"
          value={filterState.disease_status}
          options={DISEASE_STATUS}
          optionLabel={(option) => option}
          optionValue={(option) => option}
          onChange={(option) => handleFormFieldChange(option)}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div>
        <FieldLabel>{t("is_antenatal")}</FieldLabel>
        <SelectFormField
          name="is_antenatal"
          id="is-antenatal"
          placeholder="Show all"
          value={filterState.is_antenatal}
          options={["yes", "no"]}
          optionLabel={(option) => option}
          optionValue={(option) => option}
          onChange={(option) => handleFormFieldChange(option)}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div>
        <FieldLabel>{t("breathlessness_level")}</FieldLabel>
        <SelectFormField
          name="breathlessness_level"
          id="breathlessness-level"
          placeholder="Show all"
          value={filterState.breathlessness_level}
          options={BREATHLESSNESS_LEVEL}
          optionLabel={(option) => option}
          optionValue={(option) => option}
          onChange={(option) => handleFormFieldChange(option)}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <PhoneNumberFormField
        label={t("patient_phone_number")}
        name="patient_phone_number"
        value={filterState.patient_phone_number}
        onChange={handleFormFieldChange}
        errorClassName="hidden"
      />
      <DateRangeFormField
        labelClassName="text-sm"
        name="created_date"
        id="created-date"
        label={t("created_date")}
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
        id="modified-date"
        label={t("modified_date")}
        value={{
          start: getDate(filterState.modified_date_after),
          end: getDate(filterState.modified_date_before),
        }}
        onChange={handleDateRangeChange}
        errorClassName="hidden"
      />
    </FiltersSlideover>
  );
}
