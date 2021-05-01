import { navigate, useQueryParams } from "raviger";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { DOWNLOAD_TYPES } from "../../Common/constants";
import {
  getFacilities,
  downloadFacility,
  downloadFacilityCapacity,
  downloadFacilityDoctors,
  downloadFacilityTriage,
} from "../../Redux/actions";
import loadable from "@loadable/component";
import { SelectField } from "../Common/HelperInputFields";
import { InputLabel } from "@material-ui/core";
import Pagination from "../Common/Pagination";
import { FacilityModel } from "./models";
import { InputSearchBox } from "../Common/SearchBox";
import { CSVLink } from "react-csv";
import moment from "moment";
import { Theme, createStyles, makeStyles } from "@material-ui/core/styles";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { faSearch, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      // "grid-column": "span 4 / span 4",
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
  })
);
const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export const HospitalList2 = () => {
  const [qParams, setQueryParams] = useQueryParams();
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
  const downloadTypes = [...DOWNLOAD_TYPES];
  const [downloadSelect, setdownloadSelect] = useState("Facility List");
  const limit = 15;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = qParams.search
        ? { limit, offset, search_text: qParams.search, kasp_empanelled: qParams.kasp_empanelled }
        : { limit, offset, kasp_empanelled: qParams.kasp_empanelled };

      const res = await dispatchAction(getFacilities(params));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, qParams.search, qParams.kasp_empanelled]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const onSearchSuspects = (search: string) => {
    if (search !== "") setQueryParams({ search }, true);
    else setQueryParams({ kasp_empanelled: qParams.kasp_empanelled }, true);
  };

  const onKaspChange = (value: string) => {
    setQueryParams({ "kasp_empanelled": value, search: qParams.search ? qParams.search : '' }, true);
  }

  const handleDownload = async () => {
    const res = await dispatchAction(downloadFacility());
    setDownloadFile(res.data);
    document.getElementById("facilityDownloader")?.click();
  };

  const handleCapacityDownload = async () => {
    const cap = await dispatchAction(downloadFacilityCapacity());
    setCapacityDownloadFile(cap.data);
    document.getElementById("capacityDownloader")?.click();
  };

  const handleDoctorsDownload = async () => {
    const doc = await dispatchAction(downloadFacilityDoctors());
    setDoctorsDownloadFile(doc.data);
    document.getElementById("doctorsDownloader")?.click();
  };

  const handleTriageDownload = async () => {
    const tri = await dispatchAction(downloadFacilityTriage());
    setTriageDownloadFile(tri.data);
    document.getElementById("triageDownloader")?.click();
  };

  const handleDownloader = () => {
    switch (downloadSelect) {
      case "Facility List":
        handleDownload();
        break;
      case "Facility Capacity List":
        handleCapacityDownload();
        break;
      case "Facility Doctors List":
        handleDoctorsDownload();
        break;
      case "Facility Triage Data":
        handleTriageDownload();
        break;
    }
  };

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const kaspOptionValues = [
    { "id": "", "text": "Not Selected" },
    { "id": "true", "text": "Yes" },
    { "id": "false", "text": "No" }
  ]

  let facilityList: any[] = [];
  if (data && data.length) {
    facilityList = data.map((facility: any, idx: number) => {
      return (
        <div
          key={`usr_${facility.id}`}
          className="w-full md:w-1/3 mt-6 md:px-4"
        >
          <div className="block rounded-lg bg-white h-full hover:border-primary-500 overflow-hidden relative">
            <div className="h-full flex flex-col font-roboto justify-between">
              <div className="px-6 py-3">
                <div className="font-black text-2xl font-bold font-poppins capitalize mt-2">
                  {facility.name}
                </div>
                <div className="inline-flex my-3 items-center px-2.5 py-0.5 mr-4 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800">
                  {facility.facility_type}
                </div>
                {facility.kasp_empanelled && (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-yellow-100 text-yellow-800">
                    KASP
                  </div>
                )
                }

                <div className="mb-3">
                  <FontAwesomeIcon icon={faPhone} className="w-5 transform rotate-90 text-emerald-500" color="emerald-500" />
                  {/* <a
                    href={`tel:${facility.phone_number}`}
                    className="font-semibold"
                  > */}
                  {/* <a href={`tel:${facility.phone_number}`} className="ml-2"> */}
                  <span className="font-bold text-black"> {facility.phone_number || "-"} </span>
                  {/* </a> */}
                </div>

                <div className="grid grid-cols-10 font-semibold">
                  <div>
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 text-emerald-500" color="emerald-500" />
                  </div>
                  <div className="col-span-9">
                    {facility.local_body_object?.name}, {facility.district?.name}

                    <div className="mt-2">
                      Ward:
                      {facility.ward_object?.number +
                        ", " +
                        facility.ward_object?.name || "-"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-2 mx-3">
                <div className="mt-2">
                  <button
                    type="button"
                    className="w-full py-2 border-emerald-500 border-2 text-emerald-500 mt-2 font-bold"
                    onClick={() => navigate(`/facility/${facility.id}`)}
                  >
                    View Details
                    </button>
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
    manageFacilities = qParams?.search ? (
      <div className="w-full">
        <div className="p-16 mt-4 text-gray-800 mx-auto text-center whitespace-no-wrap text-sm font-semibold rounded ">
          No results found
        </div>
      </div>
    ) : (
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
    <div className="bg-gray-200">
      <div className="grid grid-cols-2">
        <PageTitle title="Facilities" hideBack={true} className="mx-3 md:mx-8 font-poppins" />

        <div className="w-full mt-7">
          <div>
            <Accordion className="lg:w-1/2 mt-2 lg:mt-0 md:mt-0 w-3/4 m-0 m-auto">
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography className={classes.heading}>Downloads</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div>
                  <InputLabel className="text-sm">Download type</InputLabel>
                  <div className="flex flex-row">
                    <SelectField
                      name="select_download"
                      className="text-sm"
                      variant="outlined"
                      margin="dense"
                      optionArray={true}
                      value={downloadSelect}
                      options={downloadTypes}
                      onChange={(e) => {
                        setdownloadSelect(e.target.value);
                      }}
                    />
                    <button
                      className="bg-green-600 hover:shadow-md px-2 ml-2 my-2  rounded"
                      onClick={handleDownloader}
                    >
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 16 16"
                        fill="white"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M.5 8a.5.5 0 0 1 .5.5V12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5a.5.5 0 0 1 1 0V12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8.5A.5.5 0 0 1 .5 8z"
                        />
                        <path
                          fill-rule="evenodd"
                          d="M5 7.5a.5.5 0 0 1 .707 0L8 9.793 10.293 7.5a.5.5 0 1 1 .707.707l-2.646 2.647a.5.5 0 0 1-.708 0L5 8.207A.5.5 0 0 1 5 7.5z"
                        />
                        <path
                          fill-rule="evenodd"
                          d="M8 1a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0v-8A.5.5 0 0 1 8 1z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="hidden">
                  <CSVLink
                    data={DownloadFile}
                    filename={`facilities-${now}.csv`}
                    target="_blank"
                    className="hidden"
                    id="facilityDownloader"
                  ></CSVLink>
                  <CSVLink
                    data={capacityDownloadFile}
                    filename={`facility-capacity-${now}.csv`}
                    className="hidden"
                    id="capacityDownloader"
                    target="_blank"
                  ></CSVLink>
                  <CSVLink
                    data={doctorsDownloadFile}
                    filename={`facility-doctors-${now}.csv`}
                    target="_blank"
                    className="hidden"
                    id="doctorsDownloader"
                  ></CSVLink>
                  <CSVLink
                    data={triageDownloadFile}
                    filename={`facility-triage-${now}.csv`}
                    target="_blank"
                    className="hidden"
                    id="triageDownloader"
                  ></CSVLink>
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        </div>
      </div>

      <div>
        <div className="ml-5 mt-3 w-full">
          <InputSearchBox
            value={qParams.search}
            search={onSearchSuspects}
            placeholder="Search by Facility / District Name"
            errors=""
          />
        </div>
      </div>

      {/* <div className="mx-8 my-2 w-1/3">
        <InputLabel id="kasp_empanelled">
          KASP empanelled
        </InputLabel>
        <SelectField
          name="facility_type"
          variant="outlined"
          margin="dense"
          value={qParams.kasp_empanelled}
          options={kaspOptionValues}
          onChange={(e) => onKaspChange(e.target.value)}
          errors=""
        />
      </div> */}

      <div className="px-3 md:px-8">
        <div className="flex flex-wrap md:-mx-4">{manageFacilities}</div>
      </div>
    </div>
  );
};
