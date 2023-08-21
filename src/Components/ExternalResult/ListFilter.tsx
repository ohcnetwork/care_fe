import { useEffect, useState } from "react";
import { getAllLocalBodyByDistrict } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import useMergeState from "../../Common/hooks/useMergeState";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import FiltersSlideover from "../../CAREUI/interactive/FiltersSlideover";
import TextFormField from "../Form/FormFields/TextFormField";
import { MultiSelectFormField } from "../Form/FormFields/SelectFormField";
import DateRangeFormField from "../Form/FormFields/DateRangeFormField";
import dayjs from "dayjs";
import { dateQueryString } from "../../Utils/utils";
import useAuthUser from "../../Common/hooks/useAuthUser";

const clearFilterState = {
  created_date_before: "",
  created_date_after: "",
  result_date_before: "",
  result_date_after: "",
  sample_collection_date_before: "",
  sample_collection_date_after: "",
  srf_id: "",
};

const getDate = (value: any) =>
  value && dayjs(value).isValid() && dayjs(value).toDate();

export default function ListFilter(props: any) {
  const { filter, onChange, closeFilter, dataList } = props;
  const [wardList, setWardList] = useState<any[]>([]);
  const [lsgList, setLsgList] = useState<any[]>([]);

  const [wards, setWards] = useState<any[]>([]);
  const [selectedLsgs, setSelectedLsgs] = useState<any[]>([]);
  const dispatch: any = useDispatch();
  const authUser = useAuthUser();
  const [filterState, setFilterState] = useMergeState({
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    result_date_before: filter.result_date_before || null,
    result_date_after: filter.result_date_after || null,
    sample_collection_date_before: filter.sample_collection_date_before || null,
    sample_collection_date_after: filter.sample_collection_date_after || null,
    srf_id: filter.srf_id || null,
  });
  const { t } = useTranslation();

  const handleDateRangeChange = (
    startDateId: string,
    endDateId: string,
    e: any
  ) => {
    const filterData: any = { ...filterState };
    filterData[startDateId] = e.value.start?.toString();
    filterData[endDateId] = e.value.end?.toString();

    setFilterState(filterData);
  };

  const handleWardChange = (value: any) => {
    setWards(value);
  };
  const handleLsgChange = (value: any) => {
    setSelectedLsgs(value);
  };

  const field = (name: string) => ({
    name,
    label: t(name),
    value: filterState[name],
    onChange: handleChange,
    errorClassName: "hidden",
  });

  const applyFilter = () => {
    const selectedWardIds = wards.map(function (obj) {
      return obj.id;
    });

    const selectedLsgIds = selectedLsgs.map(function (obj) {
      return obj.id;
    });

    const {
      created_date_before,
      created_date_after,
      result_date_before,
      result_date_after,
      sample_collection_date_after,
      sample_collection_date_before,
      srf_id,
    } = filterState;

    const data = {
      state: authUser.state,
      district: authUser.district,
      wards: selectedWardIds.length ? selectedWardIds : "",
      local_bodies: selectedLsgIds.length ? selectedLsgIds : "",
      created_date_before: dateQueryString(created_date_before),
      created_date_after: dateQueryString(created_date_after),
      result_date_before: dateQueryString(result_date_before),
      result_date_after: dateQueryString(result_date_after),
      sample_collection_date_after: dateQueryString(
        sample_collection_date_after
      ),
      sample_collection_date_before: dateQueryString(
        sample_collection_date_before
      ),
      srf_id: srf_id,
    };
    onChange(data);
    dataList(selectedLsgs, wards);
  };

  const sortByName = (items: any) => {
    items.sort(function (a: any, b: any) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  };

  useEffect(() => {
    async function getWardList() {
      const id = authUser.district;
      const res = await dispatch(getAllLocalBodyByDistrict({ id }));
      let allWards: any[] = [];
      let allLsgs: any[] = [];
      res?.data?.forEach((local: any) => {
        allLsgs = [...allLsgs, { id: local.id, name: local.name }];
        if (local.wards) {
          local.wards.forEach((ward: any) => {
            allWards = [
              ...allWards,
              {
                id: ward.id,
                name: ward.number + ": " + ward.name,
                panchayath: local.name,
                number: ward.number,
                local_body_id: local.id,
              },
            ];
          });
        }
      });
      sortByName(allWards);
      sortByName(allLsgs);
      setWardList(allWards || []);
      setLsgList(allLsgs || []);
      const filteredWard = filter?.wards?.split(",").map(Number);
      const selectedWards: any =
        filteredWard && allWards
          ? allWards.filter(({ id }: { id: number }) => {
              return filteredWard.includes(id);
            })
          : [];
      setWards(selectedWards);

      const filteredLsgs = filter?.local_bodies?.split(",").map(Number);
      const selectedLsgs: any =
        filteredLsgs && allLsgs
          ? allLsgs.filter(({ id }: { id: number }) => {
              return filteredLsgs.includes(id);
            })
          : [];
      setSelectedLsgs(selectedLsgs);
    }
    getWardList();
  }, []);

  const filterWards = () => {
    const selectedLsgIds: any = selectedLsgs.map((e) => {
      return e.id;
    });

    const selectedwards: any =
      selectedLsgIds.length === 0
        ? wardList
        : wardList.filter(({ local_body_id }: { local_body_id: number }) => {
            return selectedLsgIds.includes(local_body_id);
          });

    return selectedwards;
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  return (
    <FiltersSlideover
      advancedFilter={props}
      onApply={applyFilter}
      onClear={() => {
        navigate("/external_results");
        setFilterState(clearFilterState);
        setSelectedLsgs([]);
        setWards([]);
        closeFilter();
      }}
    >
      <div>
        <MultiSelectFormField
          name="local_bodies"
          options={lsgList}
          label={t("Local Body")}
          placeholder={t("select_local_body")}
          value={selectedLsgs}
          optionLabel={(option: any) => option.name}
          onChange={(e: any) => handleLsgChange(e.value)}
        />
      </div>

      <div>
        <MultiSelectFormField
          name="wards"
          options={filterWards()}
          label={t("Ward")}
          placeholder={t("select_wards")}
          value={wards}
          optionLabel={(option: any) => option.name}
          onChange={(e: any) => handleWardChange(e.value)}
        />
      </div>
      <DateRangeFormField
        name="created_date"
        id="created_date"
        min={filterState.created_date_after}
        max={filterState.created_date_before}
        value={{
          start: getDate(filterState.created_date_after),
          end: getDate(filterState.created_date_before),
        }}
        onChange={(e) =>
          handleDateRangeChange("created_date_after", "created_date_before", e)
        }
        label={t("created_date")}
      />
      <DateRangeFormField
        name="result_date"
        id="result_date"
        min={filterState.result_date_after}
        max={filterState.result_date_before}
        value={{
          start: getDate(filterState.result_date_after),
          end: getDate(filterState.result_date_before),
        }}
        onChange={(e) =>
          handleDateRangeChange("result_date_after", "result_date_before", e)
        }
        label={t("result_date")}
      />
      <DateRangeFormField
        name="sample_collection_date"
        id="sample_collection_date"
        min={filterState.sample_collection_date_after}
        max={filterState.sample_collection_date_before}
        value={{
          start: getDate(filterState.sample_collection_date_after),
          end: getDate(filterState.sample_collection_date_before),
        }}
        onChange={(e) =>
          handleDateRangeChange(
            "sample_collection_date_after",
            "sample_collection_date_before",
            e
          )
        }
        label={t("sample_collection_date")}
      />

      <div className="w-full flex-none">
        <TextFormField {...field("srf_id")} />
      </div>
    </FiltersSlideover>
  );
}
