import careConfig from "@careConfig";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import FiltersSlideover from "@/CAREUI/interactive/FiltersSlideover";

import CircularProgress from "@/components/Common/CircularProgress";
import { DateRange } from "@/components/Common/DateRangeInputV2";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import UserAutocomplete from "@/components/Common/UserAutocompleteFormField";
import DateRangeFormField from "@/components/Form/FormFields/DateRangeFormField";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useMergeState from "@/hooks/useMergeState";

import {
  BREATHLESSNESS_LEVEL,
  SHIFTING_FILTER_ORDER,
} from "@/common/constants";
import {
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { dateQueryString, parsePhoneNumber } from "@/Utils/utils";

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

export default function ListFilter(props: any) {
  const { filter, onChange, closeFilter, removeFilters } = props;

  const { t } = useTranslation();

  const shiftStatusOptions = (
    careConfig.wartimeShifting
      ? SHIFTING_CHOICES_WARTIME
      : SHIFTING_CHOICES_PEACETIME
  ).map((option) => option.text);

  const [filterState, setFilterState] = useMergeState({
    origin_facility: filter.origin_facility || "",
    origin_facility_ref: null,
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

    is_antenatal: filter.is_antenatal || "",
    breathlessness_level: filter.breathlessness_level || "",
  });

  const { loading: isOriginLoading } = useQuery(routes.getAnyFacility, {
    prefetch: filter.origin_facility ? true : false,
    pathParams: { id: filter.origin_facility },
    onResponse: ({ res, data }) => {
      if (res && data) {
        setFilterState({
          origin_facility_ref: filter.origin_facility ? "" : data,
        });
      }
    },
  });

  const { loading: isShiftingLoading } = useQuery(routes.getAnyFacility, {
    prefetch: filter.shifting_approving_facility ? true : false,
    pathParams: { id: filter.shifting_approving_facility },
    onResponse: ({ res, data }) => {
      if (res && data) {
        setFilterState({
          shifting_approving_facility_ref: filter.shifting_approving_facility
            ? ""
            : data,
        });
      }
    },
  });

  const { loading: isAssignedLoading } = useQuery(routes.getAnyFacility, {
    prefetch: filter.assigned_facility ? true : false,
    pathParams: { id: filter.assigned_facility },
    onResponse: ({ res, data }) => {
      if (res && data) {
        setFilterState({
          assigned_facility_ref: filter.assigned_facility ? "" : data,
        });
      }
    },
  });

  useQuery(routes.userList, {
    query: { id: filter.assigned_to },
    prefetch: filter.assigned_to ? true : false,
    onResponse: ({ res, data }) => {
      if (res?.ok && data?.count) {
        setFilterState({
          assigned_user_ref: filter.assigned_to ? "" : data.results[0],
        });
      }
    },
  });

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
      origin_facility,
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
      is_antenatal,
      breathlessness_level,
    } = filterState;
    const data = {
      origin_facility: origin_facility || "",
      shifting_approving_facility: shifting_approving_facility || "",
      assigned_facility: assigned_facility || "",
      emergency: emergency || "",
      is_up_shift: is_up_shift || "",
      patient_phone_number:
        patient_phone_number === "+91"
          ? ""
          : (parsePhoneNumber(patient_phone_number) ?? ""),
      created_date_before: dateQueryString(created_date_before),
      created_date_after: dateQueryString(created_date_after),
      modified_date_before: dateQueryString(modified_date_before),
      modified_date_after: dateQueryString(modified_date_after),
      ordering: ordering || "",
      is_kasp: is_kasp || "",
      status: status || "",
      assigned_to: assigned_to || "",
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
        removeFilters();
        closeFilter();
      }}
    >
      {props.showShiftingStatus && (
        <SelectFormField
          name="status"
          id="status"
          label={t("status")}
          placeholder="Show all"
          value={filterState.status}
          options={shiftStatusOptions}
          optionLabel={(option) => option}
          optionValue={(option) => option}
          onChange={(option) => handleFormFieldChange(option)}
          errorClassName="hidden"
        />
      )}
      <div>
        <FieldLabel>{t("origin_facility")}</FieldLabel>
        <div className="">
          {isOriginLoading ? (
            <CircularProgress className="h-5 w-5" />
          ) : (
            <FacilitySelect
              multiple={false}
              name="origin_facility"
              selected={filterState.origin_facility_ref}
              setSelected={(obj) => setFacility(obj, "origin_facility")}
              errors={""}
            />
          )}
        </div>
      </div>

      {careConfig.wartimeShifting && (
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
              errors={""}
            />
          )}
        </div>
      </div>

      {isAssignedLoading ? (
        <CircularProgress className="h-5 w-5" />
      ) : (
        <UserAutocomplete
          label={t("assigned_to")}
          name="assigned_to"
          id="assigned-to"
          value={filterState.assigned_user_ref}
          onChange={({ value }) => setAssignedUser(value)}
          errorClassName="hidden"
        />
      )}

      <SelectFormField
        name="ordering"
        id="ordering"
        label={t("ordering")}
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
        errorClassName="hidden"
      />

      <SelectFormField
        name="emergency"
        id="emergency"
        placeholder="Show all"
        label={t("is_emergency_case")}
        value={filterState.emergency}
        options={["yes", "no"]}
        optionLabel={(option) => option}
        optionValue={(option) => option}
        onChange={(option) => handleFormFieldChange(option)}
        errorClassName="hidden"
      />

      {careConfig.kasp.enabled && (
        <SelectFormField
          name="is_kasp"
          id="is-kasp"
          placeholder="Show all"
          label={`${t("is")} ${careConfig.kasp.string}`}
          value={filterState.is_kasp}
          options={["yes", "no"]}
          optionLabel={(option) => option}
          optionValue={(option) => option}
          onChange={(option) => handleFormFieldChange(option)}
          errorClassName="hidden"
        />
      )}

      <SelectFormField
        name="is_up_shift"
        id="is-up-shift"
        placeholder="Show all"
        label={t("is_upshift_case")}
        value={filterState.is_up_shift}
        options={["yes", "no"]}
        optionLabel={(option) => option}
        optionValue={(option) => option}
        onChange={(option) => handleFormFieldChange(option)}
        errorClassName="hidden"
      />

      <SelectFormField
        name="is_antenatal"
        id="is-antenatal"
        placeholder="Show all"
        label={t("is_antenatal")}
        value={filterState.is_antenatal}
        options={["yes", "no"]}
        optionLabel={(option) => option}
        optionValue={(option) => option}
        onChange={(option) => handleFormFieldChange(option)}
        errorClassName="hidden"
      />

      <SelectFormField
        name="breathlessness_level"
        id="breathlessness-level"
        placeholder="Show all"
        label={t("breathlessness_level")}
        value={filterState.breathlessness_level}
        options={BREATHLESSNESS_LEVEL}
        optionLabel={(option) => option}
        optionValue={(option) => option}
        onChange={(option) => handleFormFieldChange(option)}
        errorClassName="hidden"
      />

      <PhoneNumberFormField
        label={t("patient_phone_number")}
        name="patient_phone_number"
        value={filterState.patient_phone_number}
        onChange={handleFormFieldChange}
        types={["mobile", "landline"]}
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
