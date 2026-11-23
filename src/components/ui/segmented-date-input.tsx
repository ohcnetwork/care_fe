import {
  addDays,
  addMonths,
  addYears,
  format,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import { X } from "lucide-react";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { useTranslation } from "react-i18next";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface SegmentedDateInputProps {
  id: string;
  edge: "from" | "to";
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  minDate?: Date;
  maxDate?: Date;
  active: boolean;
  invalid: boolean;
  describedBy?: string;
  label: string;
  onFocus: () => void;
  onChange: (value: string) => void;
  onCommit: (value: string) => boolean;
  onEnter: () => void;
}

const segments = [
  [0, 2],
  [3, 5],
  [6, 10],
] as const;
const segmentAt = (position: number) =>
  position < 3 ? 0 : position < 6 ? 1 : 2;

/** Keeps one text value while selecting DD, MM and YYYY for keyboard editing. */
export function SegmentedDateInput({
  id,
  edge,
  inputRef,
  value,
  minDate,
  maxDate,
  active,
  invalid,
  describedBy,
  label,
  onFocus,
  onChange,
  onCommit,
  onEnter,
}: SegmentedDateInputProps) {
  const { t } = useTranslation();
  const selection = useRef<number | null>(null);
  const digits = useRef("");
  const canonical = /^\d{2}\/\d{2}\/\d{4}$/.test(value);
  const today = startOfDay(new Date());
  const initialDate =
    minDate && today < minDate
      ? minDate
      : maxDate && today > maxDate
        ? maxDate
        : today;
  const selectSegment = (index: number) => {
    const [start, end] = segments[index];
    inputRef.current?.setSelectionRange(start, end);
  };
  useLayoutEffect(() => {
    if (selection.current === null) return;
    selectSegment(selection.current);
    selection.current = null;
  });
  const clear = () => {
    onCommit("");
    digits.current = "";
    inputRef.current?.focus();
  };

  return (
    <InputGroup className={cn(active && "border-ring ring-3 ring-ring/50")}>
      <InputGroupInput
        ref={inputRef}
        id={id}
        type="text"
        data-range-edge={edge}
        inputMode="numeric"
        placeholder={t("date_placeholder_dd_mm_yyyy")}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        aria-keyshortcuts="T Escape ArrowUp ArrowDown ArrowLeft ArrowRight"
        value={value}
        className="tabular-nums"
        onFocus={onFocus}
        onClick={(event) => {
          digits.current = "";
          if (canonical) {
            selectSegment(segmentAt(event.currentTarget.selectionStart ?? 0));
          }
        }}
        onChange={(event) => {
          digits.current = "";
          onChange(event.target.value);
        }}
        onBlur={(event) => {
          digits.current = "";
          onCommit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            clear();
            return;
          }
          if (event.key.toLowerCase() === "t") {
            event.preventDefault();
            const next = format(startOfDay(new Date()), "dd/MM/yyyy");
            digits.current = "";
            onChange(next);
            onCommit(next);
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            if (onCommit(event.currentTarget.value)) onEnter();
            return;
          }
          const index = segmentAt(event.currentTarget.selectionStart ?? 0);
          if (canonical && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            digits.current = "";
            selectSegment(
              Math.max(
                0,
                Math.min(2, index + (event.key === "ArrowLeft" ? -1 : 1)),
              ),
            );
          } else if (
            (canonical || !value.trim()) &&
            ["ArrowUp", "ArrowDown"].includes(event.key)
          ) {
            event.preventDefault();
            digits.current = "";
            const current = canonical
              ? parse(value, "dd/MM/yyyy", new Date())
              : initialDate;
            if (!isValid(current)) return;
            const next = [addDays, addMonths, addYears][index](
              current,
              event.key === "ArrowUp" ? 1 : -1,
            );
            selection.current = index;
            onChange(format(next, "dd/MM/yyyy"));
          } else if (
            canonical &&
            /^\d$/.test(event.key) &&
            event.currentTarget.selectionStart === segments[index][0] &&
            event.currentTarget.selectionEnd === segments[index][1]
          ) {
            event.preventDefault();
            digits.current += event.key;
            const [start, end] = segments[index];
            const complete = digits.current.length === end - start;
            const next =
              value.slice(0, start) +
              digits.current.padStart(end - start, "0") +
              value.slice(end);
            selection.current = complete ? Math.min(2, index + 1) : index;
            onChange(next);
            if (complete) digits.current = "";
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        {value && (
          <InputGroupButton
            size="icon-xs"
            aria-label={`${t("clear")} ${label}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
          >
            <X aria-hidden="true" />
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
