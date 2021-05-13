import React, { useEffect, useState } from "react";
import { AutoCompleteAsyncField, DateInputField } from "../Common/HelperInputFields";
import { getAllLocalBodyByDistrict } from "../../Redux/actions";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "raviger";
import moment from "moment";

function useMergeState(initialState: any) {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) => setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
}

export default function ListFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [wardList, setWardList] = useState<any[]>([]);
  const [lsgList, setLsgList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [wards, setWards] = useState<any[]>([]);
  const [selectedLsgs, setSelectedLsgs] = useState<any[]>([]);
  const dispatch: any = useDispatch();
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const [filterState, setFilterState] = useMergeState({
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    result_date_before: filter.result_date_before || null,
    result_date_after: filter.result_date_after || null,
    sample_collection_date_before: filter.sample_collection_date_before || null,
    sample_collection_date_after: filter.sample_collection_date_after || null,
  });


  const handleChange = (event: any) => {
    let { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  const handleWardChange = (value: any) => {
    setWards(value);
  };
  const handleLsgChange = (value: any) => {
    setSelectedLsgs(value);
  };

  const formatDateTime = (dateTime: any) => {
    return dateTime && moment(dateTime).isValid() ? moment(dateTime).format('YYYY-MM-DD') : ''
  };

  const applyFilter = () => {
    let selectedWardIds = wards.map(function (obj) {
      return obj.id;
    });

    let selectedLsgIds = selectedLsgs.map(function (obj) {
      return obj.id;
    });

    const {
      created_date_before,
      created_date_after,
      result_date_before,
      result_date_after,
      sample_collection_date_after,
      sample_collection_date_before
    } = filterState;

    const data = {
      wards: selectedWardIds.length ? selectedWardIds : undefined,
      local_bodies: selectedLsgIds.length ? selectedLsgIds : undefined,
      created_date_before: formatDateTime(created_date_before),
      created_date_after: formatDateTime(created_date_after),
      result_date_before: formatDateTime(result_date_before),
      result_date_after: formatDateTime(result_date_after),
      sample_collection_date_after: formatDateTime(sample_collection_date_after),
      sample_collection_date_before: formatDateTime(sample_collection_date_before),
    };
    onChange(data);
  };

  const sortByName = (items: any) => {
    items.sort(function (a: any, b: any) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  };

  useEffect(() => {
    async function getWardList() {
      const id: number = currentUser.data.district;
      const res = await dispatch(getAllLocalBodyByDistrict({ id }));
      let allWards: any[] = [];
      let allLsgs: any[] = [];
      res?.data?.forEach((local: any) => {
        allLsgs = [
          ...allLsgs,
          { id: local.id, name: local.name },
        ];
        if (local.wards) {
          local.wards.forEach((ward: any) => {
            allWards = [
              ...allWards,
              { id: ward.id, name: ward.number + ": " + ward.name, panchayath: local.name, number: ward.number, local_body_id: local.id },
            ];
          });
        }
      });
      sortByName(allWards);
      sortByName(allLsgs);
      setWardList(allWards || []);
      setLsgList(allLsgs || []);
      const filteredWard = filter?.wards?.split(",").map(Number);
      let selectedWards: any =
        filteredWard && allWards
          ? allWards.filter(({ id }: { id: number }) => {
            return filteredWard.includes(id);
          })
          : [];
      setWards(selectedWards);

      const filteredLsgs = filter?.local_bodies?.split(",").map(Number);
      let selectedLsgs: any =
        filteredLsgs && allLsgs
          ? allLsgs.filter(({ id }: { id: number }) => {
            return filteredLsgs.includes(id);
          })
          : [];
      setSelectedLsgs(selectedLsgs);
      setLoading(false);
    }
    getWardList();
  }, []);


  const filterWards = () => {
    let selectedLsgIds: any = selectedLsgs.map((e) => {
      return e.id
    })

    let selectedwards: any =
      (selectedLsgIds.length === 0)
        ? wardList
        : wardList.filter(({ local_body_id }: { local_body_id: number }) => {
          return selectedLsgIds.includes(local_body_id);
        })

    return selectedwards
  };

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />
          Cancel
        </button>
        <Link
          href="/external_results"
          className="btn btn-default hover:text-gray-900"
        >
          <i className="fas fa-times mr-2" />
          Clear Filters
        </Link>
        <button className="btn btn-primary" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />
          Apply
        </button>
      </div>
      <div className="font-light text-md mt-2">Filter By:</div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Lsg</span>
          <AutoCompleteAsyncField
            multiple={true}
            name="local_bodies"
            options={lsgList}
            label="Local Body"
            variant="outlined"
            placeholder="Select Local Body"
            loading={loading}
            freeSolo={false}
            value={selectedLsgs}
            renderOption={(option: any) => <div>{option.name}</div>}
            getOptionSelected={(option: any, value: any) =>
              option.id === value.id
            }
            getOptionLabel={(option: any) => option.name}
            onChange={(e: object, value: any) => handleLsgChange(value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Ward</span>
          <AutoCompleteAsyncField
            multiple={true}
            name="wards"
            options={filterWards()}
            label="Ward"
            variant="outlined"
            placeholder="Select wards"
            loading={loading}
            freeSolo={false}
            value={wards}
            renderOption={(option: any) => <div>{option.name}</div>}
            getOptionSelected={(option: any, value: any) =>
              option.id === value.id
            }
            getOptionLabel={(option: any) => option.name}
            onChange={(e: object, value: any) => handleWardChange(value)}
          />
        </div>
      </div>
      <div className="w-64 flex-none">
        <span className="text-sm font-semibold">Created After</span>
        <DateInputField
          id="created_date_after"
          name="created_date_after"
          inputVariant="outlined"
          margin="dense"
          errors=""
          value={filterState.created_date_after}
          onChange={date => handleChange({ target: { name: "created_date_after", value: date } })}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
      </div>
      <div className="w-64 flex-none">
        <span className="text-sm font-semibold">Created Before</span>
        <DateInputField
          id="created_date_before"
          name="created_date_before"
          inputVariant="outlined"
          margin="dense"
          errors=""
          value={filterState.created_date_before}
          onChange={date => handleChange({ target: { name: "created_date_before", value: date } })}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
      </div>
      <div className="w-64 flex-none">
        <span className="text-sm font-semibold">Result After</span>
        <DateInputField
          id="result_date_after"
          name="result_date_after"
          inputVariant="outlined"
          margin="dense"
          errors=""
          value={filterState.result_date_after}
          onChange={date => handleChange({ target: { name: "result_date_after", value: date } })}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
      </div>

      <div className="w-64 flex-none">
        <span className="text-sm font-semibold">Result Before</span>
        <DateInputField
          id="result_date_before"
          name="result_date_before"
          inputVariant="outlined"
          margin="dense"
          errors=""
          value={filterState.result_date_before}
          onChange={date => handleChange({ target: { name: "result_date_before", value: date } })}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
      </div>
      <div className="w-64 flex-none">
        <span className="text-sm font-semibold">Sample Collection After</span>
        <DateInputField
          id="sample_collection_date_before"
          name="sample_collection_date_before"
          inputVariant="outlined"
          margin="dense"
          errors=""
          value={filterState.sample_collection_date_before}
          onChange={date => handleChange({ target: { name: "sample_collection_date_before", value: date } })}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
      </div>
      <div className="w-64 flex-none">
        <span className="text-sm font-semibold">Sample Collection Before</span>
        <DateInputField
          id="sample_collection_date_after"
          name="sample_collection_date_after"
          inputVariant="outlined"
          margin="dense"
          errors=""
          value={filterState.sample_collection_date_after}
          onChange={date => handleChange({ target: { name: "sample_collection_date_after", value: date } })}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
      </div>
    </div>
  );
}
