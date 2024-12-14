import { useInfiniteQuery } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect } from "react";

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
}

const PatientConsultationNotesList = (props: PatientNotesProps) => {
  const { state, setState, setReload, disableEdit, thread, setReplyTo } = props;

  const consultationId = useSlug("consultation") ?? "";

  const { data, isLoading, fetchNextPage, hasNextPage, refetch } =
    useInfiniteQuery({
      queryKey: [thread, state.patientId],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await request(routes.getPatientNotes, {
          pathParams: { patientId: state.patientId! },
          query: { thread, offset: pageParam, consultation: consultationId },
        });

        return {
          results: response?.data?.results ?? [],
          nextPage: pageParam + RESULTS_PER_PAGE_LIMIT,
          totalResults: response?.data?.count ?? 0,
        };
      },
      getNextPageParam: (lastPage, allPages) => {
        const currentResults = allPages.flatMap((page) => page.results).length;
        if (currentResults < lastPage.totalResults) {
          return lastPage.nextPage;
        }
        return undefined;
      },
      initialPageParam: 0,
    });

  useEffect(() => {
    if (data?.pages) {
      const allNotes = data.pages.flatMap((page) => page.results);

      const notesMap = new Map(allNotes.map((note) => [note.id, note]));

      const deduplicatedNotes = Array.from(notesMap.values());

      setState((prevState: any) => ({
        ...prevState,
        notes: deduplicatedNotes,
      }));
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [thread]);

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
      handleNext={fetchNextPage}
      setReload={setReload}
      disableEdit={disableEdit}
      setReplyTo={setReplyTo}
      hasMore={hasNextPage}
    />
  );
};

export default PatientConsultationNotesList;
