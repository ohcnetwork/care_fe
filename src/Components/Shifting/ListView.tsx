import React, { useState, useCallback } from "react";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import ListFilter from "./ListFilter";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getShiftRequests } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import Button from "@material-ui/core/Button";
import { navigate } from "hookrouter";

const limit = 15;

const initialFilterData = {
  status: 'Show All',
  facility: '',
  orgin_facility: '',
  shifting_approving_facility: '',
  assigned_facility: '',
  emergency: '--',
  is_up_shift: '--',
  limit: limit,
  offset: 0
}

const formatFilter = (filter: any) => {
 let filterData = {
      status: filter.status === 'Show All' ? null : filter.status,
      facility: '',
      orgin_facility: filter.orgin_facility,
      shifting_approving_facility: filter.shifting_approving_facility,
      assigned_facility: filter.assigned_facility,
      emergency: (filter.emergency && filter.emergency) === '--' ? '' : (filter.emergency === 'yes' ? 'true' : 'false'),
      is_up_shift: (filter.is_up_shift && filter.is_up_shift) === '--' ? '' : (filter.is_up_shift === 'yes' ? 'true' : 'false'),
      limit: limit,
      offset: filter.offset
 };

 return filterData;
}

export default function ListView(props: any) {

  const dispatch: any = useDispatch();
  const [filter, setFilter] = useState(initialFilterData);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const filterOnChange = (filterData : any) => {
    setFilter(filterData);
  }

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getShiftRequests(formatFilter(filter))
      );
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [filter, dispatch]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    let filterData = { ...filter }
    filter['offset'] = offset;

    filterOnChange(filterData);
  };

  const shiftingList = () => {
    if (isLoading) {
      return <Loading />
    } else {
      let patientList: any[] = [];
      patientList = data.map((shift: any, idx: number) => {
        return (
          <div key={`shift_${shift.id}`} className="w-full md:w-1/2 mt-2">
            <div className="overflow-hidden shadow rounded-lg bg-white h-full mx-2">
              <div className="px-6 py-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between">
                    <div className="font-bold text-xl capitalize mb-2">
                      {shift.patient_object.name}
                    </div>
  
                    <div className="flex">
                      <div>
                        <span className="badge badge-pill badge-primary mx-2">
                          {shift.status}
                        </span>
                      </div>
                      <div>
                        {shift.emergency && (
                          <span className="badge badge-pill badge-warning mr-2">
                            emergency
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-semibold leading-relaxed">Orgin facility: </span>
                    {(shift.orgin_facility_object||{}).name}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">Shifting approving facility: </span>
                    {(shift.shifting_approving_facility_object||{}).name}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">Assigned facility: </span>
                    {(shift.assigned_facility_object||{}).name}
                  </div>
                </div>
                <div className="mt-2">
                  <Button size="small" variant="outlined" fullWidth
                      onClick={e => navigate(`/shifting/${shift.external_id}`)}>
                    View All Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      });
      return (
        <div className="flex flex-wrap -mx-2">

          {!patientList.length && (
            <div className="flex-1 flex items-center justify-center h-64">
              No records found.
            </div>
          )}

          {patientList}

          {totalCount > limit && (
          <div className="mt-2 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
        </div>
      )
    }
  }

  return (
    <div className="mx-3 md:mx-8 mb-2">
        <PageTitle title={"Shifting"} hideBack={true} />

        <ListFilter
          filter={filter}
          onChange={filterOnChange}/>

        <div className="mt-4">
          {shiftingList()}
        </div>
    </div>
  )
}