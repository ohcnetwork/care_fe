import { useEffect, useState } from "react";
import CircularProgress from "../Common/components/CircularProgress";
import routes from "../../Redux/api";
import { PaitentNotesReplyModel, PatientNotesModel } from "./models";
import request from "../../Utils/request/request";
import Page from "../Common/components/Page";
import PatientNoteCard from "./PatientNoteCard";

interface Props {
  patientId: string;
  facilityId: string;
  consultationId: string;
  noteId: string;
  thread: PatientNotesModel["thread"];
}

interface PatientNoteWithReplies {
  note: string;
  replies: PaitentNotesReplyModel[];
}

const PatientNotesDetailedView = (props: Props) => {
  const { patientId, facilityId, consultationId, noteId, thread } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [reload, setReload] = useState(false);
  const [state, setState] = useState<PatientNoteWithReplies>({
    note: "",
    replies: [],
  });

  const fetchNotes = async () => {
    setIsLoading(true);

    const { data } = await request(routes.getPatientNote, {
      pathParams: {
        patientId: patientId,
        noteId,
      },
      query: {
        consultation: consultationId,
        thread,
      },
    });

    if (data) {
      setState((prevState) => ({
        ...prevState,
        note: data.note,
        replies: data.replies,
      }));
    }
    setIsLoading(false);
    setReload?.(false);
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
    setReload?.(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Page
      title="Discussion Notes"
      className="flex h-screen flex-col"
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/notes`}
    >
      <div className="mx-3 my-2 flex grow flex-col overflow-y-scroll rounded-lg border border-gray-300 bg-white p-2 sm:mx-10 sm:my-5 sm:p-5">
        {
          <div>
            <PatientNoteCard
              note={state as PatientNotesModel}
              setReload={setReload}
            />
            {
              <div className="mr-4 mt-1 flex items-center justify-end text-sm text-gray-500">
                {state.replies.length}{" "}
                {state.replies.length > 1 ? "replies" : "reply"}
              </div>
            }
            <h4>Replies</h4>
            {
              <div className="flex max-h-[300px] flex-col-reverse overflow-y-scroll">
                {state.replies.map((reply) => (
                  <PatientNoteCard
                    note={reply as PatientNotesModel}
                    setReload={setReload}
                  />
                ))}
              </div>
            }
          </div>
        }
      </div>
    </Page>
  );
};

export default PatientNotesDetailedView;
