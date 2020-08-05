import React, {useCallback, useState} from "react";
import {Loading} from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import ListFilter from "./ListFilter";
import {useDispatch} from "react-redux";
import {statusType, useAbortableEffect} from "../../Common/utils";
import {getShiftRequests} from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import Button from "@material-ui/core/Button";
import {navigate} from "hookrouter";

import {SHIFTING_CHOICES} from "../../Common/constants";

import {make as SlideOver} from "../Common/SlideOver.gen";
import {InputSearchBox} from "../Common/SearchBox";
import moment from "moment";

const limit = 100;

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
    return {
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
}

const shiftStatusOptions = SHIFTING_CHOICES.map(obj => obj.text);

const COMPLETED = ["COMPLETED","REJECTED","DESTINATION REJECTED"];
const ACTIVE = shiftStatusOptions.filter(option => !COMPLETED.includes(option))

export default function ListView() {

  const dispatch: any = useDispatch();
  const [filter, setFilter] = useState(initialFilterData);
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

    const searchByName = async (searchValue: string) => {
        setIsLoading(true);
        const res = await dispatch(getShiftRequests({ limit, offset: 0, patient_name: searchValue }));
        if (res && res.data) {
            setData(res.data.results);
            setTotalCount(res.data.count);
        }
        setIsLoading(false);
    }

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    let filterData = { ...filter }
    filterData['offset'] = offset;

    filterOnChange(filterData);
  };

  let patientFilter = (filter:string) => data.filter(({status}) => status===filter).map((shift: any, idx: number) => {
    return (
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
                <div>
                    <span className="font-semibold leading-relaxed"> Last Modified:  </span>
                    <span className="badge badge-pill badge-primary py-1 px-2">
                        { moment(shift.modified_date).format('LLL') || "--" }
                    </span>
                </div>
            </div>
            <div className="mt-2">
              <Button size="small" variant="outlined" fullWidth
                  onClick={ () => navigate(`/shifting/${shift.external_id}`)}>
                View All Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col h-screen px-2 md:px-8 pb-2">

        <div className="flex items-end justify-between">
          <PageTitle title={"Shifting"} hideBack={true} />

            <div className="md:px-4">
                <InputSearchBox
                    search={searchByName}
                    placeholder='Patient Name'
                    errors=''
                />
            </div>

          <div className="bg-gray-200 text-sm text-gray-500 leading-none border-2 border-gray-200 rounded-full inline-flex">
            <button 
              className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2"
              + (boardFilter === ACTIVE ? " bg-white text-gray-800" : " bg-gray-200 text-sm text-gray-500")} 
              onClick={_=>setBoardFilter(ACTIVE)}
            >
              <span>Active</span>
            </button>
            <button 
              className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2"
              + (boardFilter === COMPLETED ? " bg-white text-gray-800" : " bg-gray-200 text-sm text-gray-500")} 
              onClick={_=>setBoardFilter(COMPLETED)}>
              <span>Completed</span>
            </button>
          </div>
          <div className="flex items-start gap-2">
            <button 
              className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2"
              + (showFilters ? " bg-white text-gray-800" : " bg-gray-200 text-sm text-gray-500")} 
              onClick={_=>setShowFilters(show=>!show)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-current w-4 h-4 mr-2">
                  <line x1="8" y1="6" x2="21" y2="6">

                  </line>
                  <line x1="8" y1="12" x2="21" y2="12"> </line>
                  <line x1="8" y1="18" x2="21" y2="18"> </line>
                  <line x1="3" y1="6" x2="3.01" y2="6"> </line>
                  <line x1="3" y1="12" x2="3.01" y2="12"> </line>
                  <line x1="3" y1="18" x2="3.01" y2="18"> </line>
              </svg>
              <span>Filters</span>
            </button>

            { totalCount > limit && (
              <div className="flex w-full justify-center -mb-2">
                <Pagination
                  cPage={currentPage}
                  defaultPerPage={limit}
                  data={{ totalCount }}
                  onChange={handlePagination}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll">
          {isLoading ? <Loading /> : boardFilter.map(board=>
            <div className="rounded-md bg-gray-200 flex-shrink-0 w-3/4 md:w-1/2 lg:w-1/3 p-2 pb-4 mr-3 h-full overflow-y-auto">
              <div className="flex justify-between py-1">
                  <h3 className="text-sm">{board}</h3>
                  <svg className="h-4 fill-current text-grey-dark cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 10a1.999 1.999 0 1 0 0 4 1.999 1.999 0 1 0 0-4zm7 0a1.999 1.999 0 1 0 0 4 1.999 1.999 0 1 0 0-4zm7 0a1.999 1.999 0 1 0 0 4 1.999 1.999 0 1 0 0-4z"/></svg>
              </div>
              <div className="text-sm mt-2">
                  {patientFilter(board)}
              </div>
            </div>
          )}
        </div>



      <SlideOver show={showFilters} setShow={setShowFilters}>
        <div className="bg-white h-screen p-4">
          <ListFilter
            filter={filter}
            onChange={filterOnChange}/>
        </div>
      </SlideOver>
    </div>
  )
}
