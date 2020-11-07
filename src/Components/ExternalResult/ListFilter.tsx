import React, { useEffect, useState } from "react";
import { SelectField } from "../Common/HelperInputFields";
import { DISTRICT_CHOICES } from "../../Common/constants";
import { getWards } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { Link } from "raviger";

function useMergeState(initialState: any) {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
}

export default function ListFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [wardList, setwardList] = useState([]);
  const [filterState, setFilterState] = useMergeState({
    districts: filter.districts || "",
  });
  const [wards, setWards] = useState(filter.wards || "");
  const dispatch: any = useDispatch();

  const handleChange = (event: any) => {
    let { name, value } = event.target;
    const filterData: any = { ...filterState };
    filterData[name] = value;
    setFilterState(filterData);
  };

  const applyFilter = () => {
    const { districts } = filterState;
    const data = {
      wards: wards && wards !== "--" ? wards : "",
      districts: districts && districts !== "0" ? districts : undefined,
    };

    onChange(data);
  };

  useEffect(() => {
    async function getWardList() {
      const params = {
        district: filterState.districts,
        limit: 500,
      };
      const res = await dispatch(getWards(params));
      setwardList(res?.data?.results || []);
    }
    if (filterState.districts) getWardList();
    else {
      setwardList([]);
    }
    setWards("");
  }, [filterState.districts]);

  useEffect(() => {
    setWards(filter.wards || "");
  }, []);

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
          <span className="text-sm font-semibold">District</span>
          <SelectField
            name="districts"
            variant="outlined"
            margin="dense"
            optionKey="id"
            optionValue="text"
            value={filterState.districts}
            options={[{ id: 0, text: "--" }, ...DISTRICT_CHOICES]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Ward</span>
          <SelectField
            name="wards"
            variant="outlined"
            margin="dense"
            optionKey="id"
            optionValue="name"
            value={wards}
            options={[{ name: "--" }, ...wardList]}
            onChange={(event: any) => {
              setWards(event.target.value);
            }}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
      </div>
    </div>
  );
}
