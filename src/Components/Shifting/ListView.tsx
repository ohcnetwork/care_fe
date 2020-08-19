import React, {useCallback, useState} from "react";
import ListFilter from "./ListFilter";
import ShiftingBoard from "./ShiftingBoard";
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

import loadable from '@loadable/component';

const Loading = loadable( () => import("../Common/Loading"));
const PageTitle = loadable( () => import("../Common/PageTitle"));

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
  offset: 0
}
const shiftStatusOptions = SHIFTING_CHOICES.map(obj => obj.text);

const COMPLETED = ["COMPLETED","REJECTED","DESTINATION REJECTED"];
const ACTIVE = shiftStatusOptions.filter(option => !COMPLETED.includes(option))

export default function ListView() {

  const [filter, setFilter] = useState(initialFilterData);
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filterOnChange = (filterData : any) => {
    setFilter(filterData);
  }

  return (
    <div className="flex flex-col h-screen px-2 md:px-8 pb-2">

        <div className="flex items-end justify-between">
          <PageTitle title={"Shifting"} hideBack={true} />

            <div className="md:px-4">
                <InputSearchBox
                    search={query => filterOnChange({...filter, patient_name:query})}
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
          </div>
        </div>

        <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll">
          {isLoading ? <Loading /> : boardFilter.map(board=>
            <ShiftingBoard filterProp={filter} board={board} />
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
