import { Tooltip, Button } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import WarningRoundedIcon from '@material-ui/icons/WarningRounded';
import { navigate } from "hookrouter";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getAllPatient } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: "8px"
  },
  card: {
    height: 160,
    width: "100%",
    backgroundColor: "#FFFFFF",
    cursor: "pointer"
  },
  title: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontWeight: 400,
    display: "inline-block",
    [theme.breakpoints.up("md")]: {
      width: "12vw"
    },
    [theme.breakpoints.down("sm")]: {
      width: "40vw"
    },
    [theme.breakpoints.down("xs")]: {
      width: "65vw"
    }
  },
  content: {
    padding: "5px 10px"
  },
  cardHeader: {
    padding: "10px"
  },
  contentText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "inline-block",
    [theme.breakpoints.up("md")]: {
      width: "10vw"
    },
    [theme.breakpoints.down("sm")]: {
      width: "40vw"
    },
    [theme.breakpoints.down("xs")]: {
      width: "40vw"
    }
  },
  spacing: {
    marginLeft: theme.spacing(1)
  },
  margin: {
    margin: theme.spacing(1)
  },
  addUserCard: {
    marginTop: "50px"
  },
  paginateTopPadding: {
    paddingTop: "50px"
  },
  userCardSideTitle: {
    fontSize: "13px"
  },
  toolTip: {
    fontSize: "13px"
  },
  displayFlex: {
    display: "flex"
  },
  minHeight: {
    minHeight: "65vh"
  }
}));

export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  const [data, setData] = useState(initialData);

  let managePatients: any = null;
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [positivePatient, setPositivePatient] = useState(false);
  const [offset, setOffset] = useState(0);

  const limit = 10;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getAllPatient({ facility: facilityId, limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, facilityId, offset]
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
    setOffset(offset);
  };
  //Variable to handle filtering

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      const patientUrl = patient.facility
        ? `/facility/${patient.facility}/patient/${patient.id}`
        : `/patient/${patient.id}`;
      return (
        <div key={`usr_${patient.id}`} className="w-full md:w-1/2 mt-4 px-2" >
          <div style={{backgroundColor:patient.disease_status === 'POSITIVE' ? '#FF3333':'#00FF66'}}
            onClick={() => navigate(patientUrl)}
            className="overflow-hidden shadow-lg block border rounded-lg bg-white h-full cursor-pointer hover:border-primary-500">
            <div className="px-6 py-4">
              <div className="flex justify-between">
                <div className="font-bold text-xl mb-2">
                  <Tooltip
                    title={
                      <span className={classes.toolTip}>{patient.name}</span>
                    }
                    interactive={true}
                  >
                    <span>{patient.name}</span>
                  </Tooltip>
                </div>
                <div >{!patient.is_active && <span className="badge badge-pill badge-dark">Inactive</span>}</div>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">Age: </span>
                {patient.age}
              </div>              
              {patient.contact_with_confirmed_carrier && (<div className="flex">
                <span className="font-semibold leading-relaxed">Contact with confirmed carrier</span>
                <WarningRoundedIcon color="error"></WarningRoundedIcon>
              </div>)}
              {patient.contact_with_suspected_carrier && !patient.contact_with_confirmed_carrier && (<div className="flex">
                <span className="font-semibold leading-relaxed">Contact with suspected carrier</span>
                <WarningRoundedIcon></WarningRoundedIcon>
              </div>)}
              <div>{patient.countries_travelled && (
                <span className="font-semibold leading-relaxed">Travel History: </span>)}
                {patient.countries_travelled.split(',').join(', ')}
              </div>
            </div>
          </div>
        </div>
      );
    });
  }
  //Showing the patients who are positive
  let positivePatientList = [];
  if(!isLoading){
    let i:any;
    for(i=0;i<data.length - 1;i++){
        if(data[i].disease_status === 'POSITIVE'){
          positivePatientList.push(patientList.filter(element => element.id = 'usr_' + data[i].id))
        }
    }
  }
  function filterData(e:any){
    setPositivePatient(!positivePatient)
  }

  if (isLoading || !data) {
    managePatients = <Loading />;
  } else if (data && data.length) {
    if(!positivePatient){
      managePatients = (
        <>
          {patientList}
          {totalCount > limit && (
            <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
              <Pagination
                cPage={currentPage}
                defaultPerPage={limit}
                data={{ totalCount }}
                onChange={handlePagination}
              />
            </Grid>
          )}
        </>
      );
    }
    else{
      managePatients = (
        <>
          {positivePatientList}
          {totalCount > limit && (
            <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
              <Pagination
                cPage={currentPage}
                defaultPerPage={limit}
                data={{ totalCount }}
                onChange={handlePagination}
              />
            </Grid>
          )}
        </>
      );
    }
  } else if (data && data.length === 0) {
    managePatients = (
      <Grid item xs={12} md={12} className={classes.displayFlex}>
        <Grid container justify="center" alignItems="center">
          <h5> No Covid Suspects Found</h5>
        </Grid>
      </Grid>
    );
  }

  return (
    <div className="px-2">
      <PageTitle title="Covid Suspects" hideBack={!facilityId} />
      <Button style={{backgroundColor:positivePatient ? '#FF6666':'#0066CC'}} onClick={filterData}> {positivePatient ? 'Show all':'Show positive cases'}</Button>
      <div className="flex flex-wrap mt-4">{managePatients}</div>
    </div>
  );
};
