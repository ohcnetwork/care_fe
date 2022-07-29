import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getDistrict } from "../../Redux/actions";
import { SelectField, TextInputField } from "../Common/HelperInputFields";
import { USER_TYPES } from "../../Common/constants";
import { navigate } from "raviger";
import DistrictSelect from "../Facility/FacilityFilter/DistrictSelect";

const useMergeState = (initialState: any) => {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
};

export default function UserFilter(props: any) {
  const { filter, onChange, closeFilter } = props;
  const dispatch: any = useDispatch();
  const [filterState, setFilterState] = useMergeState({
    first_name: filter.first_name || "",
    last_name: filter.last_name || "",
    phone_number: filter.phone_number || "",
    alt_phone_number: filter.alt_phone_number || "",
    user_type: filter.user_type || "",
    district_id: filter.district_id || "",
    district_ref: null,
  });

  const clearFilterState = {
    first_name: "",
    last_name: "",
    phone_number: "",
    alt_phone_number: "",
    user_type: "",
    district_id: "",
    district_ref: null,
  };

  const USER_TYPE_OPTIONS = [
    { id: "", text: "Select" },
    ...USER_TYPES.map((user) => {
      return {
        id: user,
        text: user,
      };
    }),
  ];

  const handleChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  const setDistrict = (selected: any) => {
    const filterData: any = { ...filterState };
    filterData["district_ref"] = selected;
    filterData["district_id"] = (selected || {}).id;
    setFilterState(filterData);
  };

  const applyFilter = () => {
    const {
      first_name,
      last_name,
      phone_number,
      alt_phone_number,
      user_type,
      district_id,
    } = filterState;
    const data = {
      first_name: first_name || "",
      last_name: last_name || "",
      phone_number: phone_number
        ? parsePhoneNumberFromString(phone_number)?.format("E.164")
        : "",
      alt_phone_number: alt_phone_number
        ? parsePhoneNumberFromString(alt_phone_number)?.format("E.164")
        : "",
      user_type: user_type || "",
      district_id: district_id || "",
    };
    onChange(data);
  };

  useEffect(() => {
    async function fetchData() {
      if (filter.district_id) {
        const { data: districtData } = await dispatch(
          getDistrict(filter.district_id, "district")
        );
        setFilterState({ district_ref: districtData });
      }
    }
    fetchData();
  }, [dispatch]);

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
            navigate("/users");
            setFilterState(clearFilterState);
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

      <div className="font-light text-md mt-2">Filter By:</div>
      <div className="flex flex-wrap gap-2">
        <div className="w-full flex-none">
          <span className="text-sm font-semibold">First Name</span>
          <div className="flex justify-between">
            <div className="w-full">
              <TextInputField
                id="first_name"
                name="first_name"
                variant="outlined"
                margin="dense"
                errors=""
                value={filterState.first_name}
                onChange={handleChange}
                label="First Name"
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1"
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">Last Name</span>
          <div className="flex justify-between">
            <div className="w-full">
              <TextInputField
                id="last_name"
                name="last_name"
                variant="outlined"
                margin="dense"
                errors=""
                value={filterState.last_name}
                onChange={handleChange}
                label="Last Name"
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1"
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">Phone Number</span>
          <div className="flex justify-between">
            <div className="w-full">
              <PhoneNumberField
                name="phone_number"
                value={filterState.phone_number}
                onChange={(value: string) => {
                  handleChange({ target: { name: "phone_number", value } });
                }}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">Alt Phone Number</span>
          <div className="flex justify-between">
            <div className="w-full">
              <PhoneNumberField
                name="alt_phone_number"
                value={filterState.alt_phone_number}
                onChange={(value: string) => {
                  handleChange({ target: { name: "alt_phone_number", value } });
                }}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-none">
          <div className="text-sm font-semibold">Role</div>
          <SelectField
            name="user_type"
            variant="outlined"
            margin="dense"
            value={filterState.user_type || ""}
            options={USER_TYPE_OPTIONS}
            onChange={handleChange}
            errors=""
          />
        </div>

        <div className="w-full flex-none">
          <span className="text-sm font-semibold">District</span>
          <DistrictSelect
            multiple={false}
            name="district"
            selected={filterState.district_ref}
            setSelected={(obj: any) => {
              setDistrict(obj);
            }}
            className="shifting-page-filter-dropdown"
            errors={""}
          />
        </div>
      </div>
    </div>
  );
}
