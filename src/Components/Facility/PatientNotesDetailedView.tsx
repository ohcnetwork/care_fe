import { useEffect, useState } from "react";
import CircularProgress from "../Common/components/CircularProgress";
import routes from "../../Redux/api";
import { PatientNotesModel } from "./models";
import request from "../../Utils/request/request";
import Page from "../Common/components/Page";
import PatientNoteCard from "./PatientNoteCard";
import RichTextEditor from "../Common/RichTextEditor/RichTextEditor";
import * as Notification from "../../../src/Utils/Notifications";

interface Props {
  patientId: string;
  facilityId: string;
  consultationId: string;
  noteId: string;
  thread: PatientNotesModel["thread"];
}

const PatientNotesDetailedView = (props: Props) => {
  const { patientId, facilityId, consultationId, noteId, thread } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [reload, setReload] = useState(false);
  const [state, setState] = useState<PatientNotesModel>();
  const [noteField, setNoteField] = useState("");

  const onAddNote = async () => {
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }

    const { res, data } = await request(routes.addPatientNote, {
      pathParams: {
        patientId: patientId,
      },
      body: {
        note: noteField,
        thread,
        consultation: consultationId,
        reply_to: noteId,
      },
    });

    if (res?.status === 201) {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
      setReload(true);
    }

    return data?.id;
  };
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
      setState(data);
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
      className="flex h-full flex-col overflow-hidden"
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/notes`}
    >
      <div className="flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white p-3">
        {state && (
          <div className="flex flex-col">
            <div className="flex-1">
              <PatientNoteCard note={state} setReload={setReload} />
              {
                <div className="mr-4 mt-1 flex items-center justify-end text-sm text-gray-500">
                  {state.replies.length}{" "}
                  {state.replies.length > 1 ? "replies" : "reply"}
                </div>
              }
              <h4 className="ml-2">Replies</h4>
              {
                <div className="flex flex-col-reverse overflow-x-hidden overflow-y-scroll">
                  {state.replies.map((reply) => (
                    <div className="ml-2 mt-3">
                      <PatientNoteCard
                        note={reply as PatientNotesModel}
                        setReload={setReload}
                        // allowReply={false}
                      />
                    </div>
                  ))}
                </div>
              }
            </div>
            <RichTextEditor
              onAddNote={onAddNote}
              onChange={setNoteField}
              initialMarkdown={noteField}
            />
          </div>
        )}
      </div>
    </Page>
  );
};

export default PatientNotesDetailedView;
