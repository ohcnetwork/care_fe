import { Dispatch, SetStateAction, useEffect, useState } from "react";

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
  setState: Dispatch<SetStateAction<PatientNoteStateType>>;
  patientId: string;
  facilityId: string;
  reload?: boolean;
  setReload?: (value: boolean) => void;
  thread: PatientNotesModel["thread"];
  setReplyTo?: (reply_to: PatientNotesModel | undefined) => void;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientNotesList = (props: PatientNotesProps) => {
  const { state, setState, reload, setReload, thread, setReplyTo } = props;

  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async (currentPage: number) => {
    setIsLoading(true);
    const { data } = await request(routes.getPatientNotes, {
      pathParams: { patientId: props.patientId },
      query: {
        offset: (state.cPage - 1) * RESULTS_PER_PAGE_LIMIT,
        thread,
      },
    });

    if (data) {
      setState((prevState) => ({
        ...prevState,
        notes:
          currentPage === 1
            ? data.results
            : [...prevState.notes, ...data.results],
        totalPages: Math.ceil(data.count / pageSize),
      }));
    }

    setIsLoading(false);
    setReload?.(false);
  };

  useEffect(() => {
    if (reload) {
      fetchNotes(state.cPage);
    }
  }, [reload]);

  useEffect(() => {
    fetchNotes(state.cPage);
  }, [thread]);

  useEffect(() => {
    setReload?.(true);
  }, []);

  const handleNext = () => {
    if (state.cPage < state.totalPages) {
      setState((prevState) => ({
        ...prevState,
        cPage: prevState.cPage + 1,
      }));
      setReload?.(true);
    }
  };

  if (isLoading && state.cPage === 1) {
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
