import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { getFacilities } from "../../Redux/actions";
import { AutoCompleteAsyncField } from "../Common/HelperInputFields";
import { FacilityModel } from "../Facility/models";

interface FacilitySelectProps {
    name: string;
    margin?: string;
    errors: string;
    searchAll?: boolean;
    multiple?: boolean;
    selected: FacilityModel | FacilityModel[] | null;
    setSelected: (selected: FacilityModel | FacilityModel[] | null) => void;
}

export const FacilitySelect = (props: FacilitySelectProps) => {
    const { name, multiple, selected, setSelected, margin, errors, searchAll } = props;
    const dispatchAction: any = useDispatch();
    const [facilityLoading, isFacilityLoading] = useState(false);
    const [hasSearchText, setHasSearchText] = useState(false);
    const [facilityList, setFacilityList] = useState<Array<FacilityModel>>([]);

    const handleValueChange = (current: FacilityModel | FacilityModel[] | null) => {
        if (!current) {
            setFacilityList([]);
            isFacilityLoading(false);
            setHasSearchText(false);
        }
        setSelected(current);
    };

    const handelSearch = (e: any) => {
        isFacilityLoading(true);
        setHasSearchText(!!e.target.value);
        onFacilitySearch(e.target.value);
    }

    const onFacilitySearch = useCallback(debounce(async (text: string) => {
        if (text) {
            const params = { limit: 50, offset: 0, search_text: text, all: searchAll };
            const res = await dispatchAction(getFacilities(params));
            if (res && res.data) {
                setFacilityList(res.data.results);
            }
            isFacilityLoading(false);
        } else {
            setFacilityList([]);
            isFacilityLoading(false);
        }
    }, 300), []);

    return (<AutoCompleteAsyncField
        name={name}
        multiple={multiple}
        variant="outlined"
        margin={margin}
        value={selected}
        options={facilityList}
        onSearch={handelSearch}
        onChange={(e: any, selected: any) => handleValueChange(selected)}
        loading={facilityLoading}
        placeholder="Search by facility name or by district"
        noOptionsText={hasSearchText ? "No facility found, please try again" : "Start typing to begin search"}
        renderOption={(option: any) => (
            <div>{option.name}{option.district_object ? `, ${option.district_object.name}` : ''}</div>
        )}
        getOptionSelected={(option: any, value: any) => option.id === value.id}
        getOptionLabel={(option: any) => option.name + (option.district_object ? `, ${option.district_object.name}` : '')}
        filterOptions={(options: FacilityModel[]) => options}
        errors={errors}
    />);
};
