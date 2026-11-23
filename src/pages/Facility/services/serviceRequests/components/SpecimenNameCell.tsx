import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import { CAP_COLORS } from "./specimenCollection";

interface SpecimenNameCellProps {
  requirement: SpecimenDefinitionRead;
  title: string;
  /** Sits right after the name, such as a status badge. */
  badge?: ReactNode;
  subtitle: string;
  /** Sits right after the subtitle, such as a requirements button. */
  info?: ReactNode;
  /** An optional third line, such as what was set in a test's details. */
  note?: string;
  muted?: boolean;
}

/** The tube's cap colour, then the name and the tube on one line each. */
export function SpecimenNameCell({
  requirement,
  title,
  badge,
  subtitle,
  info,
  note,
  muted = false,
}: SpecimenNameCellProps) {
  const cap = requirement.type_tested?.container?.cap?.code;

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span
        className={cn(
          "mt-1 size-3 shrink-0 rounded-full border border-foreground/25",
          (cap && CAP_COLORS[cap]) || "bg-transparent",
          muted && "opacity-60",
        )}
      />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={cn(
              // Phones wrap the name; the row beside it is too narrow to cut it.
              "min-w-0 text-sm font-semibold break-words md:truncate",
              muted ? "text-placeholder-foreground" : "text-foreground",
            )}
            title={title}
          >
            {title}
          </p>
          {badge}
        </div>
        <div className="flex min-w-0 items-center gap-1">
          <p
            className="min-w-0 truncate text-sm text-soft-foreground"
            title={subtitle}
          >
            {subtitle}
          </p>
          {info}
        </div>
        {note && <p className="text-sm text-soft-foreground">{note}</p>}
      </div>
    </div>
  );
}
