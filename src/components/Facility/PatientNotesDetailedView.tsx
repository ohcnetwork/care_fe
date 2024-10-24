import { useEffect, useState } from "react";
import CircularProgress from "../Common/components/CircularProgress";
import routes from "../../Redux/api";
import { PaitentNotesReplyModel, PatientNotesModel } from "./models";
import request from "../../Utils/request/request";
import PatientNoteCard from "./PatientNoteCard";
import RichTextEditor from "../Common/RichTextEditor";
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
        reply_to: reply_to?.id || noteId,
      },
    });

    setReplyTo(undefined);

    if (res?.status === 201) {
      Notification.Success({ msg: "Note added successfully" });
      setNoteField("");
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

  // Fetch notes when reload is triggered
  useEffect(() => {
    if (reload) {
      fetchNotes();
    }
  }, [reload]);

  // Fetch notes when thread or noteId changes
  useEffect(() => {
    fetchNotes();
  }, [thread, noteId]);

  // Set reload to true on component mount
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
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-gray-300 bg-white sm:w-[500px]">
      {state && (
        <div className="flex h-full flex-col">
          <div className="px-3 pt-2">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-lg">Note</h4>
              <button
                onClick={() => setThreadViewNote?.("")}
                className="btn btn-default"
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

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2">
              <h4 className="text-lg text-slate-600">Replies</h4>
              {state.replies.length > 0 && (
                <div className="text-sm text-gray-500">
                  {state.child_notes.length}{" "}
                  {state.child_notes.length > 1 ? "replies" : "reply"}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3">
              {state.child_notes.map((note) => {
                const parentNote = state.child_notes.find(
                  (n) => n.id === note.reply_to,
                );
                return (
                  <DoctorNoteReplyPreviewCard
                    key={note.id}
                    parentNote={
                      note.reply_to !== state.id ? parentNote : undefined
                    }
                  >
                    <div className="mt-3">
                      <PatientNoteCard
                        note={note as PatientNotesModel}
                        setReload={setReload}
                        setReplyTo={setReplyTo}
                      />
                    </div>
                  </DoctorNoteReplyPreviewCard>
                );
              })}
            </div>
          </div>

          <div className="px-3 pb-2">
            <DoctorNoteReplyPreviewCard
              parentNote={reply_to}
              cancelReply={() => setReplyTo(undefined)}
            >
              <RichTextEditor
                onAddNote={onAddNote}
                onChange={setNoteField}
                initialMarkdown={noteField}
                onRefetch={() => setReload(true)}
              />
            </DoctorNoteReplyPreviewCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientNotesDetailedView;
