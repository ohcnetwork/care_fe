import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";

import useAuthUser from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { Message } from "@/types/notes/messages";
import { Thread } from "@/types/notes/threads";

const MessageSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-4 rounded-lg bg-muted">
        <div className="flex justify-between text-sm mb-2">
          <Skeleton className="h-4 w-[100px]" />
        </div>
        <Skeleton className="h-4 w-[80%] mb-2" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    ))}
  </div>
);

const ThreadItem = ({
  thread,
  isSelected,
  onClick,
}: {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <div
    className={`relative p-3 cursor-pointer rounded-lg transition-colors ${
      isSelected ? "bg-primary/10" : "hover:bg-muted"
    }`}
    onClick={onClick}
  >
    <div className="flex justify-between items-center">
      <h4 className="font-medium text-sm">{thread.title}</h4>
      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
    </div>
  </div>
);

const UserAvatar = ({ user }: { user: Message["created_by"] }) => {
  const initials = user.username.charAt(0).toUpperCase();

  return user.profile_picture_url ? (
    <img
      src={user.profile_picture_url}
      alt={user.username}
      className="w-8 h-8 rounded-full object-cover"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
      {initials}
    </div>
  );
};

const MessageItem = ({ message }: { message: Message }) => {
  const authUser = useAuthUser();
  const isCurrentUser = authUser?.external_id === message.created_by.id;

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-in fade-in-0 slide-in-from-bottom-4",
        isCurrentUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] items-start gap-3",
          isCurrentUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        <div className="flex-shrink-0 mt-1">
          <UserAvatar user={message.created_by} />
        </div>

        <div
          className={cn(
            "flex flex-col",
            isCurrentUser ? "items-end" : "items-start",
          )}
        >
          <span className="text-xs text-muted-foreground mb-1">
            {message.created_by.username}
          </span>
          <div
            className={cn(
              "p-3 rounded-lg break-words",
              isCurrentUser
                ? "bg-primary-100 text-primary-foreground ml-auto rounded-br-none"
                : "bg-muted mr-auto rounded-bl-none",
            )}
          >
            <p className="whitespace-pre-wrap">{message.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const EncounterNotesTab = ({ encounter }: EncounterTabProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const LIMIT = 20;
  const { ref, inView } = useInView();

  // Fetch threads
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ["threads", encounter.id],
    queryFn: query(routes.notes.patient.listThreads, {
      pathParams: { patientId: encounter.patient.id },
      queryParams: { encounter: encounter.id },
    }),
  });

  // Auto-select the first thread when data is loaded
  useEffect(() => {
    if (threadsData?.results.length && !selectedThread) {
      setSelectedThread(threadsData.results[0].id);
    }
  }, [threadsData, selectedThread]);

  // Fetch messages with offset pagination
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
          limit: String(LIMIT),
          offset: String(pageParam),
        },
      })({ signal: new AbortController().signal });
      return response as PaginatedResponse<Message>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!selectedThread,
  });

  // Add effect for infinite scroll
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: mutate(routes.notes.patient.createThread, {
      pathParams: { patientId: encounter.patient.id },
    }),
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      setNewThreadTitle("");
      setShowNewThreadForm(false);
      // Select the newly created thread
      setSelectedThread((newThread as { id: string }).id);
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
    },
  });

  const handleCreateThread = () => {
    createThreadMutation.mutate({
      title: newThreadTitle,
      encounter: encounter.id,
    });
  };

  if (threadsLoading) {
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
      {/* Threads List - Make it more compact */}
      <div className="col-span-3 border-r">
        <div className="space-y-4 p-4">
          <div
            role="button"
            tabIndex={0}
            className="flex items-center text-sm hover:text-primary transition-colors cursor-pointer"
            onClick={() => setShowNewThreadForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("Create New Thread")}
          </div>

          {showNewThreadForm && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <Input
                placeholder={t("Thread Title")}
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                className="mb-2"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewThreadForm(false);
                    setNewThreadTitle("");
                  }}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateThread}
                  disabled={!newThreadTitle}
                >
                  {t("Create")}
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-1 pr-4">
              {threadsData?.results.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isSelected={selectedThread === thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Messages Area - Make it more chat-like */}
      <div className="col-span-9 flex flex-col">
        {selectedThread ? (
          <>
            {messagesLoading ? (
              <div className="flex-1 p-4">
                <MessageSkeleton />
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Messages List */}
                <ScrollArea className="flex-1 px-4">
                  <div className="flex flex-col-reverse">
                    {isFetchingNextPage && (
                      <div className="py-2">
                        <MessageSkeleton />
                      </div>
                    )}
                    {messagesData?.pages.map((page) =>
                      page.results.map((message) => (
                        <MessageItem key={message.id} message={message} />
                      )),
                    )}
                    <div ref={ref} />
                  </div>
                </ScrollArea>

                {/* New Message Input */}
                <div className="border-t bg-background p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        createMessageMutation.mutate({ message: newMessage });
                      }
                    }}
                    className="flex gap-2"
                  >
                    <Textarea
                      placeholder={t("Type a message...")}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[2.5rem] max-h-[10rem]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            createMessageMutation.mutate({
                              message: newMessage,
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t("Select a thread to start messaging")}
          </div>
        )}
      </div>
    </div>
  );
};
