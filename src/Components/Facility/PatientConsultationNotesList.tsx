import { useEffect, useState } from "react";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import CircularProgress from "../Common/components/CircularProgress";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { StateType } from "./models";
import useSlug from "../../Common/hooks/useSlug";
import DoctorNote from "./DoctorNote";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  reload?: boolean;
  setReload?: any;
}

// TODO:
// 1. Adding new note isn't refetching the notes (fix needed in PatientNotesList.tsx as)

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientConsultationNotesList = (props: PatientNotesProps) => {
  const { reload, setReload } = props;
  const consultationId = useSlug("consultation") ?? "";

  const initialData: StateType = { notes: [], cPage: 0, totalPages: 1 };
  const [state, setState] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useQuery(routes.getPatientNotes, {
    pathParams: {
      patientId: props.patientId,
    },
    query: {
      consultation: consultationId,
      offset: state.cPage * RESULTS_PER_PAGE_LIMIT,
    },
    prefetch: reload && state.cPage < state.totalPages,
    onResponse: ({ res, data }) => {
      setIsLoading(true);
      console.log(state);
      if (res?.status === 200 && data) {
        setState((prevState: any) => ({
          cPage: prevState.cPage + 1,
          notes: [...prevState.notes, ...data.results],
          totalPages: Math.ceil(data.count / pageSize),
        }));
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

export default PatientConsultationNotesList;
