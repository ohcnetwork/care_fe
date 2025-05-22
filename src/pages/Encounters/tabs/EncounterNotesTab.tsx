import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import {
  Info,
  Loader2,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { Link, usePathParams } from "raviger";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { AutoExpandingTextarea } from "@/components/ui/auto-expanding-textarea";
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
import { Markdown } from "@/components/ui/markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useIsMobile } from "@/hooks/use-mobile";
import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatDateTime } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { inactiveEncounterStatus } from "@/types/emr/encounter";
import { Message } from "@/types/notes/messages";
import { Thread } from "@/types/notes/threads";

const MESSAGES_LIMIT = 20;

// Thread templates for quick selection

const threadTemplates = [
  "Treatment Plan",
  "Medication Notes",
  "Care Coordination",
  "General Notes",
  "Patient History",
  "Referral Notes",
  "Lab Results Discussion",
] as const;

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
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    className={cn(
      "group relative w-full p-4 text-left rounded-lg transition-colors border",
      isSelected
        ? "bg-primary-100 hover:bg-primary/15 border-primary"
        : "hover:bg-gray-100 hover:border-gray-200",
    )}
    onClick={onClick}
    data-cy="thread-title"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{thread.title}</h4>
      </div>
      {isSelected && (
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mt-1.5" />
      )}
    </div>
  </button>
);

// Message item component

