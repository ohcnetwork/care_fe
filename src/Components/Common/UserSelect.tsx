import loadable from '@loadable/component';
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import moment from "moment";

import { getFacilityUsers } from "../../Redux/actions";
const Loading = loadable(() => import("../Common/Loading"));

export const UserSelect = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { facilityId, userId, onSelect } = props;
  const [users, setUsers] = useState(new Array<any>());
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchUsers = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getFacilityUsers(facilityId));
      if (!status.aborted) {
        if (res && res.data) {
          setUsers(res.data)
        }
        setIsLoading(false);
      }
    },
    [facilityId, dispatchAction]
  );

  useAbortableEffect((status: statusType) => {
    fetchUsers(status);
  }, []);

  const selectedUser = users.find((item: any) => item.id == userId);
  return (
    <div className="px-2 pb-2">

      <div className="space-y-1">
        <label id="listbox-label" className="block text-sm leading-5 font-medium text-gray-700">
          Assigned to
        </label>

        <div className="relative">
          <span className="inline-block w-full rounded-md shadow-sm">
            <button onClick={_ => setIsExpanded(!isExpanded)} type="button" aria-haspopup="listbox" aria-expanded="true" aria-labelledby="listbox-label" className="cursor-default relative w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-left focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition ease-in-out duration-150 sm:text-sm sm:leading-5">
              <div className="flex items-center justify-between">
                <div className="space-x-3 flex items-center">
                  <span aria-label="Online"
                    className={"flex-shrink-0 inline-block h-2 w-2 rounded-full " +
                      (selectedUser ? (moment().subtract(5, 'minutes').isBefore(selectedUser.last_login) ? "bg-green-400" : "bg-gray-300") : "bg-blue-400")
                    }
                  >
                  </span>
                  <span className="block truncate">
                    {selectedUser ? selectedUser.first_name + ' ' + selectedUser.last_name : "Assign a Shifting Staff"}
                  </span>
                </div>
                <div className="btn btn-default" onClick={_ => { onSelect('') }}> Clear</div>
              </div>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
          </span>

          {isExpanded && <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg z-40">
            <ul role="listbox" aria-labelledby="listbox-label" aria-activedescendant="listbox-item-3" className="max-h-60 rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5">
              {
                users.map((user: any) => {
                  return <li onClick={_ => { setIsExpanded(false); onSelect(user.id) }} id="listbox-item-0" role="option" className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9">
                    <div className="flex items-center space-x-3">
                      <span aria-label="Online" className={"flex-shrink-0 inline-block h-2 w-2 rounded-full " + (moment().subtract(5, 'minutes').isBefore(user.last_login) ? "text-green-400" : "bg-gray-300")}></span>
                      <span className="font-normal block truncate">
                        {user.first_name} {user.last_name} - ({user.user_type})
                      </span>
                    </div>
                    {user.id == userId && <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </span>}
                  </li>
                })
              }
            </ul>
          </div>}
        </div>
      </div>
    </div >)
};
