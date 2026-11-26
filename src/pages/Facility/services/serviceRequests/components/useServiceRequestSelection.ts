import { useState } from "react";

import {
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";

export interface ServiceRequestSelection {
  /** True when selection is allowed and the page has an active request. */
  enabled: boolean;
  canSelect: (request: ServiceRequestReadSpec) => boolean;
  selected: ServiceRequestReadSpec[];
  isSelected: (request: ServiceRequestReadSpec) => boolean;
  setSelected: (request: ServiceRequestReadSpec, selected: boolean) => void;
  allSelected: boolean;
  setAllSelected: (selected: boolean) => void;
}

/** Ticks for one page's active rows, cleared when `resetKey` changes. */
export function useServiceRequestSelection(
  requests: ServiceRequestReadSpec[],
  { enabled, resetKey }: { enabled: boolean; resetKey: string },
): ServiceRequestSelection {
  const [ticked, setTicked] = useState({
    key: resetKey,
    ids: new Set<string>(),
  });
  // Cleared, not just hidden, so the old key's ticks can't come back.
  if (ticked.key !== resetKey) setTicked({ key: resetKey, ids: new Set() });
  const ids = ticked.key === resetKey ? ticked.ids : new Set<string>();
  const update = (next: Iterable<string>) =>
    setTicked({ key: resetKey, ids: new Set(next) });
  const active = requests.filter(({ status }) => status === Status.active);
  const isEnabled = enabled && active.length > 0;
  const selected = isEnabled ? active.filter(({ id }) => ids.has(id)) : [];

  return {
    enabled: isEnabled,
    canSelect: ({ status }) => status === Status.active,
    selected,
    isSelected: ({ id }) => ids.has(id),
    setSelected: ({ id }, isSelected) =>
      update(
        isSelected ? [...ids, id] : [...ids].filter((other) => other !== id),
      ),
    allSelected: active.length > 0 && selected.length === active.length,
    setAllSelected: (isSelected) =>
      update(isSelected ? active.map(({ id }) => id) : []),
  };
}
