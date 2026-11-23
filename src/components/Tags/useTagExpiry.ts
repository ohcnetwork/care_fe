import { useEffect, useReducer } from "react";

import { getTagExpiry, isTagExpired } from "@/components/Tags/tagExpiry";

import dayjs from "@/Utils/dayjs";
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
    const msLeft = getTagExpiry(tag)?.diff(dayjs());
    if (!msLeft || msLeft <= 0 || msLeft > MAX_TIMER_MS) return;
    const timer = setTimeout(rerender, msLeft + 1000);
    return () => clearTimeout(timer);
  }, [tag]);

  return { expiry: getTagExpiry(tag), expired: isTagExpired(tag) };
}
