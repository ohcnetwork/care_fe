import { Dispatch, SetStateAction, useEffect, useState } from "react";

import CircularProgress from "@/components/Common/CircularProgress";
import DoctorNote from "@/components/Facility/DoctorNote";
import {
  PatientNoteStateType,
  PatientNotesModel,
} from "@/components/Facility/models";

import useSlug from "@/hooks/useSlug";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface PatientNotesProps {
  state: PatientNoteStateType;
  setState: Dispatch<SetStateAction<PatientNoteStateType>>;
  reload?: boolean;
  setReload?: (value: boolean) => void;
  disableEdit?: boolean;
  thread: PatientNotesModel["thread"];
  setReplyTo?: (value: PatientNotesModel | undefined) => void;
  mode?: "thread-view" | "default-view";
  setThreadViewNote?: (noteId: string) => void;
}

const pageSize = RESULTS_PER_PAGE_LIMIT;

const PatientConsultationNotesList = (props: PatientNotesProps) => {
  const {
    state,
    setState,
    reload,
    setReload,
    disableEdit,
    thread,
    setReplyTo,
    mode = "default-view",
    setThreadViewNote,
  } = props;
  const consultationId = useSlug("consultation") ?? "";

  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async (currentPage: number) => {
    setIsLoading(true);

    const { data } = await request(routes.getPatientNotes, {
      pathParams: {
        patientId: props.state.patientId || "",
      },
      query: {
        consultation: consultationId,
        thread,
        offset: (currentPage - 1) * RESULTS_PER_PAGE_LIMIT,
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
    setState((prev) => ({ ...prev, notes: [], cPage: 1 }));
    // Fetch notes for the first page when thread changes and prevent loading a different page when changing threads
    fetchNotes(1);
  }, [thread]);

  useEffect(() => {
    setThreadViewNote?.("");
  }, [thread, mode]);

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

  // only show during initial fetch, to prevent scroll position from being reset
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
      disableEdit={disableEdit}
      setReplyTo={setReplyTo}
      mode={mode}
      setThreadViewNote={setThreadViewNote}
    />
  );
};

export default PatientConsultationNotesList;
