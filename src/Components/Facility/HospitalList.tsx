import { navigate } from "hookrouter";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getFacilities,
  downloadFacility,
  downloadFacilityCapacity,
  downloadFacilityDoctors,
  downloadFacilityTriage
} from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import Pagination from "../Common/Pagination";
import { FacilityModel } from "./models";
import { InputSearchBox } from "../Common/SearchBox";
import PageTitle from "../Common/PageTitle";
import { CSVLink } from "react-csv";
import moment from 'moment';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        width: '100%',
      },
      heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
      },
    }),
);
const now = moment().format('DD-MM-YYYY:hh:mm:ss');

export const HospitalList = () => {
  const classes = useStyles();
  const dispatchAction: any = useDispatch();
  const [data, setData] = useState<Array<FacilityModel>>([]);
  let manageFacilities: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [DownloadFile, setDownloadFile] = useState("");
  const [capacityDownloadFile, setCapacityDownloadFile] = useState("");
  const [doctorsDownloadFile, setDoctorsDownloadFile] = useState("");
  const [triageDownloadFile, setTriageDownloadFile] = useState("");

  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getFacilities({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset]
  );

  const handleDownload = async () => {
    const res = await dispatchAction(downloadFacility());
    setDownloadFile(res.data);
  };

  const handleCapacityDownload = async () => {
    const cap = await dispatchAction(downloadFacilityCapacity());
    setCapacityDownloadFile(cap.data);
  };

  const handleDoctorsDownload = async () => {
    const doc = await dispatchAction(downloadFacilityDoctors());
    setDoctorsDownloadFile(doc.data);
  };

  const handleTriageDownload = async () => {
    const tri = await dispatchAction(downloadFacilityTriage());
    setTriageDownloadFile(tri.data);
  };

  useAbortableEffect(
    (status: statusType) => {
      handleDownload();
      handleCapacityDownload();
      handleDoctorsDownload();
      handleTriageDownload();
      fetchData(status);
    },
    [fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };
  const onSearchSuspects = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatchAction(getFacilities({ limit, offset, search_text: searchValue }));
    if (res && res.data) {
      setData(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  }

  let facilityList: any[] = [];
  if (data && data.length) {
    facilityList = data.map((facility: any, idx: number) => {
      return (
        <div key={`usr_${facility.id}`} className="w-full md:w-1/2 mt-6 md:px-4">
          <div
            className="block rounded-lg bg-white shadow h-full hover:border-primary-500 overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              <div className="px-6 py-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800">
                  {facility.facility_type}
                </div>
                <div className="font-black text-2xl capitalize mt-2">
                  {facility.name}
                </div>
                <div className="mt-2">
                  <div className="text-gray-500 leading-relaxed font-light">District:</div>
                  <div className="font-semibold">{facility.district_object?.name}</div>
                </div>
              </div>
              <div className="mt-2 bg-gray-50 border-t px-6 py-2">
                <div className="flex py-4 justify-between">
                  <div>
                    <div className="text-gray-500 leading-relaxed">Phone:</div>
                    <a href={`tel:${facility.phone_number}`} className="font-semibold">{facility.phone_number || "-"}</a>
                  </div>
                  <span className="inline-flex rounded-md shadow-sm">
                    <button type="button" className="inline-flex items-center px-3 py-2 border border-green-500 text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:text-green-500 focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                      onClick={() => navigate(`/facility/${facility.id}`)}>
                      View Facility
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !data) {
    manageFacilities = <Loading />;
  } else if (data && data.length) {
    manageFacilities = (
      <>
        {facilityList}
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    manageFacilities = (
      <div>
        <div
          className="p-16 mt-4 bg-white shadow rounded-md shadow border border-grey-500 whitespace-no-wrap text-sm font-semibold rounded cursor-pointer hover:bg-gray-300"
          onClick={() => navigate("/facility/create")}
        >
          Create a new facility
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="Facilities" hideBack={true} className="mx-3 md:mx-8" />
      <div className="flex flex-row">
        <div className="ml-3 w-3/4 md:ml-8">
          <InputSearchBox
            search={onSearchSuspects}
            placeholder="Search by Facility / District Name"
            errors=""
          />
        </div>
        <div className={classes.root}>
        <Accordion>
          <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
          >
            <Typography className={classes.heading}>Downloads</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div className="w-1/4 text-center items-center">
              <CSVLink
                  data={DownloadFile}
                  filename={`facilities-${now}.csv`}
                  target="_blank"
              >
                <button
                    type="button"
                    className="inline-flex items-center mr-2 px-1 py-3 ml-1  lg:px-3 border border-green-500 text-sm leading-4 font-medium rounded-md text-green-700 hover:bg-green-600 hover:text-white bg-white focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                    onClick={handleDownload}
                >
                  Download Facility List
                </button>
              </CSVLink>
            </div>
            <div className="w-1/4 text-center items-center">
              <CSVLink
                  data={capacityDownloadFile}
                  filename={`facility-capacity-${now}.csv`}
                  target="_blank"
              >
                <button
                    type="button"
                    className="inline-flex items-center mr-2 px-1 py-3 ml-1  lg:px-3 border border-green-500 text-sm leading-4 font-medium rounded-md text-green-700 hover:bg-green-600 hover:text-white bg-white focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                    onClick={handleCapacityDownload}
                >
                  Download Facility Capacity List
                </button>
              </CSVLink>
            </div>
            <div className="w-1/4 text-center items-center">
              <CSVLink
                  data={doctorsDownloadFile}
                  filename={`facility-doctors-${now}.csv`}
                  target="_blank"
              >
                <button
                    type="button"
                    className="inline-flex items-center mr-2 px-1 py-3 ml-1  lg:px-3 border border-green-500 text-sm leading-4 font-medium rounded-md text-green-700 hover:bg-green-600 hover:text-white bg-white focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                    onClick={handleDoctorsDownload}
                >
                  Download Facility Doctors List
                </button>
              </CSVLink>
            </div>
            <div className="w-1/4 text-center items-center">
              <CSVLink
                  data={triageDownloadFile}
                  filename={`facility-triage-${now}.csv`}
                  target="_blank"
              >
                <button
                    type="button"
                    className="inline-flex items-center mr-2 px-1 py-3 ml-1  lg:px-3 border border-green-500 text-sm leading-4 font-medium rounded-md text-green-700 hover:bg-green-600 hover:text-white bg-white focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                    onClick={handleTriageDownload}
                >
                  Download Facility Triage Data
                </button>
              </CSVLink>
            </div>
          </AccordionDetails>
        </Accordion>
        </div>
      </div>
      <div className="px-3 md:px-8">
        <div className="flex flex-wrap md:-mx-4">{manageFacilities}</div>
      </div>
    </div>
  );
};
