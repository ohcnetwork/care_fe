import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import CircularProgress from "@/components/Common/CircularProgress";
import DiscussionNotesEditor from "@/components/Common/DiscussionNotesEditor";
import DoctorNoteReplyPreviewCard from "@/components/Facility/DoctorNoteReplyPreviewCard";
import PatientNoteCard from "@/components/Facility/PatientNoteCard";
import {
  PatientNotesModel,
  PatientNotesReplyModel,
} from "@/components/Facility/models";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";

interface Props {
  patientId: string;
  consultationId?: string;
  noteId: string;
  thread: PatientNotesModel["thread"];
  setThreadViewNote?: (note: string) => void;
}

const PatientNotesDetailedView = (props: Props) => {
  const { patientId, consultationId, noteId, thread, setThreadViewNote } =
    props;
  const [noteField, setNoteField] = useState("");
  const [reply_to, setReplyTo] = useState<PatientNotesReplyModel | undefined>(
    undefined,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: state,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      routes.getPatientNote.path,
      patientId,
      noteId,
      consultationId,
      thread,
    ],
    queryFn: query(routes.getPatientNote, {
      pathParams: {
        patientId,
        noteId,
      },
      queryParams: {
        consultation: consultationId,
        thread,
      },
    }),
  });

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (state) {
      setTimeout(scrollToBottom, 100);
    }
  }, [state]);

  const onAddNote = async () => {
    if (!/\S+/.test(noteField)) {
      Notification.Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }

    try {
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
        setTimeout(scrollToBottom, 100);
      } else {
        Notification.Error({ msg: "Failed to add note. Please try again." });
      }

      return data?.id;
    } catch (error) {
      Notification.Error({ msg: "An error occurred while adding the note." });
      return undefined;
    }
  };

  if (isLoading || isRefetching) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col overflow-hidden bg-white">
      {state && (
        <div className="flex h-full flex-col">
          <div className="flex-shrink-0 border-b border-secondary-300 px-3 pt-2 pb-2">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-lg">{t("note")}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setThreadViewNote?.("")}
                className="gap-2"
              >
                <CareIcon icon="l-times" className="text-lg" />
                {t("close")}
              </Button>
            </div>
            <PatientNoteCard
              note={state}
              refetch={refetch}
              setReplyTo={setReplyTo}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-secondary-300 flex items-center justify-between px-4 py-2">
              <h4 className="text-lg text-slate-600">{t("replies")}</h4>
              {state.child_notes.length > 0 && (
                <div className="text-sm text-secondary-500">
                  {state.child_notes.length}{" "}
                  {state.child_notes.length > 1 ? t("replies") : t("reply")}
                </div>
              )}
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 sm:max-h-[350px]"
            >
              {state.child_notes.length > 0 ? (
                <div className="flex flex-col">
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
                        <div className="mt-2">
                          <PatientNoteCard
                            note={note as PatientNotesModel}
                            refetch={refetch}
                            setReplyTo={setReplyTo}
                          />
                        </div>
                      </DoctorNoteReplyPreviewCard>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="flex flex-col items-center gap-2">
                    <CareIcon
                      icon="l-comment-alt"
                      className="text-4xl text-secondary-400"
                    />
                    <h4 className="text-lg text-secondary-500">
                      No replies yet
                    </h4>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 border-secondary-300 mt-2">
              <DoctorNoteReplyPreviewCard
                parentNote={reply_to}
                cancelReply={() => setReplyTo(undefined)}
              >
                <DiscussionNotesEditor
                  onAddNote={onAddNote}
                  onChange={setNoteField}
                  initialNote={noteField}
                  onRefetch={() => refetch()}
                  maxRows={10}
                />
              </DoctorNoteReplyPreviewCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientNotesDetailedView;
