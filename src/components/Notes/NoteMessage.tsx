import { formatRelative } from "date-fns";
import { Link, usePathParams } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import useAuthUser from "@/hooks/useAuthUser";

import { NoteRead } from "@/types/notes/messages";
import { formatDateTime, formatName } from "@/Utils/utils";

interface NoteMessageProps {
  message: NoteRead;
  onEdit?: () => void;
  children?: ReactNode;
}

/** The same author, Markdown bubble and persisted history in every discussion. */
export function NoteMessage({ message, onEdit, children }: NoteMessageProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const isCurrentUser = authUser.id === message.created_by?.id;
  const author = message.created_by;
  const history = message.message_history.history ?? [];

  return (
    <div
      className={cn(
        "flex w-full",
        isCurrentUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[90%] sm:max-w-[80%] items-start gap-3",
          isCurrentUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        {author && (
          <TooltipComponent content={author.username}>
            <Link
              href={
                facilityId
                  ? `/facility/${facilityId}/users/${author.username}`
                  : `/users/${author.username}`
              }
              className="block size-8 shrink-0"
            >
              <Avatar
                name={formatName(author, true)}
                imageUrl={author.profile_picture_url}
                className="flex size-full overflow-hidden rounded-full object-cover"
              />
            </Link>
          </TooltipComponent>
        )}
        <div
          className={cn(
            "min-w-0 space-y-2 p-3 rounded-lg break-words w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg border border-gray-200",
            isCurrentUser
              ? "bg-white text-black rounded-tr-none"
              : "bg-gray-100 rounded-tl-none",
          )}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="text-gray-700 font-medium">
              {author ? formatName(author) : t("notes__unknown_author")}
            </span>
            <time
              className="text-gray-500"
              dateTime={message.created_date}
              title={formatDateTime(message.created_date)}
            >
              {formatRelative(message.created_date, new Date())}
            </time>
            {!!history.length && (
              <span className="text-gray-500">{t("notes__edited")}</span>
            )}
            {onEdit && isCurrentUser && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1"
                onClick={onEdit}
              >
                {t("notes__edit_message")}
              </Button>
            )}
          </div>
          {children ?? (
            <Markdown content={message.message} className="text-sm" />
          )}
          {!!history.length && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">
                {t("notes__message_history", { count: history.length })}
              </summary>
              <ol className="mt-3 space-y-3 border-l border-gray-200 pl-3">
                {[...history].reverse().map((revision, index) => (
                  <li
                    key={`${revision.edited_at}-${index}`}
                    className="space-y-1"
                  >
                    <p>
                      {revision.created_by.username} ·{" "}
                      {formatDateTime(revision.edited_at)}
                    </p>
                    <Markdown content={revision.message} className="text-sm" />
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
