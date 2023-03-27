import React, { useCallback, useState } from "react";
import { navigate } from "raviger";
import { LegacySelectField } from "../../Common/HelperInputFields";
import { CircularProgress } from "@material-ui/core";
import { FACILITY_TYPES } from "../../../Common/constants";
import { getStates, getDistrictByState } from "../../../Redux/actions";
import { useDispatch } from "react-redux";
import { useAbortableEffect, statusType } from "../../../Common/utils";
import LocalBodySelect from "./LocalBodySelect";
import useMergeState from "../../../Common/hooks/useMergeState";
import useConfig from "../../../Common/hooks/useConfig";
import FiltersSlideover from "../../../CAREUI/interactive/FiltersSlideover";
import { useTranslation } from "react-i18next";

const initialStates = [{ id: 0, name: "Choose State *" }];
const initialDistricts = [{ id: 0, name: "Choose District" }];
const selectStates = [{ id: 0, name: "Please select your state" }];

function FacilityFilter(props: any) {
  const { t } = useTranslation();
  const { filter, onChange, closeFilter } = props;
  const { kasp_string } = useConfig();
  const dispatchAction: any = useDispatch();

  const [isStateLoading, setIsStateLoading] = useState(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [states, setStates] = useState(initialStates);
  const [districts, setDistricts] = useState(selectStates);
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
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        navigate("/facility");
        setFilterState(filterState);
        closeFilter();
      }}
    >
      <div className="w-full flex-none">
        <span className="text-sm font-semibold">{t("state")}</span>
        <div>
          {isStateLoading ? (
            <CircularProgress size={20} />
          ) : (
            <LegacySelectField
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
        <span className="text-sm font-semibold">{t("district")}</span>
        <div>
          {isDistrictLoading ? (
            <CircularProgress size={20} />
          ) : (
            <LegacySelectField
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
        <span className="text-sm font-semibold">{t("local_body")}</span>
        <div>
          <LocalBodySelect
            name="local_body"
            district={filterState.district}
            selected={filterState.local_body}
            setSelected={handleLocalBodyChange}
            margin="dense"
          />
        </div>
      </div>

      <div className="w-full flex-none">
        <span className="text-sm font-semibold">{t("facility_type")}</span>
        <LegacySelectField
          name="facility_type"
          variant="outlined"
          margin="dense"
          value={filterState.facility_type}
          options={[{ id: "", text: t("show_all") }, ...FACILITY_TYPES]}
          onChange={handleChange}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>

      <div className="w-full flex-none">
        <span className="text-sm font-semibold">{kasp_string} Empanelled</span>
        <LegacySelectField
          name="kasp_empanelled"
          variant="outlined"
          margin="dense"
          value={filterState.kasp_empanelled}
          options={[
            { id: "", text: t("show_all") },
            { id: true, text: t("yes") },
            { id: false, text: t("no") },
          ]}
          onChange={handleChange}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>
    </FiltersSlideover>
  );
}

export default FacilityFilter;
