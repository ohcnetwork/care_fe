import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getFacilityUsers } from "../../Redux/actions";
import { AutoCompleteAsyncField } from "../Common/HelperInputFields";
import { UserModel } from "../Users/models";

export const UserSelect = (props: any) => {
  const {
    multiple,
    selected,
    setSelected,
    margin,
    errors,
    className = "",
    facilityId,
  } = props;
  const dispatchAction: any = useDispatch();
  const [userLoading, isUserLoading] = useState(false);
  const [UserList, setUserList] = useState<Array<UserModel>>([]);

  const getPersonName = (user: any) => {
    let personName = user.first_name + " " + user.last_name;

    return personName.trim().length > 0 ? personName : user.username;
  };

  const handleValueChange = (current: UserModel | UserModel[] | null) => {
    if (!current) {
      isUserLoading(false);
    }
    setSelected(current);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (facilityId) {
        isUserLoading(true);
        const res = await dispatchAction(getFacilityUsers(facilityId));
        if (res && res.data) {
          setUserList(res.data);
        }
        isUserLoading(false);
      } else {
        setSelected(null);
        setUserList([]);
      }
    };
    fetchUsers();
  }, [dispatchAction, facilityId]);

  return (
    <AutoCompleteAsyncField
      freeSolo={false}
      multiple={multiple}
      variant="outlined"
      margin={margin}
      value={selected}
      options={UserList}
      onChange={(e: any, selected: any) => handleValueChange(selected)}
      loading={userLoading}
      placeholder="Search by name or username"
      noOptionsText={"No user found, please try again"}
      renderOption={(option: any) => (
        <div className="flex items-center space-x-3">
          <span className="font-normal block truncate">
            {getPersonName(option)} - ({option.user_type})
          </span>
        </div>
      )}
      getOptionSelected={(option: any, value: any) => option.id === value.id}
      getOptionLabel={(option: any) =>
        `${getPersonName(option)} - (${option.user_type})`
      }
      errors={errors}
      className={className}
    />
  );
};
