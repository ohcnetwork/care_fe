import React, { useCallback, useState, useEffect } from "react";
import Loading from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import ListFilter from "./ListFilter";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getShiftRequests } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import Button from "@material-ui/core/Button";
import { navigate } from "hookrouter";

import { SHIFTING_CHOICES } from "../../Common/constants";

import { make as SlideOver } from "../Common/SlideOver.gen";
import { InputSearchBox } from "../Common/SearchBox";
import moment from "moment";

const limit = 30;

const formatFilter = (filter: any) => {
  return {
   status: filter.status === 'Show All' ? null : filter.status,
   facility: '',
   orgin_facility: filter.orgin_facility,
   shifting_approving_facility: filter.shifting_approving_facility,
   assigned_facility: filter.assigned_facility,
   emergency: (filter.emergency && filter.emergency) === '--' ? '' : (filter.emergency === 'yes' ? 'true' : 'false'),
   is_up_shift: (filter.is_up_shift && filter.is_up_shift) === '--' ? '' : (filter.is_up_shift === 'yes' ? 'true' : 'false'),
   limit: limit,
   offset: filter.offset,
   patient_name: filter.patient_name || undefined
};
}

interface boardProps {
    board: string,
    filterProp: any
}

export default function ListView({ board, filterProp } : boardProps) {

  const dispatch: any = useDispatch();
  const [filter, setFilter] = useState(filterProp);
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);


  const filterOnChange = (filterData : any) => {
    setFilter(filterData);
  }
  useEffect(() => {
    setFilter(filterProp)
  }, [filterProp])
  useEffect(() => {
      setIsLoading(true);
      dispatch(getShiftRequests(formatFilter({...filterProp, status:board}), board)).then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      });
    },
    [board, dispatch, filter, filterProp]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    dispatch(getShiftRequests(formatFilter({...filterProp, status:board, offset: offset}), board)).then((res: any) => {
      console.log("Received:" + board)
      if (res && res.data) {
        setData(data => [...data, ...res.data.results]);
        setTotalCount(res.data.count);
        setCurrentPage(1)
      }
      setIsLoading(false);
    });
  };

  let patientFilter = (filter: string) =>{
    console.log("Re-Rendering")
    return data
      .filter(({ status }) => status === filter)
      .map((shift: any, idx: number) =>          
          <div key={`shift_${shift.id}`} className="w-full mt-2">
            <div className="overflow-hidden shadow rounded-lg bg-white h-full mx-2">
              <div className="px-6 py-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between">
                    <div className="font-bold text-xl capitalize mb-2">
                      {shift.patient_object.name}
                    </div>

                    <div>
                      {shift.emergency && (
                        <span className="badge badge-pill badge-warning mr-2">
                          emergency
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold leading-relaxed">
                      Orgin facility:{" "}
                    </span>
                    {(shift.orgin_facility_object || {}).name}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      Shifting approving facility:{" "}
                    </span>
                    {(shift.shifting_approving_facility_object || {}).name}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      Assigned facility:{" "}
                    </span>
                    {(shift.assigned_facility_object || {}).name}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {" "}
                      Last Modified:{" "}
                    </span>
                    <span className="badge badge-pill badge-primary py-1 px-2">
                      {moment(shift.modified_date).format("LLL") || "--"}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <Button
                    size="small"
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(`/shifting/${shift.external_id}`)}
                  >
                    View All Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
      );
    }
  return (
    <div className="rounded-md bg-gray-200 flex-shrink-0 w-3/4 md:w-1/2 lg:w-1/3 p-2 pb-4 mr-3 h-full overflow-y-auto">
      <div className="flex justify-between py-1">
        <h3 className="text-sm flex">{board}<p className="mx-2 px-2 rounded-full bg-gray-400">{totalCount || "-"}</p></h3>
        <svg
          className="h-4 fill-current text-grey-dark cursor-pointer"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M5 10a1.999 1.999 0 1 0 0 4 1.999 1.999 0 1 0 0-4zm7 0a1.999 1.999 0 1 0 0 4 1.999 1.999 0 1 0 0-4zm7 0a1.999 1.999 0 1 0 0 4 1.999 1.999 0 1 0 0-4z" />
        </svg>
      </div>
      <div className="text-sm mt-2 pb-2 flex flex-col">
        { isLoading ? <p className="mx-auto p-4">Loading</p>:data?.length > 0 ? patientFilter(board) : <p className="mx-auto p-4">No Patients to Show</p>}
        { !isLoading && data?.length < (totalCount || 0) &&
        <button onClick={_=>handlePagination(currentPage + 1, limit)} className="mx-auto my-4 p-2 px-4 bg-gray-100 rounded-md hover:bg-white">More...</button>}
      </div>
    </div>
  );
}
