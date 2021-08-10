import React, { useCallback, useState } from "react";
import { navigate } from "raviger";
import { SelectField } from "../../Common/HelperInputFields";
import { CircularProgress } from "@material-ui/core";
import { FACILITY_TYPES, KASP_STRING } from "../../../Common/constants";
import {
  getStates,
  getDistrictByState,
  getLocalbodyByDistrict,
} from "../../../Redux/actions";
import { useDispatch } from "react-redux";
import { useAbortableEffect, statusType } from "../../../Common/utils";

function useMergeState(initialState: any) {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));

  return [state, setMergedState];
}

const initialStates = [{ id: 0, name: "Choose State *" }];
const initialDistricts = [{ id: 0, name: "Choose District" }];
const selectStates = [{ id: 0, name: "Please select your state" }];
const initialLocalbodies = [{ id: 0, name: "Choose Localbody" }];
const selectDistrict = [{ id: 0, name: "Please select your district" }];

function FacillityFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const dispatchAction: any = useDispatch();

  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isLocalbodyLoading, setIsLocalbodyLoading] = useState(false);
  const [states, setStates] = useState(initialStates);
  const [districts, setDistricts] = useState(selectStates);
  const [localBody, setLocalBody] = useState(selectDistrict);
  const [filterState, setFilterState] = useMergeState({
    state: filter.state || "",
    district: filter.district || "",
    local_body: filter.local_body || "",
    facility_type: filter.facility_type || "",
    kasp_empanelled: filter.kasp_empanelled || "",
  });

  const fetchStates = useCallback(
    async (status) => {
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
    async (status) => {
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

  const fetchLocalbodies = useCallback(
    async (status) => {
      setIsLocalbodyLoading(true);
      const res =
        Number(filterState.district) &&
        (await dispatchAction(
          getLocalbodyByDistrict({ id: filterState.district })
        ));
      if (!status.aborted) {
        if (res && res.data) {
          if (res.data.length) {
            setLocalBody([...initialLocalbodies, ...res.data]);
          } else {
            setLocalBody([{ id: 0, name: "No local bodies found!" }]);
          }
        } else {
          setLocalBody(selectDistrict);
        }
        setIsLocalbodyLoading(false);
      }
    },
    [dispatchAction, filterState.district]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchLocalbodies(status);
    },
    [filterState.district]
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
    if (name === "state" && value == 0) {
      filterData["district"] = 0;
      filterData["local_body"] = 0;
    }
    if (name === "district" && value == 0) {
      filterData["local_body"] = 0;
    }
    filterData[name] = value;

    setFilterState(filterData);
  };

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
            closeFilter();
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

        <div className="w-64 flex-none">
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

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Local Body</span>
          <div>
            {isLocalbodyLoading ? (
              <CircularProgress size={20} />
            ) : (
              <SelectField
                name="local_body"
                variant="outlined"
                margin="dense"
                value={filterState.local_body}
                options={localBody}
                optionValue="name"
                onChange={handleChange}
              />
            )}
          </div>
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

export default FacillityFilter;
