import React, { useCallback, useState } from "react";
import { SelectField } from "../../Common/HelperInputFields";
import { CircularProgress } from "@material-ui/core";
import { FACILITY_TYPES, KASP_STRING } from "../../../Common/constants";
import { getStates, getDistrictByState } from "../../../Redux/actions";
import { useDispatch } from "react-redux";
import { useAbortableEffect, statusType } from "../../../Common/utils";
import LocalBodySelect from "./LocalBodySelect";
import { navigate } from "raviger";

function useMergeState(initialState: any) {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));

  return [state, setMergedState];
}

const initialStates = [{ id: 0, name: "Choose State *" }];
const initialDistricts = [{ id: 0, name: "Choose District" }];
const selectStates = [{ id: 0, name: "Please select your state" }];

function FacilityFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
  const dispatchAction: any = useDispatch();

  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [states, setStates] = useState(initialStates);
  const [districts, setDistricts] = useState(selectStates);
  const [selectedLocalBodyObject, setSelectedLocalBodyObject] = useState(null);
  const [filterState, setFilterState] = useMergeState({
    state: filter.state || "",
    district: filter.district || "",
    local_body: filter.local_body || "",
    facility_type: filter.facility_type || "",
    kasp_empanelled: filter.kasp_empanelled || "",
  });

  const fetchStates = useCallback(
    async (status: any) => {
      setIsStateLoading(true);
      const res = await dispatchAction(getStates());
      if (!status.aborted) {
        if (res && res.data) {
          setStates([...initialStates, ...res.data.results]);
        }
        setIsStateLoading(false);
      }
    },
    [dispatchAction]
  );

  useAbortableEffect((status: statusType) => {
    fetchStates(status);
  }, []);

  const fetchDistricts = useCallback(
    async (status: any) => {
      setIsDistrictLoading(true);
      const res =
        Number(filterState.state) &&
        (await dispatchAction(getDistrictByState({ id: filterState.state })));
      if (!status.aborted) {
        if (res && res.data) {
          setDistricts([...initialDistricts, ...res.data]);
        } else {
          setDistricts(selectStates);
        }
        setIsDistrictLoading(false);
      }
    },
    [dispatchAction, filterState.state]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDistricts(status);
    },
    [filterState.state]
  );

  const applyFilter = () => {
    const data = {
      state: Number(filterState.state) || "",
      district: Number(filterState.district) || "",
      local_body: Number(filterState.local_body) || "",
      facility_type: filterState.facility_type || "",
      kasp_empanelled: filterState.kasp_empanelled || "",
    };
    onChange(data);
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;
    const filterData: any = { ...filterState };
    if (name === "state") {
      filterData["district"] = 0;
      filterData["local_body"] = 0;
    }
    if (name === "district") {
      filterData["local_body"] = 0;
    }
    filterData[name] = value;

    setFilterState(filterData);
  };

  const handleLocalBodyChange = (local_body_id: string) => {
    handleChange({ target: { name: "local_body", value: local_body_id } });
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between">
        <button className="btn btn-default mt-1" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />
          Cancel
        </button>
        <button
          className="btn btn-default mt-1"
          onClick={(_) => {
            setFilterState({
              state: "",
              district: "",
              local_body: "",
              facility_type: "",
              kasp_empanelled: "",
            });
            setSelectedLocalBodyObject(null);
            navigate("/facility");
          }}
        >
          <i className="fas fa-times mr-2" />
          Clear Filter
        </button>
        <button className="btn btn-primary mt-1" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />
          Apply
        </button>
      </div>
      <div className="w-full flex-none mt-2">
        <div className="font-light text-md mt-2">Filter By:</div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">State</span>
          <div>
            {isStateLoading ? (
              <CircularProgress size={20} />
            ) : (
              <SelectField
                name="state"
                variant="outlined"
                margin="dense"
                value={filterState.state}
                options={states}
                optionValue="name"
                onChange={handleChange}
              />
            )}
          </div>
        </div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">District</span>
          <div>
            {isDistrictLoading ? (
              <CircularProgress size={20} />
            ) : (
              <SelectField
                name="district"
                variant="outlined"
                margin="dense"
                value={filterState.district}
                options={districts}
                optionValue="name"
                onChange={handleChange}
              />
            )}
          </div>
        </div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">Local Body</span>
          <div>
            <LocalBodySelect
              name="local_body"
              district={filterState.district}
              selected={filterState.local_body}
              setSelected={handleLocalBodyChange}
              margin="dense"
              selectedLocalBodyObject={selectedLocalBodyObject}
              setSelectedLocalBodyObject={setSelectedLocalBodyObject}
            />
          </div>
        </div>

        <div className="w-full flex-none">
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

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">
            {KASP_STRING} Empanelled
          </span>
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

export default FacilityFilter;
