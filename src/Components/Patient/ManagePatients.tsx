import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import { navigate, useQueryParams } from "hookrouter";
import loadable from '@loadable/component';
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { downloadPatients, searchPatientFilter } from "../../Redux/actions";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
import Pagination from "../Common/Pagination";
import { PatientFilter } from "./PatientFilter";
import { InputSearchBox } from "../Common/SearchBox";
import { CSVLink } from "react-csv";
import moment from 'moment';
import SwipeableViews from 'react-swipeable-views';
import { makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import NavTabs from '../Common/NavTabs';

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function Badge(props: { color: string, icon: string, text: string }) {
  return (
    <span className="m-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-gray-50 text-gray-700" title={props.text}>
      <i className={"mr-2 text-md text-" + props.color + "-500 fas fa-" + props.icon}></i>
      {props.text}
    </span>
  )
}

const useStylesTab = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper
  },
}));

const now = moment().format('DD-MM-YYYY:hh:mm:ss');


const useStyles = makeStyles((theme) => ({
  paginateTopPadding: {
    paddingTop: "50px",
  },
  displayFlex: {
    display: "flex",
  },
}));


const RESULT_LIMIT = 30;


export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const classes = useStyles();
  const classesTab = useStylesTab();
  const theme = useTheme();
  const dispatch: any = useDispatch();


  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [DownloadFile, setDownloadFile] = useState("");
  const [qParams, setQueryParams] = useQueryParams();

  const tabValue = qParams.is_active === 'False' ? 1 : 0;

  let managePatients: any = null;
  const handleDownload = async () => {
    const res = await dispatch(downloadPatients());
    setDownloadFile(res.data);
    document.getElementById("downloadlink")?.click();
  };

  useEffect(() => {
    setIsLoading(true);
    const params = Object.assign({
      facility: facilityId,
      offset: (qParams.page ? qParams.page - 1 : 0) * RESULT_LIMIT
    }, qParams);

    dispatch(searchPatientFilter(params))
      .then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }).catch((ex: any) => {
        setIsLoading(false);
      })
  }, [qParams, dispatch, facilityId]);

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, true);
  }

  const handleTabChange = async (tab: number) => {

    updateQuery({
      is_active: tab ? 'False' : 'True',
      page: 1,
      name: '',
      disease_status: '',
      phone_number: ''
    });
  };

  const handlePagination = (page: number, limit: number) => {
    updateQuery({ page, limit });
  };

  const searchByName = (value: string) => {
    updateQuery({ name: value, page: 1 });
  }

  const searchByPhone = (value: string) => {
    updateQuery({ phone_number: value, page: 1 });
  }

  const handleFilter = (value: string) => {
    updateQuery({ disease_status: value, page: 1 });
  }

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      const patientUrl = patient.facility
        ? `/facility/${patient.facility}/patient/${patient.id}`
        : `/patient/${patient.id}`;
      return (
        <div
          key={`usr_${patient.id}`}
          onClick={() => navigate(patientUrl)}
          className="w-full pb-2 cursor-pointer border-b md:flex justify-between items-center mb-3"
        >
          <div className="px-4 w-full md:border-r md:mr-4">
            <div className="md:flex justify-between w-full">
              <div className="text-xl capitalize mb-2">
                {patient.name} -   {patient.age}
              </div>
              {patient.facility_object && (<div>
                {patient.facility_object.name}
              </div>)}
            </div>
            <div className="md:flex">
              <div>
                {patient.allow_transfer ? (
                  <Badge color="yellow" icon="unlock" text="Transfer Allowed" />
                ) : <Badge color="green" icon="lock" text="Transfer Blocked" />}
              </div>
              <div>
                {patient.disease_status === 'POSITIVE' && (
                  <Badge color="red" icon="radiation" text="Positive" />
                )}
              </div>
              <div>
                {['NEGATIVE', 'RECOVERY', 'RECOVERED'].indexOf(patient.disease_status) >= 0 && (
                  <Badge color="green" icon="smile-beam" text={patient.disease_status} />
                )}
              </div>
              {
                patient.is_antenatal && patient.is_active &&
                <div>
                  <span className="badge badge-pill badge-danger mr-2">
                    Pregnant Patient
                        </span>
                </div>
              }
              {patient.is_medical_worker && patient.is_active && (
                <Badge color="blue" icon="user-md" text="Medical Worker" />
              )}
              <div>
                {patient.contact_with_confirmed_carrier && (
                  <Badge color="red" icon="exclamation-triangle" text="Contact with confirmed carrier" />

                )}
              </div>
              <div>
                {patient.contact_with_suspected_carrier && (
                  <Badge color="yellow" icon="exclamation-triangle" text="Contact with suspected carrier" />
                )}
              </div>
            </div>
          </div>
          <div className="px-2">
            <Button size="small" variant="outlined" fullWidth>
              Details
            </Button>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !data) {
    managePatients = <Loading />;
  } else if (data && data.length) {
    managePatients = (
      <>
        {patientList}
        {totalCount > RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={qParams.page}
              defaultPerPage={RESULT_LIMIT}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  }
  else if (data && data.length === 0) {
    managePatients = (
      <Grid item xs={12} md={12} className={classes.displayFlex}>
        <Grid container justify="center" alignItems="center">
          <h5> No Covid Suspects Found</h5>
        </Grid>
      </Grid>
    );
  }

  return (
    <div>
      <PageTitle
        title="Patients"
        hideBack={!facilityId}
        className="mt-4" />
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 my-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Patients
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
            </dl>
          </div>
        </div>
        <div>
          <div>
            <div className="text-sm font-semibold mb-2">
              Search by Name
          </div>
            <InputSearchBox
              search={searchByName}
              value={qParams.name}
              placeholder='Search by Patient Name'
              errors=''
            />
          </div>
          <div>
            <div className="text-sm font-semibold mt-2">
              Search by number
          </div>
            <InputSearchBox
              search={searchByPhone}
              value={qParams.phone_number}
              placeholder='+919876543210'
              errors=''
            />
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Filter by Status</div>
            <PatientFilter filter={handleFilter} value={qParams.disease_status} />
          </div>
          <div className="mt-2">
            <button
              type="button"
              className="inline-flex items-center mt-1 md:mt-0 lg:mt-0 px-1 py-2 ml-1  lg:px-3 border border-green-500
               text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:text-green-500
               focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800
               active:bg-gray-50 transition
               ease-in-out duration-150 hover:shadow"
              onClick={handleDownload}
            >
              Download Patient List
          </button>
            <CSVLink
              id="downloadlink"
              className="hidden"
              data={DownloadFile}
              filename={`patients-${now}.csv`}
              target="_blank"
            >
            </CSVLink>
          </div>
        </div>
      </div>
      <div className={classesTab.root}>
        <NavTabs
          onChange={handleTabChange}
          options={[{ value: 0, label: "Live" }, { value: 1, label: "Discharged" }]}
          active={tabValue}
        />
        <SwipeableViews
          axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
          index={tabValue}
        >

          <TabPanel value={tabValue} index={0} dir={theme.direction}>
            <div className="flex flex-wrap md:-mx-4">{managePatients}</div>
          </TabPanel>
          <TabPanel value={tabValue} index={1} dir={theme.direction}>
            <div className="flex flex-wrap md:-mx-4">{managePatients}</div>
          </TabPanel>
        </SwipeableViews>
      </div>

    </div>
  );
};
