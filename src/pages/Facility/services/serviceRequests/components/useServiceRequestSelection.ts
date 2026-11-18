import { useState } from "react";

import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";

export interface ServiceRequestSelection {
  /** True when selection is allowed and the page has an active request. */
  enabled: boolean;
  /** Only active requests can be ticked. */
  canSelect: (request: ServiceRequestReadSpec) => boolean;
  selected: ServiceRequestReadSpec[];
  isSelected: (request: ServiceRequestReadSpec) => boolean;
  setSelected: (request: ServiceRequestReadSpec, selected: boolean) => void;
  allSelected: boolean;
  setAllSelected: (selected: boolean) => void;
}

/**
 * Ticks for the active rows on one page. Rows start unticked, and the ticks
 * clear when `resetKey` (the page and filters) changes.
 */
export function useServiceRequestSelection(
  requests: ServiceRequestReadSpec[],
  { enabled, resetKey }: { enabled: boolean; resetKey: string },
): ServiceRequestSelection {
  const [ticked, setTicked] = useState({ key: resetKey, ids: [] as string[] });
  const ids = ticked.key === resetKey ? ticked.ids : [];
  const update = (next: string[]) => setTicked({ key: resetKey, ids: next });
  const active = requests.filter(({ status }) => status === Status.active);
  const isEnabled = enabled && active.length > 0;
  const selected = isEnabled ? active.filter(({ id }) => ids.includes(id)) : [];

  return {
    enabled: isEnabled,
    canSelect: ({ status }) => status === Status.active,
    selected,
    isSelected: ({ id }) => ids.includes(id),
    setSelected: ({ id }, isSelected) =>
      update(isSelected ? [...ids, id] : ids.filter((other) => other !== id)),
    allSelected: active.length > 0 && selected.length === active.length,
    setAllSelected: (isSelected) =>
      update(isSelected ? active.map(({ id }) => id) : []),
  };
}
