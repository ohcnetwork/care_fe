import { Plus, Trash2 } from "lucide-react";
import { useId, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useMobileAddUser } from "@/components/Users/UserFormSection";

// Matches the control height (3rem, or 2.5rem from `md`) for the delete column.
const rowActionSize =
  "[--row-action:--spacing(12)] md:[--row-action:--spacing(10)]";

interface UserFormListHeaderProps {
  columns: string;
  children: React.ReactNode;
}

/** Column titles shown above the rows. Hidden below `sm`, where fields carry labels. */
export function UserFormListHeader({
  columns,
  children,
}: UserFormListHeaderProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "hidden gap-3 text-sm leading-none font-medium sm:grid",
        rowActionSize,
        columns,
      )}
    >
      {children}
    </div>
  );
}

export function UserFormListHeaderCell({
  children,
  required,
}: {
  children?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span>
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </span>
  );
}

interface UserFormListRowProps extends React.ComponentProps<"div"> {
  columns: string;
  title: string;
  removeLabel: string;
  onRemove: () => void;
  removeDisabled?: boolean;
  onlyEntry?: boolean;
}

/**
 * A repeatable row of the user form (responsibility, language, qualification).
 * Below `sm` it is a bordered card whose fields keep their own labels; from
 * `sm` up the rows line up under a shared `UserFormListHeader`.
 *
 * `columns` must be a literal `sm:grid-cols-[...]` class so Tailwind can see it,
 * and its last column should be `var(--row-action)` for the delete button.
 */
export function UserFormListRow({
  columns,
  className,
  title,
  children,
  removeLabel,
  onRemove,
  removeDisabled,
  onlyEntry,
  ...props
}: UserFormListRowProps) {
  const mobile = useMobileAddUser();
  const removeButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={removeLabel}
      disabled={removeDisabled || onlyEntry}
      onClick={onRemove}
      className={cn(
        "text-muted-foreground hover:text-destructive",
        mobile
          ? "-mt-2 -mr-2 shrink-0"
          : "justify-self-end sm:justify-self-auto",
      )}
    >
      <Trash2 className="size-4" />
    </Button>
  );
  if (mobile) {
    return (
      <div
        role="group"
        aria-label={title}
        data-user-entry=""
        tabIndex={-1}
        className="min-w-0 rounded-lg border p-4"
      >
        <FieldGroup>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{title}</span>
            {!onlyEntry && removeButton}
          </div>
          {children}
        </FieldGroup>
      </div>
    );
  }
  return (
    <div
      role="group"
      aria-label={title}
      className={cn(
        "grid gap-3 rounded-lg border border-border p-3 sm:items-start sm:rounded-none sm:border-0 sm:p-0",
        rowActionSize,
        columns,
        className,
      )}
      {...props}
    >
      {children}
      {removeButton}
    </div>
  );
}

interface UserFormListProps {
  title: string;
  description?: string;
  notice?: React.ReactNode;
  headers: React.ReactNode;
  count: number;
  addLabel: string;
  addDisabled?: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  children: (remove: (index: number) => void) => React.ReactNode;
}

export function UserFormList({
  title,
  description,
  notice,
  headers,
  count,
  addLabel,
  addDisabled,
  onAdd,
  onRemove,
  children,
}: UserFormListProps) {
  const mobile = useMobileAddUser();
  const list = useRef<HTMLDivElement>(null);
  const add = useRef<HTMLButtonElement>(null);
  const focusIndex = useRef<number | null>(null);
  const descriptionId = useId();

  useLayoutEffect(() => {
    const index = focusIndex.current;
    focusIndex.current = null;
    if (!mobile || index === null) return;

    const card =
      list.current?.querySelectorAll<HTMLElement>("[data-user-entry]")[index];
    const target =
      card?.querySelector<HTMLElement>('[role="combobox"]:not(:disabled)') ??
      card ??
      add.current;
    target?.focus({ preventScroll: true });
    (card ?? target)?.scrollIntoView({ block: "nearest" });
  }, [count, mobile]);

  const rows = children((index) => {
    if (mobile) focusIndex.current = Math.min(index, count - 2);
    onRemove(index);
  });
  const addButton = (
    <Button
      ref={add}
      type="button"
      variant="outline"
      disabled={addDisabled}
      className={mobile ? "w-full" : "self-start"}
      onClick={() => {
        if (mobile) focusIndex.current = count;
        onAdd();
      }}
    >
      <Plus className="size-4" />
      {addLabel}
    </Button>
  );

  if (mobile) {
    return (
      <FieldSet
        className="min-w-0"
        aria-describedby={description ? descriptionId : undefined}
      >
        <FieldLegend variant="label">{title}</FieldLegend>
        {description && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )}
        <FieldGroup>
          {notice}
          <FieldGroup ref={list}>
            {rows}
            {addButton}
          </FieldGroup>
        </FieldGroup>
      </FieldSet>
    );
  }
  return (
    <section
      role={description ? undefined : "group"}
      aria-label={description ? undefined : title}
      className="flex flex-col gap-3"
    >
      {description && (
        <div className="flex flex-col gap-1">
          <h4 className="text-sm leading-snug font-medium">{title}</h4>
          <p className="text-sm text-soft-foreground">{description}</p>
        </div>
      )}
      {notice}
      {count > 0 && (
        <div className="flex flex-col gap-1.5">
          {headers}
          <div className="flex flex-col gap-3">{rows}</div>
        </div>
      )}
      {addButton}
    </section>
  );
}
