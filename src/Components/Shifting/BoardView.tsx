import React, { useState } from "react";
import { useQueryParams } from 'raviger';
import ListFilter from "./ListFilter";
import ShiftingBoard from "./ShiftingBoard";
import { SHIFTING_CHOICES } from "../../Common/constants";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { InputSearchBox } from "../Common/SearchBox";
import { downloadShiftRequests } from "../../Redux/actions";
import loadable from '@loadable/component';
import { CSVLink } from 'react-csv';
import { useDispatch } from "react-redux";
import moment from "moment";

import GetAppIcon from '@material-ui/icons/GetApp';

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const limit = 30;

const initialFilterData = {
  status: 'Show All',
  facility: '',
  orgin_facility: '',
  shifting_approving_facility: '',
  assigned_facility: '',
  emergency: '--',
  is_up_shift: '--',
  limit: limit,
  patient_name: '',
  created_date_before: null,
  created_date_after: null,
  modified_date_before: null,
  modified_date_after: null,
  patient_phone_number: '',
  offset: 0,
  ordering: null,
}

const formatFilter = (params: any) => {
  const filter = { ...initialFilterData, ...params };
  return {
    status: filter.status === 'Show All' ? null : filter.status,
    facility: '',
    orgin_facility: filter.orgin_facility || undefined,
    shifting_approving_facility: filter.shifting_approving_facility || undefined,
    assigned_facility: filter.assigned_facility || undefined,
    emergency: (filter.emergency && filter.emergency) === '--' ? '' : (filter.emergency === 'yes' ? 'true' : 'false'),
    is_up_shift: (filter.is_up_shift && filter.is_up_shift) === '--' ? '' : (filter.is_up_shift === 'yes' ? 'true' : 'false'),
    limit: limit,
    offset: filter.offset,
    patient_name: filter.patient_name || undefined,
    created_date_before: filter.created_date_before || undefined,
    created_date_after: filter.created_date_after || undefined,
    modified_date_before: filter.modified_date_before || undefined,
    modified_date_after: filter.modified_date_after || undefined,
    patient_phone_number: filter.patient_phone_number || undefined,
    ordering: filter.ordering || undefined,
  };
}

const shiftStatusOptions = SHIFTING_CHOICES.map(obj => obj.text);

const COMPLETED = ["COMPLETED", "REJECTED", "DESTINATION REJECTED"];
const ACTIVE = shiftStatusOptions.filter(option => !COMPLETED.includes(option))

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function BoardView() {
  const [qParams, setQueryParams] = useQueryParams();
  const dispatch: any = useDispatch();
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  const [downloadFile, setDownloadFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const updateQuery = (filter: any) => {
    // prevent empty filters from cluttering the url
    const nParams = Object.keys(filter).reduce((a, k) => filter[k] && filter[k] !== '--' ? Object.assign(a, { [k]: filter[k] }) : a, {});
    setQueryParams(nParams, true);
  }

  const searchbyName = (patient_name: string) => {
    const filter = { ...qParams, patient_name };
    updateQuery(filter);
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  const badge = (key: string, value: any) => {
    return (
      value && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-white text-gray-600 border">
        {key}{": "}{value}
      </span>
    )
  };

  const appliedFilters = formatFilter(qParams);

  const triggerDownload = async () => {
    const res = await dispatch(downloadShiftRequests({ ...formatFilter(qParams), csv: 1 }));
    setDownloadFile(res.data);
    document.getElementById(`shiftRequests-ALL`)?.click();
  }

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="flex items-end justify-between px-4">
        <div className="flex items-center">
          <PageTitle title={"Shifting"} hideBack={true} />
          <GetAppIcon className="cursor-pointer mt-4" onClick={triggerDownload} />
        </div>
        <div className="md:px-4">
          <InputSearchBox
            value={qParams.patient_name}
            search={searchbyName}
            placeholder='Patient Name'
            errors=''
          />
        </div>
        <div className="bg-gray-200 text-sm text-gray-500 leading-none border-2 border-gray-200 rounded-full inline-flex">
          <button
            className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2"
              + (boardFilter === ACTIVE ? " bg-white text-gray-800" : " bg-gray-200 text-sm text-gray-500")}
            onClick={_ => setBoardFilter(ACTIVE)}
          >
            <span>Active</span>
          </button>
          <button
            className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2"
              + (boardFilter === COMPLETED ? " bg-white text-gray-800" : " bg-gray-200 text-sm text-gray-500")}
            onClick={_ => setBoardFilter(COMPLETED)}>
            <span>Completed</span>
          </button>
        </div>
        <div className="flex items-start gap-2">
          <button
            className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2"
              + (showFilters ? " bg-white text-gray-800" : " bg-gray-200 text-sm text-gray-500")}
            onClick={_ => setShowFilters(show => !show)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-current w-4 h-4 mr-2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"> </line>
              <line x1="8" y1="18" x2="21" y2="18"> </line>
              <line x1="3" y1="6" x2="3.01" y2="6"> </line>
              <line x1="3" y1="12" x2="3.01" y2="12"> </line>
              <line x1="3" y1="18" x2="3.01" y2="18"> </line>
            </svg>
            <span>Filters</span>
          </button>
        </div>
      </div>
      <div className="flex space-x-2 mt-2">
        {badge("Emergency", appliedFilters.emergency === 'true' ? 'yes' : appliedFilters.emergency === 'false' ? 'no' : undefined)}
        {badge("Up Shift", appliedFilters.is_up_shift === 'true' ? 'yes' : appliedFilters.is_up_shift === 'false' ? 'no' : undefined)}
        {badge("Phone Number", appliedFilters.patient_phone_number)}
        {badge("Patient Name", appliedFilters.patient_name)}
        {badge("Modified After", appliedFilters.modified_date_after)}
        {badge("Modified Before", appliedFilters.modified_date_before)}
        {badge("Created Before", appliedFilters.created_date_before)}
        {badge("Created After", appliedFilters.created_date_after)}
        {badge("Filtered By", appliedFilters.assigned_facility && "Assigned Facility")}
        {badge("Filtered By", appliedFilters.orgin_facility && "Origin Facility")}
        {badge("Filtered By", appliedFilters.shifting_approving_facility && "Shifting Approving Facility")}
      </div>
      <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll">
        {isLoading ? <Loading /> : boardFilter.map(board =>
          <ShiftingBoard filterProp={qParams} board={board} formatFilter={formatFilter} />
        )}
      </div>
      <CSVLink
        data={downloadFile}
        filename={`shift-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={`shiftRequests-ALL`}
      />
      <SlideOver show={showFilters} setShow={setShowFilters}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter
            filter={qParams}
            onChange={applyFilter}
            closeFilter={() => setShowFilters(false)} />
        </div>
      </SlideOver>

    </div>
  )
}