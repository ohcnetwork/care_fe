import { X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { Avatar } from "@/components/Common/Avatar";

export interface MemberCardProps extends React.ComponentProps<"div"> {
  /** Shown as the title, and used for the avatar's initials. */
  name: string;
  imageUrl?: string;
  /** A second line (`default`) or trailing note (`sm`, `xs`): a role, a status. */
  description?: React.ReactNode;
  /** Replaces the avatar, for a member known only by a scan or an id. */
  icon?: React.ReactNode;
  /** `xs` fits inside an input, as an applied value before the text. */
  size?: "default" | "sm" | "xs";
  /** Renders a remove button after the content. */
  onRemove?: () => void;
  removeLabel?: string;
}

/**
 * A compact card for one person: avatar (or icon), name, an optional
 * description and an optional remove button. Square-cornered, so it sits
 * with badges and buttons rather than reading as a pill.
 */
export function MemberCard({
  name,
  imageUrl,
  description,
  icon,
  size = "default",
  onRemove,
  removeLabel,
  className,
  children,
  ...props
}: MemberCardProps) {
  const { t } = useTranslation();
  const small = size !== "default";
  const xs = size === "xs";

  return (
    <div
      data-slot="member-card"
      data-size={size}
      className={cn(
        "flex max-w-full min-w-0 items-center rounded-md border bg-background text-foreground shadow-2xs",
        xs
          ? "h-7 gap-1.5 overflow-hidden ps-1 pe-0 text-sm shadow-none"
          : small
            ? "h-9 gap-2 ps-1.5 pe-1 text-sm"
            : "gap-3 p-2 pe-1.5 text-sm",
        !onRemove && !children && "pe-3",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden="true"
          data-slot="member-card-icon"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground [&>svg]:shrink-0",
            xs
              ? "size-5 [&>svg]:size-3"
              : small
                ? "size-6 [&>svg]:size-3.5"
                : "size-9 [&>svg]:size-4",
          )}
        >
          {icon}
        </span>
      ) : (
        <Avatar
          name={name}
          imageUrl={imageUrl}
          className={cn(
            "shrink-0 rounded-sm",
            xs ? "size-5" : small ? "size-6" : "size-9",
          )}
        />
      )}
      <div
        data-slot="member-card-content"
        className={cn(
          "flex min-w-0 flex-1",
          small ? "items-baseline gap-1.5" : "flex-col",
        )}
      >
        <span className="truncate leading-tight font-medium">{name}</span>
        {description && (
          <span className="truncate text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </div>
      {children}
      {onRemove && xs ? (
        // Inside an input it sits with badges: their close button, flush
        // with the edge.
        <button
          type="button"
          className="inline-flex aspect-square shrink-0 cursor-pointer items-center justify-center self-stretch rounded-r-sm opacity-60 outline-none hover:bg-current/20 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:ring-inset"
          aria-label={removeLabel ?? t("remove")}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </button>
      ) : (
        onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={cn("shrink-0 text-muted-foreground", small && "size-7")}
            aria-label={removeLabel ?? t("remove")}
            onClick={onRemove}
          >
            <X />
          </Button>
        )
      )}
    </div>
  );
}
