import dayjs from "dayjs";

import FiltersSlideover from "@/CAREUI/interactive/FiltersSlideover";

import CircularProgress from "@/components/Common/CircularProgress";
import { DateRange } from "@/components/Common/DateRangeInputV2";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import DateRangeFormField from "@/components/Form/FormFields/DateRangeFormField";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";

import useMergeState from "@/hooks/useMergeState";

import { RESOURCE_FILTER_ORDER } from "@/common/constants";
import { RESOURCE_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { dateQueryString } from "@/Utils/utils";

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

export default function ListFilter(props: any) {
  const { filter, onChange, closeFilter, removeFilters } = props;
  const [filterState, setFilterState] = useMergeState({
    origin_facility: filter.origin_facility || "",
    origin_facility_ref: null,
    approving_facility: filter.approving_facility || "",
    approving_facility_ref: null,
    assigned_facility: filter.assigned_facility || "",
    assigned_facility_ref: null,
    emergency: filter.emergency || "--",
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    modified_date_before: filter.modified_date_before || null,
    modified_date_after: filter.modified_date_after || null,
    ordering: filter.ordering || null,
    status: filter.status || null,
  });

  const { loading: orginFacilityLoading } = useQuery(routes.getAnyFacility, {
    prefetch: filter.origin_facility !== undefined,
    pathParams: { id: filter.origin_facility },
    onResponse: ({ res, data }) => {
      if (res && data) {
        setFilterState({
          origin_facility_ref: filter.origin_facility === "" ? "" : data,
        });
      }
    },
  });

  const { loading: resourceFacilityLoading } = useQuery(routes.getAnyFacility, {
    prefetch: filter.approving_facility !== undefined,
    pathParams: { id: filter.approving_facility },
    onResponse: ({ res, data }) => {
      if (res && data) {
        setFilterState({
          approving_facility_ref: filter.approving_facility === "" ? "" : data,
        });
      }
    },
  });

  const { loading: assignedFacilityLoading } = useQuery(routes.getAnyFacility, {
    pathParams: { id: filter.assigned_facility },
    prefetch: filter.assigned_facility !== undefined,
    onResponse: ({ res, data }) => {
      if (res && data) {
        setFilterState({
          assigned_facility_ref: filter.assigned_facility === "" ? "" : data,
        });
      }
    },
  });

  const setFacility = (selected: any, name: string) => {
    setFilterState({
      ...filterState,
      [`${name}_ref`]: selected,
      [name]: (selected || {}).id,
    });
  };

  const handleChange = (e: FieldChangeEvent<unknown>) => {
    setFilterState({ ...filterState, [e.name]: e.value });
  };

  const applyFilter = () => {
    const {
      origin_facility,
      approving_facility,
      assigned_facility,
      emergency,
      created_date_before,
      created_date_after,
      modified_date_before,
      modified_date_after,
      ordering,
      status,
    } = filterState;
    const data = {
      origin_facility: origin_facility || "",
      approving_facility: approving_facility || "",
      assigned_facility: assigned_facility || "",
      emergency: emergency || "",
      created_date_before: dateQueryString(created_date_before),
      created_date_after: dateQueryString(created_date_after),
      modified_date_before: dateQueryString(modified_date_before),
      modified_date_after: dateQueryString(modified_date_after),
      ordering: ordering || "",
      status: status || "",
    };
    onChange(data);
  };

  const handleDateRangeChange = (event: FieldChangeEvent<DateRange>) => {
    const filterData = { ...filterState };
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
      {props.showResourceStatus && (
        <SelectFormField
          name="status"
          label="Status"
          value={filterState.status}
          options={RESOURCE_CHOICES}
          optionLabel={(option) => option.text}
          optionValue={(option) => option.text}
          onChange={handleChange}
          placeholder="Show all"
          errorClassName="hidden"
        />
      )}

      <div>
        <FieldLabel>Origin facility</FieldLabel>
        {orginFacilityLoading && filter.origin_facility ? (
          <CircularProgress />
        ) : (
          <FacilitySelect
            multiple={false}
            name="origin_facility"
            selected={filterState.origin_facility_ref}
            setSelected={(obj) => setFacility(obj, "origin_facility")}
            className="resource-page-filter-dropdown"
            errors={""}
          />
        )}
      </div>

      <div>
        <FieldLabel>Resource approving facility</FieldLabel>
        {filter.approving_facility && resourceFacilityLoading ? (
          <CircularProgress />
        ) : (
          <FacilitySelect
            multiple={false}
            name="approving_facility"
            selected={filterState.approving_facility_ref}
            setSelected={(obj) => setFacility(obj, "approving_facility")}
            className="resource-page-filter-dropdown"
            errors={""}
          />
        )}
      </div>

      <div>
        <FieldLabel>Assigned facility</FieldLabel>
        {filter.approving_facility && assignedFacilityLoading ? (
          <CircularProgress />
        ) : (
          <FacilitySelect
            multiple={false}
            name="assigned_facility"
            selected={filterState.assigned_facility_ref}
            setSelected={(obj) => setFacility(obj, "assigned_facility")}
            className="resource-page-filter-dropdown"
            errors={""}
          />
        )}
      </div>

      <SelectFormField
        name="ordering"
        label="Ordering"
        value={filterState.ordering}
        options={RESOURCE_FILTER_ORDER}
        optionLabel={(option) => option.desc}
        optionValue={(option) => option.text}
        onChange={handleChange}
        placeholder="None"
        errorClassName="hidden"
      />

      <SelectFormField
        name="emergency"
        label="Is emergency case"
        value={filterState.emergency}
        options={["yes", "no"]}
        optionLabel={(option) => option}
        optionValue={(option) => option}
        onChange={handleChange}
        placeholder="Show all"
        errorClassName="hidden"
      />

      <DateRangeFormField
        name="created_date"
        label="Created between"
        value={{
          start: getDate(filterState.created_date_after),
          end: getDate(filterState.created_date_before),
        }}
        onChange={handleDateRangeChange}
        errorClassName="hidden"
      />
      <DateRangeFormField
        name="modified_date"
        label="Modified between"
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
