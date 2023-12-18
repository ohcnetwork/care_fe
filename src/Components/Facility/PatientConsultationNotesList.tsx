import { useEffect, useState } from "react";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import CircularProgress from "../Common/components/CircularProgress";
import routes from "../../Redux/api";
import { StateType } from "./models";
import useSlug from "../../Common/hooks/useSlug";
import DoctorNote from "./DoctorNote";
import request from "../../Utils/request/request";

interface PatientNotesProps {
  state: StateType;
  setState: any;
  patientId: string;
  facilityId: string;
  reload?: boolean;
  setReload?: any;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientConsultationNotesList = (props: PatientNotesProps) => {
  const { state, setState, reload, setReload } = props;
  const consultationId = useSlug("consultation") ?? "";

  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    setIsLoading(true);
    const { data }: any = await request(routes.getPatientNotes, {
      pathParams: {
        patientId: props.patientId,
      },
      query: {
        consultation: consultationId,
        offset: (state.cPage - 1) * RESULTS_PER_PAGE_LIMIT,
      },
    });

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
    setIsLoading(false);
    setReload(false);
  };

  useEffect(() => {
    if (reload) {
      fetchNotes();
    }
  }, [reload]);

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
