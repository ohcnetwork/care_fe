import { useState, useEffect } from "react";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import CircularProgress from "../Common/components/CircularProgress";
import DoctorNote from "./DoctorNote";
import { StateType } from "./models";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

interface PatientNotesProps {
  state: StateType;
  setState: any;
  patientId: string;
  facilityId: string;
  reload?: boolean;
  setReload?: any;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientNotesList = (props: PatientNotesProps) => {
  const { state, setState, reload, setReload } = props;

  const [isLoading, setIsLoading] = useState(true);

  useQuery(routes.getPatientNotes, {
    pathParams: {
      patientId: props.patientId,
    },
    query: {
      offset: (state.cPage - 1) * RESULTS_PER_PAGE_LIMIT,
    },
    prefetch: reload,
    onResponse: ({ res, data }) => {
      setIsLoading(true);
      console.log(data);
      console.log(state);
      if (res?.status === 200 && data) {
        if (state.cPage === 1) {
          setState((prevState: any) => ({
            ...prevState,
            notes: data.results,
            totalPages: Math.ceil(data.count / pageSize),
          }));
        } else {
          setState((prevState: any) => ({
            ...prevState,
            notes: [...prevState.notes, ...data.results],
            totalPages: Math.ceil(data.count / pageSize),
          }));
        }
      }
      setReload(false);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    setReload(true);
  }, []);

  const handleNext = () => {
    if (state.cPage < state.totalPages) {
      setState((prevState: any) => ({
        ...prevState,
        cPage: prevState.cPage + 1,
      }));
      setReload(true);
    }
  };

  if (isLoading && !state.notes.length) {
    return (
      <div className=" flex h-[400px] w-full items-center justify-center bg-white">
        <CircularProgress />
      </div>
    );
  }

  return <DoctorNote state={state} handleNext={handleNext} />;
};

export default PatientNotesList;
