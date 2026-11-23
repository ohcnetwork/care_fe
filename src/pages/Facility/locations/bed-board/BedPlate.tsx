import { Bed } from "lucide-react";

import { cn } from "@/lib/utils";

import { BedState } from "./bedState";

const PLATE_STYLES = {
  patient: "bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-300",
  reserved:
    "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300",
  free: "bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300",
  unavailable: "bg-foreground/10 text-muted-foreground",
} as const satisfies Record<BedState, string>;

interface BedPlateProps {
  name: string;
  state: BedState;
}

/**
 * The bed's name, coloured by its state. It is the first thing on every tile,
 * so a ward can be scanned by bed.
 */
export function BedPlate({ name, state }: BedPlateProps) {
  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 font-semibold",
        PLATE_STYLES[state],
      )}
    >
      <Bed className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{name}</span>
    </p>
  );
}
