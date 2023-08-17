import { useEffect, useState } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { RESOURCE_FILTER_ORDER } from "../../Common/constants";
import { getAnyFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { RESOURCE_CHOICES } from "../../Common/constants";
import useMergeState from "../../Common/hooks/useMergeState";
import { navigate } from "raviger";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";
import { FieldLabel } from "../Form/FormFields/FormField";
import CircularProgress from "../Common/components/CircularProgress";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { DateRange } from "../Common/DateRangeInputV2";
import DateRangeFormField from "../Form/FormFields/DateRangeFormField";
import dayjs from "dayjs";
import { dateQueryString } from "../../Utils/utils";

const clearFilterState = {
  origin_facility: "",
  origin_facility_ref: "",
  approving_facility: "",
  approving_facility_ref: "",
  assigned_facility: "",
  assigned_facility_ref: "",
  emergency: "",
  created_date_before: "",
  created_date_after: "",
  modified_date_before: "",
  modified_date_after: "",
  ordering: "",
  status: "",
};

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

export default function ListFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
  const [isOriginLoading, setOriginLoading] = useState(false);
  const [isResourceLoading, setResourceLoading] = useState(false);
  const [isAssignedLoading, setAssignedLoading] = useState(false);
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
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (filter.origin_facility) {
        setOriginLoading(true);
        const res = await dispatch(
          getAnyFacility(filter.origin_facility, "origin_facility")
        );
        if (res && res.data) {
          setFilterState({ origin_facility_ref: res.data });
        }
        setOriginLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    async function fetchData() {
      if (filter.approving_facility) {
        setResourceLoading(true);
        const res = await dispatch(
          getAnyFacility(filter.approving_facility, "approving_facility")
        );
        if (res && res.data) {
          setFilterState({ approving_facility_ref: res.data });
        }
        setResourceLoading(false);
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
        navigate("/resource");
        setFilterState(clearFilterState);
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
        {isOriginLoading ? (
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
        {isResourceLoading ? (
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
        {isAssignedLoading ? (
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
