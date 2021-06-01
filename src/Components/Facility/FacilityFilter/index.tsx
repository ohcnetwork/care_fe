import React, { useCallback } from "react";
import { navigate, useQueryParams } from "raviger";
import { SelectField } from "../../Common/HelperInputFields";
import { useEffect, useState } from "react";
import { CircularProgress } from "@material-ui/core";
import DistrictSelect from "./DistrictSelect";
import LocalBodySelect from "./LocalBodySelect";
import { FACILITY_TYPES } from "../../../Common/constants";
import { getStates } from "../../../Redux/actions";
import { useDispatch } from "react-redux";
import { debounce } from "lodash";

function useMergeState(initialState: any) {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));

  return [state, setMergedState];
}

function FacillityFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [isFacilityLoading, setFacilityLoading] = useState(false);
  const [stateList, setStateList] = useState([]);
  const dispatchAction: any = useDispatch();
  const [isstateLoading, setStateLoading] = useState(false);
  const [filterState, setFilterState] = useMergeState({
    state: filter.state || "",
    district: filter.district || "",
    district_ref: null,
    local_body: filter.local_body || "",
    local_body_ref: null,
    facility_type: filter.facility_type || "",
    kasp_empanelled: filter.kasp_empanelled || "",
  });

  const setKeys = (selected: any, name: string) => {
    const filterData: any = { ...filterState };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;
    setFilterState(filterData);
  };

  const applyFilter = () => {
    const data = {
      state: filterState.state || "",
      district: filterState.district || "",
      local_body: filterState.local_body || "",
      facility_type: filterState.facility_type || "",
      kasp_empanelled: filterState.kasp_empanelled || "",
    };
    onChange(data);
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;
    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  useEffect(() => {
    setStateLoading(true);
    loadStates();
  }, []);

  const loadStates = useCallback(
    debounce(async () => {
      const res = await dispatchAction(getStates());
      if (res && res.data) {
        setStateList(res.data.results);
      }
      setStateLoading(false);
    }, 300),
    []
  );

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />
          Cancel
        </button>
        <button
          className="btn btn-default"
          onClick={(_) => {
            navigate("/facility");
          }}
        >
          <i className="fas fa-times mr-2" />
          Clear Filter
        </button>
        <button className="btn btn-primary" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />
          Apply
        </button>
      </div>
      <div className="w-64 flex-none mt-2">
        <div className="font-light text-md mt-2">Filter By:</div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">State</span>
          <div>
            {isstateLoading ? (
              <CircularProgress size={20} />
            ) : (
              <SelectField
                name="state"
                variant="outlined"
                margin="dense"
                optionKey="id"
                optionValue="name"
                value={filterState.state}
                options={[{ id: "", name: "Show All" }, ...stateList]}
                onChange={handleChange}
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
              />
            )}
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">District</span>
          <DistrictSelect
            multiple={false}
            name="district"
            selected={filterState.district_ref}
            setSelected={(obj) => setKeys(obj, "district")}
            className="shifting-page-filter-dropdown"
            errors={""}
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Local Body</span>
          <LocalBodySelect
            multiple={false}
            name="local_body"
            selected={filterState.local_body_ref}
            setSelected={(obj) => setKeys(obj, "local_body")}
            className="shifting-page-filter-dropdown"
            errors={""}
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Facility type</span>
          <SelectField
            name="facility_type"
            variant="outlined"
            margin="dense"
            value={filterState.facility_type}
            options={[{ id: "", text: "Show All" }, ...FACILITY_TYPES]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">KASP Empanelled</span>
          <SelectField
            name="kasp_empanelled"
            variant="outlined"
            margin="dense"
            value={filterState.kasp_empanelled}
            options={[
              { id: "", text: "Show All" },
              { id: true, text: "Yes" },
              { id: false, text: "No" },
            ]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
      </div>
    </div>
  );
}

export default FacillityFilter;
