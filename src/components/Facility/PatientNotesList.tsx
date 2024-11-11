import { useEffect, useState } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface PatientNotesProps {
  state: PatientNoteStateType;
  setState: any;
  patientId: string;
  facilityId: string;
  reload?: boolean;
  setReload?: any;
  thread: PatientNotesModel["thread"];
  setReplyTo?: (reply_to: PatientNotesModel | undefined) => void;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientNotesList = (props: PatientNotesProps) => {
  const { state, setState, reload, setReload, thread, setReplyTo } = props;

  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    setIsLoading(true);
    const { data }: any = await request(routes.getPatientNotes, {
      pathParams: { patientId: props.patientId },
      query: {
        offset: (state.cPage - 1) * RESULTS_PER_PAGE_LIMIT,
        thread,
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
    fetchNotes();
  }, [thread]);

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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <CircularProgress />
      </div>
    );
  }

  return (
    <DoctorNote
      state={state}
      handleNext={handleNext}
      setReload={setReload}
      setReplyTo={setReplyTo}
    />
  );
};

export default PatientNotesList;
