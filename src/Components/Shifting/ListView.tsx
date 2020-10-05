import React, { useState } from "react";
import loadable from '@loadable/component';
import { InputSearchBox } from "../Common/SearchBox";
import { navigate, useQueryParams } from "raviger";
import { useDispatch } from "react-redux";
import moment from "moment";
import GetAppIcon from '@material-ui/icons/GetApp';
import { downloadShiftRequests } from "../../Redux/actions";
import { CSVLink } from 'react-csv';

const PageTitle = loadable(() => import("../Common/PageTitle"));

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function ListView() {
  const dispatch: any = useDispatch();
  const [qParams, setQueryParams] = useQueryParams();

  const [downloadFile, setDownloadFile] = useState("");

  const triggerDownload = async () => {
    const res = await dispatch(downloadShiftRequests({}));
    setDownloadFile(res.data);
    document.getElementById(`shiftRequests-ALL`)?.click();
  }

  const updateQuery = (filter: any) => {
    // prevent empty filters from cluttering the url
    const nParams = Object.keys(filter).reduce((a, k) => filter[k] && filter[k] !== '--' ? Object.assign(a, { [k]: filter[k] }) : a, {});
    setQueryParams(nParams, true);
  }

  const searchbyName = (patient_name: string) => {
    const filter = { ...qParams, patient_name };
    updateQuery(filter);
  };

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
            className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-green-600 focus:text-green-600 rounded-r-full px-4 py-2"}>
            <span>Active</span>
          </button>
          <button
            className={"flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-green-600 focus:text-green-600 rounded-r-full px-4 py-2"}>
            <span>Completed</span>
          </button>
        </div>
        <div>
          <button className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-32 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-green-600 hover:border-gray-400 focus:text-green-600 focus:border-gray-400"
             onClick={() => navigate("/shifting")}>
            <i className="fa fa-list mr-1 transform rotate-90" aria-hidden="true"></i>
            Board View
          </button>
        </div>
        <div className="flex items-start gap-2">
          <button
            className={"flex leading-none border-2 border-gray-200 bg-white rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-green-600 focus:text-green-600 focus:border-gray-400 hover:border-gray-400 rounded-r-full px-4 py-2 text-sm"}>
            <i className="fa fa-filter mr-1" aria-hidden="true"></i>
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="px-4">
        test123
      </div>

      <CSVLink
        data={downloadFile}
        filename={`shift-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={`shiftRequests-ALL`}
      />
    </div>
  )
}