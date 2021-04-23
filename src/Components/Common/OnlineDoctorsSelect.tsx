import loadable from '@loadable/component';
import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import moment from "moment";
import { getOnlineDoctors } from "../../Redux/actions";

export const OnlineDoctorsSelect = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { userId, onSelect } = props;
  const initalState = { loading: false, users: new Array<any>() }
  const [state, setState] = useState(initalState)
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchUsers = useCallback(
    async (status: statusType) => {
      setState({ ...state, loading: true });
      const res = await dispatchAction(getOnlineDoctors());
      if (!status.aborted) {
        if (res && res.data) {
          setState({ loading: false, users: res.data.results });
        }
      }
    },
    [dispatchAction]
  );

  useAbortableEffect((status: statusType) => {
    fetchUsers(status);
  }, []);

  const selectedDoctor = state.users.find((item: any) => item.id == userId);
  return (
    <div className="pb-2">
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
                      (selectedDoctor ? (moment().subtract(5, 'minutes').isBefore(selectedDoctor.last_login) ? "bg-green-400" : "bg-gray-300") : "bg-blue-400")
                    }
                  >
                  </span>
                  <span className="block truncate">
                    {selectedDoctor ? selectedDoctor.first_name + ' ' + selectedDoctor.last_name : "Assign a doctor"}
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
          {isExpanded &&
            <div role="listbox" aria-labelledby="listbox-label" aria-activedescendant="listbox-item-3" className="multiselect-dropdown__search-dropdown w-full absolute border border-gray-400 bg-white mt-1 rounded-lg shadow-lg px-4 py-2 z-50">
              {
                state.users.map((user: any) => {
                  return <button onClick={_ => { setIsExpanded(false); onSelect(user.id) }} id="listbox-item-0" role="option" className="flex text-xs py-1 items-center w-full hover:bg-gray-200 focus:outline-none focus:bg-gray-200">
                    <div className="flex items-center space-x-3">
                      <span aria-label="Online" className={"flex-shrink-0 inline-block h-2 w-2 rounded-full " + (moment().subtract(5, 'minutes').isBefore(user.last_login) ? "bg-green-400" : "bg-gray-300")}></span>
                      <span className="font-normal block truncate">
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                    {user.id == userId && <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </span>}
                  </button>
                })
              }
            </div>
          }
        </div>
      </div>
    </div >)
};
