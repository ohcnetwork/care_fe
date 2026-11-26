import { differenceInMilliseconds } from "date-fns";
import { useEffect, useReducer } from "react";

import { getTagExpiry, isTagExpired } from "@/components/Tags/tagExpiry";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

// setTimeout overflows past this delay; such tags update on the next refetch
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * The tag's expiry, re-rendering once it passes so an open page doesn't keep
 * showing the tag as active.
 */
export function useTagExpiry(tag: TagConfig) {
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    const expiry = getTagExpiry(tag);
    if (!expiry) return;
    const msLeft = differenceInMilliseconds(expiry, new Date());
    if (msLeft <= 0 || msLeft > MAX_TIMER_MS) return;
    const timer = setTimeout(rerender, msLeft + 1000);
    return () => clearTimeout(timer);
  }, [tag]);

  return { expiry: getTagExpiry(tag), expired: isTagExpired(tag) };
}