function MessageItem({
  message,
  className,
  ...props
}: React.ComponentProps<"div"> & { message: Message }) {
  const authUser = useAuthUser();
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const isCurrentUser = authUser?.external_id === message.created_by.id;

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-in fade-in-0 slide-in-from-bottom-4",
        isCurrentUser ? "justify-end" : "justify-start",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex max-w-[80%] items-start gap-3",
          isCurrentUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        <TooltipComponent content={message.created_by?.username}>
          <Link
            href={
              facilityId
                ? `/facility/${facilityId}/users/${message.created_by?.username}`
                : `/users/${message.created_by?.username}`
            }
          >
            <span className="flex pr-2">
              <Avatar
                name={message.created_by?.username}
                imageUrl={message.created_by?.profile_picture_url}
                className="size-8 rounded-full object-cover ring-1 ring-transparent hover:ring-red-200 transition"
              />
            </span>
          </Link>
        </TooltipComponent>
        <div
          className={cn(
            "p-3 rounded-lg break-words whitespace-pre-wrap w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg",
            isCurrentUser
              ? "bg-white text-black rounded-tr-none border border-gray-200"
              : "bg-gray-100 rounded-tl-none border border-gray-200",
          )}
        >
          <p className="text-xs space-x-2 mb-1">
            <span className="text-gray-700 font-medium">
              {message.created_by.username}
            </span>
            <time
              className="text-gray-500"
              dateTime={message.created_date}
              title={formatDateTime(message.created_date)}
            >
              {formatRelative(message.created_date, new Date())}
            </time>
          </p>
          <div
            className={cn(
              "p-3 rounded-lg break-words",
              isCurrentUser
                ? "bg-white text-black rounded-tr-none border border-gray-200"
                : "bg-gray-100 rounded-tl-none border border-gray-200",
            )}
          >
            {message.message && (
              <Markdown content={message.message} className="text-sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
            {t("encounter_notes__start_new_discussion")}
            <InfoTooltip content={t("encounter_notes__create_discussion")} />
          </DialogTitle>
          <DialogDescription className="text-sm text-left">
            {threadsUnused.length === 0
              ? t("encounter_notes__no_unused_threads")
              : t("encounter_notes__choose_template")}
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
              placeholder={t("encounter_notes__enter_discussion_title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-cy="new-thread-title-input"
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
            data-cy="create-thread-button"
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin mr-2" />
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
}: {
  threadsCount: number;
  onOpenThreads: () => void;
  onNewThread: () => void;
}) => (
  <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-2 flex items-center justify-around z-50 divide-x">
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpenThreads}
      className="flex-1 flex flex-col items-center gap-1 h-auto py-2 rounded-none"
    >
      <MessageCircle className="size-5" />
      <span className="text-xs">Threads ({threadsCount})</span>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={onNewThread}
      className="flex-1 flex flex-col items-center gap-1 h-auto py-2 rounded-none"
    >
      <MessageSquarePlus className="size-5" />
      <span className="text-xs">New Thread</span>
    </Button>
  </div>
);

// Main component
export const EncounterNotesTab = ({
  encounter,
  patient,
}: EncounterTabProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [isThreadsExpanded, setIsThreadsExpanded] = useState(false);
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // points to the first message fetched in the last page or the newly created message
  const recentMessageRef = useRef<HTMLDivElement | null>(null);
  const { ref, inView } = useInView();
  const { hasPermission } = usePermissions();
  const { canViewClinicalData } = getPermissions(
    hasPermission,
    patient.permissions,
  );
  const { canViewEncounter, canWriteEncounter } = getPermissions(
    hasPermission,
    encounter.permissions,
  );
  const canAccess = canViewClinicalData || canViewEncounter;
  const inactiveEncounter = inactiveEncounterStatus.includes(encounter.status);
  const canWriteCurrentEncounter = canWriteEncounter && !inactiveEncounter;
  const [commentAdded, setCommentAdded] = useState(false);
  const isMobile = useIsMobile();

  // Fetch threads
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ["threads", encounter.id],
    queryFn: query(routes.notes.patient.listThreads, {
      pathParams: { patientId: encounter.patient.id },
      queryParams: { encounter: encounter.id },
    }),
    enabled: canAccess,
  });

  // Fetch messages with infinite scroll
  const {
    data: messagesData,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedResponse<Message>>({
    queryKey: ["messages", selectedThread],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await query(routes.notes.patient.getMessages, {
        pathParams: {
          patientId: encounter.patient.id,
          threadId: selectedThread!,
        },
        queryParams: {
          limit: String(MESSAGES_LIMIT),
          offset: String(pageParam),
        },
      })({ signal: new AbortController().signal });
      return response as PaginatedResponse<Message>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * MESSAGES_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!selectedThread && canAccess,
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: mutate(routes.notes.patient.createThread, {
      pathParams: { patientId: encounter.patient.id },
    }),
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      setShowNewThreadDialog(false);
      setSelectedThread((newThread as Thread).id);
      toast.success(t("encounter_notes__thread_created"));
    },
    onError: () => {
      toast.error(t("encounter_notes__failed_create_thread"));
    },
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: mutate(routes.notes.patient.postMessage, {
      pathParams: {
        patientId: encounter.patient.id,
        threadId: selectedThread!,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedThread] });
      setNewMessage("");
      setCommentAdded(true);
    },
  });

  const [threads, setThreads] = useState<string[]>([...threadTemplates]);

  // Auto-select first thread

  useEffect(() => {
    if (threadsData?.results.length) {
      if (!selectedThread) setSelectedThread(threadsData.results[0].id);
      const threadTitles = threadsData.results.map((thread) => thread.title);
      setThreads(
        threads.filter((template) => !threadTitles.includes(template)),
      );
    }
  }, [threadsData, selectedThread]);

  // hack to scroll to bottom on initial load

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messagesLoading]);

  // Handle infinite scroll

  useEffect(() => {
    if (inView && hasNextPage) {
      setCommentAdded(false);
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  useEffect(() => {
    recentMessageRef.current?.scrollIntoView({ block: "start" });
  }, [messagesData]);

  const handleCreateThread = (title: string) => {
    if (title.trim()) {
      if (
        threadsData?.results.some((thread) => thread.title === title.trim())
      ) {
        toast.error(t("thread_already_exists"));
        return;
      }
      createThreadMutation.mutate({
        title: title.trim(),
        encounter: encounter.id,
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedThread) {
      createMessageMutation.mutate({ message: newMessage.trim() });
    }
  };

  const recentMessage = useMemo(() => {
    if (commentAdded) return messagesData?.pages[0]?.results[0];
    return messagesData?.pages[messagesData.pages.length - 1]?.results[0];
  }, [messagesData]);

  if (threadsLoading) {
    return <Loading />;
  }

  const messages = messagesData?.pages.flatMap((page) => page.results) ?? [];
  const totalMessages = messagesData?.pages[0]?.count ?? 0;

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <h3 className="text-sm font-medium">
                {t("encounter_notes__discussions")}
              </h3>
            </div>
            {canWriteCurrentEncounter && (
              <Button
                data-cy="new-thread-button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewThreadDialog(true)}
                className="h-8"
              >
                <Plus className="size-4" />
                {t("encounter_notes__new")}
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
                  {t("encounter_notes__no_discussions")}
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
            {t("encounter_notes__all_discussions_description")}
          </SheetDescription>
          <SheetTitle className="sr-only">{t("encounter")}</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-primary" />
                  <h3 className="text-sm font-medium">
                    {t("encounter_notes__all_discussions")}
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
                >
                  <MessageSquarePlus className="size-4 mr-2" />
                  {t("encounter_notes__new")}
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 p-4">
                {threadsData?.results.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquarePlus className="size-8 text-primary mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      {t("encounter_notes__no_discussions")}
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

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-col h-full relative">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white z-10">
            {selectedThread ? (
              <div className="flex items-center gap-3">
                <h2 className="text-base font-medium truncate flex-1">
                  {
                    threadsData?.results.find((t) => t.id === selectedThread)
                      ?.title
                  }
                </h2>
                <TooltipComponent
                  content={`${t("participants")}: ${new Set(messages.map((m) => m.created_by.id)).size}
                  ${t("messages")}: ${totalMessages}`}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                    <Users className="size-4" />
                    <span>
                      {new Set(messages.map((m) => m.created_by.id)).size}
                    </span>
                    <MessageSquare className="size-4 ml-3" />
                    <span>{totalMessages}</span>
                  </div>
                </TooltipComponent>
              </div>
            ) : (
              <div className="text-center text-sm font-medium text-gray-500">
                {t("encounter_notes__select_create_thread")}
              </div>
            )}
          </div>
          {selectedThread ? (
            <>
              {messagesLoading ? (
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    <CardListSkeleton count={4} />
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages List */}
                  {isMobile ? (
                    <div className="flex-1 overflow-y-auto overscroll-y-contain -mx-2 px-2">
                      <div
                        className="flex flex-col-reverse py-2 min-h-full"
                        data-cy="chat-messages"
                      >
                        {messages.map((message, i) => (
                          <MessageItem
                            key={message.id}
                            message={message}
                            ref={
                              message.id === recentMessage?.id
                                ? recentMessageRef
                                : undefined
                            }
                            className={cn(i === 0 && "mb-14")}
                          />
                        ))}
                        {isFetchingNextPage && (
                          <div className="py-2">
                            <div className="space-y-4">
                              <CardListSkeleton count={3} />
                            </div>
                          </div>
                        )}
                        <div ref={ref} />
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 px-4 h-[calc(100vh-16rem)] overflow-y-auto">
                      <div
                        className="flex flex-col-reverse py-4 min-h-full"
                        data-cy="chat-messages"
                      >
                        {messages.map((message, i) => (
                          <MessageItem
                            key={message.id}
                            message={message}
                            ref={
                              message.id === recentMessage?.id
                                ? recentMessageRef
                                : undefined
                            }
                            className={cn(i === 0 && "mb-14")}
                          />
                        ))}
                        {isFetchingNextPage && (
                          <div className="py-2">
                            <div className="space-y-4">
                              <CardListSkeleton count={3} />
                            </div>
                          </div>
                        )}
                        <div ref={ref} />
                      </div>
                    </ScrollArea>
                  )}

                  {/* Message Input */}
                  {canWriteCurrentEncounter && (
                    <div className="border-t border-gray-200 p-3 sm:p-4 bg-white sticky max-sm:bottom-14">
                      <form onSubmit={handleSendMessage}>
                        <div className="flex gap-2">
                          <AutoExpandingTextarea
                            data-cy="encounter-notes-chat-message-input"
                            placeholder={t("encounter_notes__type_message")}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.shiftKey) {
                                e.preventDefault();
                                if (newMessage.trim()) {
                                  handleSendMessage(e);
                                }
                              }
                            }}
                            className="flex-1 min-h-20 max-h-[50vh]"
                          />
                          <Button
                            data-cy="send-chat-message-button"
                            type="submit"
                            size="icon"
                            disabled={
                              !newMessage.trim() ||
                              createMessageMutation.isPending
                            }
                            className="size-10 shrink-0"
                          >
                            {createMessageMutation.isPending ? (
                              <Loader2 className="size-5 animate-spin" />
                            ) : (
                              <Send className="size-5" />
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <MessageSquarePlus className="size-12 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("encounter_notes__welcome")}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                {t("encounter_notes__welcome_description")}
              </p>
              <Button
                onClick={() => setShowNewThreadDialog(true)}
                className="shadow-lg"
                disabled={!canWriteCurrentEncounter}
              >
                <MessageSquarePlus className="size-5 mr-2" />
                {t("encounter_notes__start_new_discussion")}
              </Button>
              {!canWriteEncounter && (
                <p className="text-sm text-gray-500 mt-4">
                  {inactiveEncounter ? (
                    <>
                      {t("encounter_notes__inactive_encounter", {
                        encounterStatus: t(
                          `encounter_status__${encounter.status}`,
                        ),
                      })}
                    </>
                  ) : (
                    t("permission_denied")
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        threadsCount={threadsData?.results.length || 0}
        onOpenThreads={() => setIsThreadsExpanded(true)}
        onNewThread={() => setShowNewThreadDialog(true)}
      />

      <NewThreadDialog
        isOpen={showNewThreadDialog}
        onClose={() => setShowNewThreadDialog(false)}
        onCreate={handleCreateThread}
        isCreating={createThreadMutation.isPending}
        threadsUnused={threads}
      />
    </div>
  );
};
