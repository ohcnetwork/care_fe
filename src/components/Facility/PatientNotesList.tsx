import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";

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

const PatientNotesList = (props: PatientNotesProps) => {
  const { state, setState, thread, setReplyTo, setReload, patientId } = props;
  const { data, isLoading, fetchNextPage, hasNextPage, refetch } =
    useInfiniteQuery({
      queryKey: [thread, patientId],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await request(routes.getPatientNotes, {
          pathParams: { patientId },
          query: { thread, offset: pageParam },
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
    setState((prevState: any) => ({
      ...prevState,
      notes: data?.pages.flatMap((page) => page.results) || [],
    }));
  }, [data]);

  useEffect(() => {
    refetch();
  }, [thread]);

  if (isLoading && !state.notes.length) {
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
      setReplyTo={setReplyTo}
      hasMore={hasNextPage}
    />
  );
};

export default PatientNotesList;
