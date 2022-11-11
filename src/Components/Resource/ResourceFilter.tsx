import React, { useEffect, useState } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { SelectField } from "../Common/HelperInputFields";
import { RESOURCE_FILTER_ORDER } from "../../Common/constants";
import moment from "moment";
import { getAnyFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { CircularProgress } from "@material-ui/core";
import { RESOURCE_CHOICES } from "../../Common/constants";
import { DateRangePicker, getDate } from "../Common/DateRangePicker";
import useMergeState from "../../Common/hooks/useMergeState";
import FiltersSlideOver, {
  AdvancedFilterProps,
} from "../../CAREUI/shared/FiltersSlideOver";
import { FieldLabel } from "../Form/FormFields/FormField";

const resourceStatusOptions = RESOURCE_CHOICES.map((obj) => obj.text);

const initialState = {
  orgin_facility: "",
  orgin_facility_ref: null,
  approving_facility: "",
  approving_facility_ref: null,
  assigned_facility: "",
  assigned_facility_ref: null,
  emergency: "--",
  created_date_before: null,
  created_date_after: null,
  modified_date_before: null,
  modified_date_after: null,
  ordering: null,
  status: "--",
};

export default function ResourceFilter({
  filter,
  onChange,
  ...props
}: AdvancedFilterProps) {
  const [isOriginLoading, setOriginLoading] = useState(false);
  const [isResourceLoading, setResourceLoading] = useState(false);
  const [isAssignedLoading, setAssignedLoading] = useState(false);
  const [filterState, setFilterState] = useMergeState({
    orgin_facility: filter.orgin_facility || initialState.orgin_facility,
    orgin_facility_ref: initialState.orgin_facility_ref,
    approving_facility:
      filter.approving_facility || initialState.approving_facility,
    approving_facility_ref: initialState.approving_facility_ref,
    assigned_facility:
      filter.assigned_facility || initialState.assigned_facility,
    assigned_facility_ref: initialState.assigned_facility_ref,
    emergency: filter.emergency || initialState.emergency,
    created_date_before:
      filter.created_date_before || initialState.created_date_before,
    created_date_after:
      filter.created_date_after || initialState.created_date_after,
    modified_date_before:
      filter.modified_date_before || initialState.modified_date_before,
    modified_date_after:
      filter.modified_date_after || initialState.modified_date_after,
    ordering: filter.ordering || initialState.ordering,
    status: filter.status || initialState.status,
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
    const filterData: any = { ...filterState };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;

    setFilterState(filterData);
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  const applyFilter = () => {
    const {
      orgin_facility,
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
      orgin_facility: orgin_facility || "",
      approving_facility: approving_facility || "",
      assigned_facility: assigned_facility || "",
      emergency: emergency || "",
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
      status: status || "",
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

  const clearFilter = () => setFilterState(initialState);

  return (
    <FiltersSlideOver onClear={clearFilter} onApply={applyFilter} {...props}>
      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Status</FieldLabel>
        <SelectField
          name="status"
          variant="outlined"
          margin="dense"
          optionArray={true}
          value={filterState.status}
          options={["--", ...resourceStatusOptions]}
          onChange={handleChange}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Origin facility</FieldLabel>
        <div className="">
          {isOriginLoading ? (
            <CircularProgress size={20} />
          ) : (
            <FacilitySelect
              multiple={false}
              name="orgin_facility"
              selected={filterState.orgin_facility_ref}
              setSelected={(obj) => setFacility(obj, "orgin_facility")}
              className="resource-page-filter-dropdown"
              errors={""}
            />
          )}
        </div>
      </div>

      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Resource approving facility</FieldLabel>
        <div className="">
          {isResourceLoading ? (
            <CircularProgress size={20} />
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
      </div>

      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Assigned facility</FieldLabel>
        <div className="">
          {isAssignedLoading ? (
            <CircularProgress size={20} />
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
      </div>
      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Ordering</FieldLabel>
        <SelectField
          name="ordering"
          variant="outlined"
          margin="dense"
          optionKey="text"
          optionValue="desc"
          value={filterState.ordering}
          options={RESOURCE_FILTER_ORDER}
          onChange={handleChange}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div className="w-full flex-none">
        <FieldLabel className="text-sm">Is emergency case</FieldLabel>
        <SelectField
          name="emergency"
          variant="outlined"
          margin="dense"
          optionArray={true}
          value={filterState.emergency}
          options={["--", "yes", "no"]}
          onChange={handleChange}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div className="w-full flex-none">
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
      </div>
    </FiltersSlideOver>
  );
}
