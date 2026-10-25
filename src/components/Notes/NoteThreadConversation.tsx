import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, MessageSquare, Pencil, RefreshCw, Send } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { AutoExpandingTextarea } from "@/components/ui/auto-expanding-textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { NoteMessage } from "@/components/Notes/NoteMessage";
import { NoteThreadSource } from "@/components/Notes/noteSource";
import { PLUGIN_Component } from "@/PluginEngine";

import useAuthUser from "@/hooks/useAuthUser";

import { HTTPError } from "@/Utils/request/types";
import { isTouchDevice } from "@/Utils/utils";

const PAGE_SIZE = 20;

function isForbidden(error: unknown) {
  return error instanceof HTTPError && error.status === 403;
}

function isReadUnavailable(error: unknown) {
  return error instanceof HTTPError && [401, 403, 404].includes(error.status);
}

function deliveryMayHaveSucceeded(error: unknown) {
  return !(error instanceof HTTPError) || error.status >= 500;
}

class DeliveryUnknownError extends Error {
  readonly silent = true;
}

interface NoteThreadConversationProps {
  source: NoteThreadSource;
  canAccess: boolean;
  canWrite: boolean;
}

export function NoteThreadConversation({
  source,
  canAccess,
  canWrite,
}: NoteThreadConversationProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const queryClient = useQueryClient();
  const inputId = useId();
  const sendLock = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToLatest = useRef(true);
  const [draft, setDraft] = useState("");
  const [uncertainDelivery, setUncertainDelivery] = useState<{
    checked: boolean;
  } | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(
    null,
  );
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [writeDenied, setWriteDenied] = useState(false);

  const conversation = useInfiniteQuery({
    queryKey: source.queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      source.listMessages({ offset: pageParam, limit: PAGE_SIZE, signal }),
    getNextPageParam: (lastPage, pages, lastPageParam) =>
      pages.reduce((count, page) => count + page.results.length, 0) <
        lastPage.count && lastPage.results.length
        ? lastPageParam + PAGE_SIZE
        : undefined,
    refetchInterval: (query) =>
      isReadUnavailable(query.state.error) ? false : 30_000,
    retry: false,
    enabled: canAccess,
  });
  // New arrivals can shift offset pages; display each persisted message only once.
  const messages = [
    ...new Map(
      (conversation.data?.pages.flatMap((page) => page.results) ?? []).map(
        (message) => [message.id, message],
      ),
    ).values(),
  ].reverse();
  const readDenied = !canAccess || isReadUnavailable(conversation.error);
  const writable = canWrite && !writeDenied && !readDenied;

  useEffect(() => {
    if (scrollToLatest.current && conversation.data) {
      const element = scrollRef.current;
      if (element) element.scrollTop = element.scrollHeight;
      scrollToLatest.current = false;
    }
  }, [conversation.data]);

  const refresh = () => {
    void conversation.refetch();
    source.onRefresh();
  };

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      // A failed thread setup cannot mean that a message was delivered.
      await source.prepareSend?.();
      try {
        return await source.sendMessage(message);
      } catch (error) {
        if (deliveryMayHaveSucceeded(error)) {
          throw new DeliveryUnknownError("Delivery could not be confirmed", {
            cause: error,
          });
        }
        throw error;
      }
    },
    retry: false,
    onSuccess: () => {
      setDraft("");
      setUncertainDelivery(null);
      scrollToLatest.current = true;
      void queryClient.invalidateQueries({ queryKey: source.queryKey });
      source.onRefresh();
    },
    onError: (error) => {
      if (isForbidden(error)) setWriteDenied(true);
      if (error instanceof DeliveryUnknownError)
        setUncertainDelivery({ checked: false });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      try {
        return await source.updateMessage(id, text);
      } catch (error) {
        if (deliveryMayHaveSucceeded(error)) {
          const saved = await source.getMessage(id);
          if (saved.message === text) return saved;
        }
        throw error;
      }
    },
    retry: false,
    onSuccess: () => {
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: source.queryKey });
    },
    onError: (error) => {
      if (isForbidden(error)) setWriteDenied(true);
    },
  });

  const renameMutation = useMutation({
    mutationFn: source.renameThread,
    retry: false,
    onSuccess: () => {
      setRenameOpen(false);
      source.onRefresh();
    },
    onError: (error) => {
      if (isForbidden(error)) setWriteDenied(true);
    },
  });

  const handleSend = async (retryDelivery = false) => {
    if (
      !writable ||
      !draft.trim() ||
      sendLock.current ||
      (uncertainDelivery && !retryDelivery)
    )
      return;
    sendLock.current = true;
    if (retryDelivery) setUncertainDelivery(null);
    try {
      await sendMutation.mutateAsync(draft.trim());
    } catch {
      // Keep the draft beside the actionable error; never automatically repost it.
    } finally {
      sendLock.current = false;
    }
  };

  const checkDelivery = async () => {
    const result = await conversation.refetch();
    if (!result.isError) setUncertainDelivery({ checked: true });
  };

  const loadOlder = async () => {
    const element = scrollRef.current;
    const previousHeight = element?.scrollHeight ?? 0;
    const previousTop = element?.scrollTop ?? 0;
    await conversation.fetchNextPage();
    // Keep the current message in view when older messages are prepended.
    requestAnimationFrame(() => {
      if (element)
        element.scrollTop = previousTop + element.scrollHeight - previousHeight;
    });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white p-3 sm:p-4">
        <h2 className="min-w-0 flex-1 truncate text-base font-medium">
          {readDenied ? t("notes__discussion") : source.title}
        </h2>
        {!readDenied && (
          <span
            className="flex items-center gap-1 text-xs text-gray-500"
            aria-label={t("notes__message_count", {
              count: conversation.data?.pages[0]?.count ?? 0,
            })}
          >
            <MessageSquare className="size-4" />
            {conversation.data?.pages[0]?.count ?? 0}
          </span>
        )}
        {writable && source.canRename && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("notes__rename_discussion")}
            onClick={() => {
              setNewTitle(source.title);
              renameMutation.reset();
              setRenameOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("notes__refresh_discussion")}
          disabled={conversation.isFetching || !canAccess}
          onClick={refresh}
        >
          <RefreshCw
            className={
              conversation.isFetching ? "size-4 animate-spin" : "size-4"
            }
          />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-3 sm:p-4"
      >
        {conversation.isPending && canAccess && <CardListSkeleton count={3} />}
        {(conversation.isError || readDenied) && (
          <div role="alert" className="space-y-2 text-sm text-red-600">
            <p>{t(readDenied ? "notes__read_denied" : "notes__load_failed")}</p>
            {canAccess && (
              <Button
                variant="outline"
                size="sm"
                disabled={conversation.isFetching}
                onClick={refresh}
              >
                {t("retry")}
              </Button>
            )}
          </div>
        )}
        {!readDenied && (
          <>
            {conversation.hasNextPage && (
              <div className="mb-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={conversation.isFetching}
                  onClick={() => void loadOlder()}
                >
                  {conversation.isFetchingNextPage && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {t("notes__load_older")}
                </Button>
              </div>
            )}
            <ol aria-label={t("notes__messages")} className="space-y-4">
              {messages.map((message) => (
                <li key={message.id}>
                  <NoteMessage
                    message={message}
                    onEdit={
                      writable &&
                      message.created_by?.id === authUser.id &&
                      editing?.id !== message.id
                        ? () => {
                            editMutation.reset();
                            setEditing({
                              id: message.id,
                              text: message.message,
                            });
                          }
                        : undefined
                    }
                  >
                    {editing?.id === message.id ? (
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (
                            writable &&
                            editing.text.trim() &&
                            !editMutation.isPending
                          )
                            editMutation.mutate({
                              id: editing.id,
                              text: editing.text.trim(),
                            });
                        }}
                      >
                        <Label htmlFor={`${inputId}-edit`}>
                          {t("notes__edit_message")}
                        </Label>
                        <Textarea
                          id={`${inputId}-edit`}
                          value={editing.text}
                          onChange={(event) =>
                            setEditing({ ...editing, text: event.target.value })
                          }
                          disabled={editMutation.isPending || !writable}
                          autoFocus
                          required
                        />
                        {editMutation.isError && (
                          <p role="alert" className="text-sm text-red-600">
                            {t(
                              isForbidden(editMutation.error)
                                ? "notes__write_denied"
                                : "notes__edit_failed",
                            )}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              !writable ||
                              !editing.text.trim() ||
                              editMutation.isPending
                            }
                          >
                            {editMutation.isPending && (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            {t("save_changes")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={editMutation.isPending}
                            onClick={() => {
                              setEditing(null);
                              editMutation.reset();
                            }}
                          >
                            {t("cancel")}
                          </Button>
                        </div>
                      </form>
                    ) : undefined}
                  </NoteMessage>
                </li>
              ))}
            </ol>
            {!conversation.isPending &&
              !conversation.isError &&
              !messages.length && (
                <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-gray-500">
                  <MessageSquare className="size-8 text-primary" />
                  <p className="font-medium">
                    {t("notes__start_conversation")}
                  </p>
                  <p className="text-sm">{t("notes__be_first_to_send")}</p>
                </div>
              )}
          </>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
        {(!canWrite || writeDenied || readDenied) && (
          <p className="text-sm text-gray-500">{t("notes__write_denied")}</p>
        )}
        {(canWrite || draft) && (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <Label className="sr-only" htmlFor={inputId}>
              {t("notes__message")}
            </Label>
            <div className="flex items-end gap-2">
              <AutoExpandingTextarea
                id={inputId}
                placeholder={t("notes__type_message")}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={
                  !writable || sendMutation.isPending || !!uncertainDelivery
                }
                onKeyDown={(event) => {
                  if (
                    !isTouchDevice &&
                    event.key === "Enter" &&
                    event.shiftKey
                  ) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                className="min-h-10 max-h-[30vh]"
              />
              {writable && !sendMutation.isPending && !uncertainDelivery && (
                <PLUGIN_Component
                  __name="NoteMessageInput"
                  message={draft}
                  setMessage={setDraft}
                />
              )}
              <Button
                aria-label={t("notes__send_message")}
                type="submit"
                size="icon"
                className="size-10 shrink-0"
                disabled={
                  !writable ||
                  !draft.trim() ||
                  sendMutation.isPending ||
                  !!uncertainDelivery
                }
              >
                {sendMutation.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Send className="size-5" />
                )}
              </Button>
            </div>
            {uncertainDelivery ? (
              <div role="alert" className="space-y-3 text-sm">
                <p className="text-red-600">{t("notes__delivery_unknown")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      conversation.isFetching ||
                      sendMutation.isPending ||
                      !canAccess
                    }
                    onClick={() => void checkDelivery()}
                  >
                    {t("notes__check_delivery")}
                  </Button>
                  {uncertainDelivery.checked && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={sendMutation.isPending}
                        onClick={() => {
                          setDraft("");
                          setUncertainDelivery(null);
                          sendMutation.reset();
                        }}
                      >
                        {t("notes__already_delivered")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={!writable || sendMutation.isPending}
                        onClick={() => void handleSend(true)}
                      >
                        {t("notes__retry_send")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              sendMutation.isError && (
                <p role="alert" className="text-sm text-red-600">
                  {t(
                    isForbidden(sendMutation.error)
                      ? "notes__write_denied"
                      : "notes__send_failed",
                  )}
                </p>
              )
            )}
          </form>
        )}
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          if (!renameMutation.isPending) setRenameOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("notes__rename_discussion")}</DialogTitle>
            <DialogDescription>
              {t("notes__rename_description")}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (writable && newTitle.trim() && !renameMutation.isPending)
                renameMutation.mutate(newTitle.trim());
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`${inputId}-title`}>
                {t("notes__discussion_title")}
              </Label>
              <Input
                id={`${inputId}-title`}
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                maxLength={255}
                required
                disabled={!writable || renameMutation.isPending}
              />
            </div>
            {renameMutation.isError && (
              <p role="alert" className="text-sm text-red-600">
                {t(
                  isForbidden(renameMutation.error)
                    ? "notes__write_denied"
                    : "notes__rename_failed",
                )}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={renameMutation.isPending}
                onClick={() => setRenameOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  !writable || !newTitle.trim() || renameMutation.isPending
                }
              >
                {renameMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {t("save_changes")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
