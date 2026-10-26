import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, MessageCircle, MessageSquarePlus, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { TooltipComponent } from "@/components/ui/tooltip";

import Loading from "@/components/Common/Loading";
import { NoteThreadSource } from "@/components/Notes/noteSource";
import { NoteThreadConversation } from "@/components/Notes/NoteThreadConversation";

import { ThreadRead, threadTemplates } from "@/types/notes/thread";
import threadApi from "@/types/notes/threadApi";
import mutate from "@/Utils/request/mutate";
import query, { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

// Info tooltip component for help text
const InfoTooltip = ({ content }: { content: string }) => (
  <TooltipComponent content={content}>
    <Info className="size-4 text-gray-500 hover:text-primary cursor-help" />
  </TooltipComponent>
);

// Thread item component
const ThreadItem = ({
  thread,
  isSelected,
  onClick,
}: {
  thread: ThreadRead;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <Button
    variant="outline"
    type="button"
    className={cn(
      "h-auto block whitespace-normal",
      cn(
        "group relative w-full p-4 text-left rounded-lg transition-colors border",
        isSelected
          ? "bg-primary-100 hover:bg-primary/15 border-primary"
          : "hover:bg-gray-100 hover:border-gray-200",
      ),
    )}
    onClick={onClick}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{thread.title}</h4>
      </div>
      {isSelected && (
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mt-1.5" />
      )}
    </div>
  </Button>
);

// New thread dialog component
const NewThreadDialog = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  threadsUnused,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  isCreating: boolean;
  threadsUnused: string[];
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setTitle("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("notes__start_new_discussion")}
            <InfoTooltip content={t("notes__create_discussion")} />
          </DialogTitle>
          <DialogDescription className="text-sm text-left">
            {threadsUnused.length === 0
              ? t("notes__no_unused_threads")
              : t("notes__choose_template")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {threadsUnused.map((template) => (
              <Badge
                key={template}
                variant="primary"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setTitle(template)}
              >
                {template}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Input
              placeholder={t("notes__enter_discussion_title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild disabled={isCreating}>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>

          <Button
            onClick={() => onCreate(title)}
            disabled={!title.trim() || isCreating}
          >
            {isCreating ? (
              <Spinner className="size-4 animate-spin mr-2" />
            ) : (
              <MessageSquarePlus className="size-4 mr-2" />
            )}
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Mobile navigation component
const MobileNav = ({
  threadsCount,
  onOpenThreads,
  onNewThread,
  canWrite,
}: {
  threadsCount: number;
  onOpenThreads: () => void;
  onNewThread: () => void;
  canWrite: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-2 flex items-center justify-around z-50 divide-x">
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenThreads}
        className="flex-1 flex flex-col items-center gap-1 h-auto py-2 rounded-none"
      >
        <MessageCircle className="size-5" />
        <span className="text-xs">
          {t("threads")}({threadsCount})
        </span>
      </Button>
      {canWrite && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewThread}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 rounded-none"
        >
          <MessageSquarePlus className="size-5" />
          <span className="text-xs">{t("new_thread")}</span>
        </Button>
      )}
    </div>
  );
};

interface NoteManagerProps {
  canAccess: boolean;
  canWrite: boolean;
  encounterId?: string;
  patientId: string;
  hideEncounterNotes?: boolean;
  /** A fixed discussion can use its own permission-scoped transport. */
  source?: NoteThreadSource;
}

export function NoteManager(props: NoteManagerProps) {
  const { t } = useTranslation();
  if (props.source) {
    return (
      <section
        aria-label={t("notes__discussion")}
        className="flex h-[26rem] max-h-[65vh] min-h-72 min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
      >
        <NoteThreadConversation
          key={props.source.key}
          source={props.source}
          canAccess={props.canAccess}
          canWrite={props.canWrite}
        />
      </section>
    );
  }
  return (
    <PatientNoteManager
      key={`${props.patientId}:${props.encounterId ?? ""}:${props.hideEncounterNotes ?? false}`}
      {...props}
    />
  );
}

function PatientNoteManager({
  canAccess,
  canWrite,
  encounterId,
  patientId,
  hideEncounterNotes = false,
}: NoteManagerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedThreadId, setSelectedThread] = useState<string | null>(null);
  const [isThreadsExpanded, setIsThreadsExpanded] = useState(false);
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const threadsKey = ["threads", patientId, encounterId, hideEncounterNotes];
  const threadQuery = useQuery({
    queryKey: threadsKey,
    queryFn: query.paginated(threadApi.list, {
      pathParams: { patientId },
      queryParams: hideEncounterNotes
        ? { encounter_isnull: "true" }
        : { encounter: encounterId },
    }),
    enabled: canAccess,
    retry: false,
  });
  const { data: threadsData, isLoading: threadsLoading } = threadQuery;
  const activeThread =
    threadsData?.results.find((thread) => thread.id === selectedThreadId) ??
    threadsData?.results[0];
  const selectedThread = activeThread?.id;
  const threads = threadTemplates.filter(
    (template) =>
      !threadsData?.results.some((thread) => thread.title === template),
  );

  const createThreadMutation = useMutation({
    mutationFn: mutate(threadApi.create, { pathParams: { patientId } }),
    retry: false,
    onSuccess: (newThread: ThreadRead) => {
      queryClient.setQueryData(
        threadsKey,
        (current: { count: number; results: ThreadRead[] } | undefined) => ({
          count: (current?.count ?? 0) + 1,
          results: [newThread, ...(current?.results ?? [])],
        }),
      );
      void queryClient.invalidateQueries({ queryKey: threadsKey });
      setShowNewThreadDialog(false);
      setSelectedThread(newThread.id);
      toast.success(t("notes__thread_created"));
    },
    onError: () => toast.error(t("notes__failed_create_thread")),
  });

  const handleCreateThread = (title: string) => {
    if (!canWrite || !title.trim() || createThreadMutation.isPending) return;
    if (threadsData?.results.some((thread) => thread.title === title.trim())) {
      toast.error(t("thread_already_exists"));
      return;
    }
    createThreadMutation.mutate({
      title: title.trim(),
      encounter: encounterId,
    });
  };

  if (
    !canAccess ||
    (threadQuery.error instanceof HTTPError && threadQuery.error.status === 403)
  ) {
    return (
      <p role="alert" className="p-4 text-sm text-gray-500">
        {t("notes__read_denied")}
      </p>
    );
  }
  if (threadsLoading) return <Loading />;
  if (threadQuery.isError)
    return (
      <div role="alert" className="space-y-3 p-4">
        <p>{t("notes__load_failed")}</p>
        <Button variant="outline" onClick={() => void threadQuery.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );

  const pathParams = { patientId, threadId: selectedThread ?? "" };
  const queryParams = { encounter: encounterId };
  const source: NoteThreadSource | undefined = activeThread && {
    key: `${patientId}:${activeThread.id}`,
    queryKey: ["messages", patientId, activeThread.id],
    title: activeThread.title,
    canRename: true,
    listMessages: ({ offset, limit, signal }) =>
      callApi(threadApi.listNotes, {
        pathParams,
        queryParams: { ...queryParams, limit, offset },
        signal,
        silent: true,
      }),
    sendMessage: (message) =>
      callApi(threadApi.createNote, {
        pathParams,
        body: { message },
        silent: true,
      }),
    getMessage: (messageId) =>
      callApi(threadApi.getNote, {
        pathParams: { ...pathParams, messageId },
        queryParams,
        silent: true,
      }),
    updateMessage: (messageId, message) =>
      callApi(threadApi.updateNote, {
        pathParams: { ...pathParams, messageId },
        queryParams,
        body: { message },
        silent: true,
      }),
    renameThread: (title) =>
      callApi(threadApi.update, {
        pathParams,
        queryParams,
        body: { title },
        silent: true,
      }),
    onRefresh: () => {
      void queryClient.invalidateQueries({ queryKey: threadsKey });
    },
  };

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-80 overflow-hidden max-lg:pb-14">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <h3 className="text-sm font-medium">{t("notes__discussions")}</h3>
            </div>
            {canWrite && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewThreadDialog(true)}
                className="h-8"
              >
                <Plus className="size-4" />
                {t("notes__new")}
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {threadsData?.results.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquarePlus className="size-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {t("notes__no_discussions")}
                </p>
              </div>
            ) : (
              threadsData?.results.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isSelected={selectedThread === thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isThreadsExpanded} onOpenChange={setIsThreadsExpanded}>
        <SheetContent side="left" className="w-[100%] sm:w-[380px] p-0">
          <SheetDescription className="sr-only">
            {t("notes__all_discussions_description")}
          </SheetDescription>
          <SheetTitle className="sr-only">{t("encounter")}</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-primary" />
                  <h3 className="text-sm font-medium">
                    {t("notes__all_discussions")}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewThreadDialog(true);
                    setIsThreadsExpanded(false);
                  }}
                  className="h-8 hidden lg:block"
                  disabled={!canWrite}
                >
                  <MessageSquarePlus className="size-4 mr-2" />
                  {t("notes__new")}
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 p-4">
                {threadsData?.results.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquarePlus className="size-8 text-primary mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      {t("notes__no_discussions")}
                    </p>
                  </div>
                ) : (
                  threadsData?.results.map((thread) => (
                    <ThreadItem
                      key={thread.id}
                      thread={thread}
                      isSelected={selectedThread === thread.id}
                      onClick={() => {
                        setSelectedThread(thread.id);
                        setIsThreadsExpanded(false);
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {source ? (
          <NoteThreadConversation
            key={source.key}
            source={source}
            canAccess={canAccess}
            canWrite={canWrite}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquarePlus className="size-12 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("notes__welcome")}</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              {t("notes__welcome_description")}
            </p>
            <Button
              onClick={() => setShowNewThreadDialog(true)}
              disabled={!canWrite}
            >
              <MessageSquarePlus className="size-5 mr-2" />
              {t("notes__start_new_discussion")}
            </Button>
          </div>
        )}
      </div>
      <MobileNav
        threadsCount={threadsData?.results.length ?? 0}
        onOpenThreads={() => setIsThreadsExpanded(true)}
        onNewThread={() => setShowNewThreadDialog(true)}
        canWrite={canWrite}
      />
      {showNewThreadDialog && (
        <NewThreadDialog
          isOpen={showNewThreadDialog}
          onClose={() => setShowNewThreadDialog(false)}
          onCreate={handleCreateThread}
          isCreating={createThreadMutation.isPending}
          threadsUnused={threads}
        />
      )}
    </div>
  );
}
