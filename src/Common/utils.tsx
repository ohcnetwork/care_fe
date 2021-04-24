/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { OptionsType } from "./constants";

export interface statusType { 
  aborted?: boolean 
}

export const useAbortableEffect = (effect: Function, dependencies: Array<any>) => {
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
  options: OptionsType[],
  id: string | string[]
) => string = (options, id) => {
  const textArray = options
    .filter((option) => {
      return id instanceof Array
        ? id.map((i) => String(i)).includes(String(option.id))
        : String(option.id) === String(id);
    })
    .map((option) => option.text);
  return textArray.join(", ");
};
