/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";

import { OptionsType } from "@/common/constants";

import { humanizeStrings } from "@/Utils/utils";

export interface statusType {
  aborted?: boolean;
}

type AbortableFunction = (status: statusType) => any;

export const useAbortableEffect = (
  effect: AbortableFunction,
  dependencies: Array<any>,
) => {
  const status: statusType = {}; // mutable status object
  useEffect(() => {
    status.aborted = false;
    // pass the mutable object to the effect callback
    // store the returned value for cleanup
    const cleanUpFn = effect(status);
    return () => {
      // mutate the object to signal the consumer
      // this effect is cleaning up
      status.aborted = true;
      if (typeof cleanUpFn === "function") {
        // run the cleanup function
        cleanUpFn();
      }
    };
  }, [...dependencies]);
};

export const parseOptionId: (
  options: readonly OptionsType[],
  id: string | string[],
) => string = (options, id) => {
  return humanizeStrings(
    options
      .filter((option) => {
        return id instanceof Array
          ? id.map((i) => String(i)).includes(String(option.id))
          : String(option.id) === String(id);
      })
      .map((option) => option.text),
  );
};

export const deepEqual = (x: any, y: any): boolean => {
  if (x === y) return true;

  if (typeof x == "object" && x != null && typeof y == "object" && y != null) {
    if (Object.keys(x).length != Object.keys(y).length) return false;

    Object.keys(x).forEach((key) => {
      if (!deepEqual(x[key], y[key])) return false;
    });

    return true;
  }

  return false;
};
