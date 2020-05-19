import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import { navigate } from "hookrouter";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getAllPatient } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { PatientFilter } from "./PatientFilter";

const useStyles = makeStyles((theme) => ({
  paginateTopPadding: {
    paddingTop: "50px",
  },
  displayFlex: {
    display: "flex",
  },
}));

export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  const [data, setData] = useState(initialData);
  const [diseaseStatus, setDiseaseStatus] = useState('');
  let managePatients: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getAllPatient({ facility: facilityId, limit, offset, disease_status: diseaseStatus })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [diseaseStatus, dispatch, facilityId, offset]
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

  const handleFilter = async (diseaseStatus: string) => {
    setDiseaseStatus(diseaseStatus);
    setOffset(0);
    setCurrentPage(1);
  }

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      const patientUrl = patient.facility
        ? `/facility/${patient.facility}/patient/${patient.id}`
        : `/patient/${patient.id}`;
      return (
        <div key={`usr_${patient.id}`} className="w-full md:w-1/2 mt-6 md:px-4">
          <div
            onClick={() => navigate(patientUrl)}
            className={`overflow-hidden shadow block border rounded-lg bg-white h-full cursor-pointer hover:border-primary-500
            ${patient.disease_status === 'POSITIVE' ? "border-red-700 bg-red-100" :
                ['NEGATIVE', 'RECOVERY', 'RECOVERED'].indexOf(patient.disease_status) >= 0 ? "border-green-700 bg-green-100" : ""}
            `}
          >
            <div className="px-6 py-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between">
                  <div className="font-bold text-xl capitalize mb-2">
                    {patient.name}
                  </div>
                  <div>
                    {patient.is_medical_worker && patient.is_active && (
                      <span className="badge badge-pill badge-primary">
                        Medical Worker
                      </span>
                    )}
                    {!patient.is_active && (
                      <span className="badge badge-pill badge-dark">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">Age: </span>
                  {patient.age}
                </div>
                {patient.facility_object && (<div>
                  <span className="font-semibold leading-relaxed">Facility: </span>
                  {patient.facility_object.name}
                </div>)}
                {patient.contact_with_confirmed_carrier && (
                  <div className="flex">
                    <span className="font-semibold leading-relaxed">
                      Contact with confirmed carrier
                    </span>
                    <WarningRoundedIcon className="text-red-500"></WarningRoundedIcon>
                  </div>
                )}
                {patient.contact_with_suspected_carrier &&
                  !patient.contact_with_confirmed_carrier && (
                    <div className="flex">
                      <span className="font-semibold leading-relaxed">
                        Contact with suspected carrier
                      </span>
                      <WarningRoundedIcon className="text-yellow-500"></WarningRoundedIcon>
                    </div>
                  )}
                <div>
                  {patient.countries_travelled && !!patient.countries_travelled.length && (<>
                    <span className="font-semibold leading-relaxed">
                      Travel History:{" "}
                    </span>
                    {Array.isArray(patient.countries_travelled) ? patient.countries_travelled.join(", ") : patient.countries_travelled.split(',').join(', ')}
                  </>)}
                </div>
              </div>
              <div className="mt-2">
                <Button size="small" variant="outlined" fullWidth>
                  View Patient Details
                </Button>
              </div>
            </div>
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
      <PageTitle title="Covid Suspects" hideBack={!facilityId} />
      <PatientFilter filter={handleFilter} />
      <div className="px-3 md:px-8">
        <div className="flex flex-wrap md:-mx-4">{managePatients}</div>
      </div>
    </div>
  );
};
