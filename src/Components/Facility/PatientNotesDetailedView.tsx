import { useEffect, useState } from "react";
import CircularProgress from "../Common/components/CircularProgress";
import routes from "../../Redux/api";
import { PaitentNotesReplyModel, PatientNotesModel } from "./models";
import request from "../../Utils/request/request";
import PatientNoteCard from "./PatientNoteCard";
import RichTextEditor from "../Common/RichTextEditor/RichTextEditor";
import * as Notification from "../../../src/Utils/Notifications";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DoctorNoteReplyPreviewCard from "./DoctorNoteReplyPreviewCard";

interface Props {
  patientId: string;
  consultationId: string;
  noteId: string;
  thread: PatientNotesModel["thread"];
  setThreadViewNote?: (note: string) => void;
}

const PatientNotesDetailedView = (props: Props) => {
  const { patientId, consultationId, noteId, thread, setThreadViewNote } =
    props;
  const [isLoading, setIsLoading] = useState(true);
  const [reload, setReload] = useState(false);
  const [state, setState] = useState<PatientNotesModel>();
  const [noteField, setNoteField] = useState("");
  const [reply_to, setReplyTo] = useState<PaitentNotesReplyModel | undefined>(
    undefined,
  );

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
  }, [thread, noteId]);

  useEffect(() => {
    setReload?.(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-white">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="flex w-[500px] flex-col overflow-hidden rounded-lg border border-gray-300 bg-white px-3 pt-2">
      {state && (
        <div className="flex flex-col">
          <div className="flex-1">
            <div className="mx-1">
              <div className="flex items-center justify-between">
                <h4 className="ml-4 text-lg">Note</h4>
                <button
                  onClick={() => setThreadViewNote?.("")}
                  className="btn btn-default mb-2"
                >
                  <CareIcon icon="l-times" className="mr-1 text-lg" />
                  Close
                </button>
              </div>
              <PatientNoteCard
                note={state}
                setReload={setReload}
                allowReply={false}
              />
            </div>
            <div className="flex items-center justify-between p-2">
              <h4 className="ml-2 text-lg text-slate-600">Replies</h4>
              {state.replies.length > 0 && (
                <div className="mr-4 mt-1 flex items-center justify-end text-sm text-gray-500">
                  {state.replies.length}{" "}
                  {state.replies.length > 1 ? "replies" : "reply"}
                </div>
              )}
            </div>
            {
              <div className="flex max-h-[250px] flex-col-reverse overflow-x-hidden overflow-y-scroll pl-2">
                {state.replies.map((reply) => (
                  <DoctorNoteReplyPreviewCard
                    key={reply.id}
                    parentNote={
                      reply.reply_to_object?.id !== state.id
                        ? reply.reply_to_object
                        : undefined
                    }
                  >
                    <div className="mt-3">
                      <PatientNoteCard
                        note={reply as PatientNotesModel}
                        setReload={setReload}
                        allowReply={false}
                        setReplyTo={setReplyTo}
                      />
                    </div>
                  </DoctorNoteReplyPreviewCard>
                ))}
              </div>
            }
          </div>
          <DoctorNoteReplyPreviewCard
            parentNote={reply_to}
            cancelReply={() => setReplyTo(undefined)}
          >
            <RichTextEditor
              onAddNote={onAddNote}
              onChange={setNoteField}
              initialMarkdown={noteField}
            />
          </DoctorNoteReplyPreviewCard>
        </div>
      )}
    </div>
  );
};

export default PatientNotesDetailedView;
