import GSearch from "../Components/Common/g-search/GSearch";
import { useQueryParams, usePath } from "raviger";
import {
  getStates,
  getDistrictByState,
  getLocalbodyByDistrict,
  getDistrictByName,
} from "../Redux/actions";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { FACILITY_TYPES } from "../Common/constants";

export default function GSearchFilter() {
  const [qParams, setQueryParams] = useQueryParams();
  const [selectables, setSelectables] = useState({});
  const [searchables, setSearchables] = useState({});
  const dispatch: any = useDispatch();
  const path = usePath();

  const isValidDate = function (date: string) {
    return (
      new Date(date).toDateString() !== "Invalid Date" &&
      !isNaN(Number(new Date(date)))
    );
  };

  useEffect(() => {
    switch (path) {
      case "/facility":
        setSelectables({
          state: {
            badge: "State",
            fetchDataOnInit: fetchStates,
            compare: (a: any, b: any) => a.id === b.id,
            onSelect: (selected: any) => {
              applyFilter({ state: selected.id });
            },
          },
          district: {
            badge: "District",
            dependsOn: [{ tag: "state", required: true }],
            fetctDataOnDependancyChange: async (
              item: any,
              tag: string,
              data: any[],
              action: string
            ) => {
              if (action === "select") return await fetchDistrictsByState(item);
              return [];
            },
            compare: (a: any, b: any) => a.id === b.id,
            onSelect: (selected: any) => {
              applyFilter({ district: selected.id });
            },
          },
          local_body: {
            badge: "Local Body",
            dependsOn: [{ tag: "district", required: true }],
            fetctDataOnDependancyChange: async (
              item: any,
              tag: string,
              data: any[],
              action: string
            ) => {
              if (action === "select")
                return await fetchLocalBodiesByDistrict(item);
              return [];
            },
            onSelect: (selected: any) => {
              applyFilter({ local_body: selected.id });
            },
          },
          facility_type: {
            badge: "Facility Type",
            data: FACILITY_TYPES,
            match: (query: string, item: any) => {
              return item.text.toLowerCase().includes(query.toLowerCase());
            },
            label: (item: any) => item.text,
            compare: (a: any, b: any) => a.id === b.id,
            onSelect: (selected: any) => {
              applyFilter({ facility_type: selected.id });
            },
          },
          kasp_empanelled: {
            badge: "KASP Empanelled",
            data: [
              { id: true, name: "KASP Empanelled" },
              { id: false, name: "Non KASP Empanelled" },
            ],
            compare: (a: any, b: any) => a.id === b.id,
            onSelect: (selected: any) => {
              applyFilter({ kasp_empanelled: selected.id });
            },
          },
        });
        break;
      case "/patients":
        setSelectables({
          district: {
            badge: "District",
            fetchDataOnSearch: fetchDistrictByName,
            compare: (a: any, b: any) => a.id === b.id,
            onSelect: (selected: any) => {
              applyFilter({ district: selected.id });
            },
          },
        });
        setSearchables({
          date_of_result_before: {
            match: isValidDate,
            label: (item: any) => new Date(item.name).toDateString(),
          },
        });

        break;
      case "/assets":
      case "/sample":
      case "/shifting":
      case "/resource":
      case "/external_results":
      case "/users":
        setSelectables({});
    }
  }, [path]);

  const fetchStates = useCallback(async () => {
    const res = await dispatch(getStates());

    if (res && res.data) {
      return res.data.results;
    }

    return [];
  }, [dispatch]);

  const fetchDistrictsByState = useCallback(
    async (state: any) => {
      if (!state.id) return [];

      const res = await dispatch(getDistrictByState({ id: state.id }));
      if (res && res.data) {
        return res.data;
      } else {
        return [];
      }
    },
    [dispatch]
  );

  const fetchDistrictByName = useCallback(async (searchText: string) => {
    const res = await dispatch(
      getDistrictByName({ district_name: searchText })
    );
    return res?.data?.results ?? [];
  }, []);

  const fetchLocalBodiesByDistrict = useCallback(
    async (district: any) => {
      if (!district.id) return [];

      const res = await dispatch(getLocalbodyByDistrict({ id: district.id }));
      if (res && res.data) {
        return res.data;
      }
      return [];
    },
    [dispatch]
  );

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, { replace: true });
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
  };

  return (
    <GSearch
      className="w-72 hidden"
      selectables={selectables}
      searchables={searchables}
    />
  );
}
