import { useEffect, useRef, useState } from "react";
import { useScribe } from "./Provider";
import { ScribeActions, ScribeInput, ScribeInputProps } from "./types";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import _ from "lodash";

export function Input<T>(props: ScribeInputProps<T>) {
  const { children, ...otherProps } = props;
  const scribe = useScribe(otherProps as any as ScribeInput<T>);
  const ref = useRef<HTMLDivElement>(null);
  const [actions, setActions] =
    useState<T extends any[] ? ScribeActions<T> : undefined>();

  const unreviewedAIResponse = !Object.keys(
    scribe.reviewedAIResponses,
  ).includes(otherProps.id)
    ? (scribe.lastAIResponse?.[otherProps.id] as T)
    : undefined;

  const isArbitraryType = ["string", "number"].includes(otherProps.type);

  const value = (): T => {
    const result = props.value();

    if (!unreviewedAIResponse) {
      // Check if result is a Promise
      if (result instanceof Promise) {
        return result.then(
          (resolvedValue) => resolvedValue as T,
        ) as unknown as T;
      }
      return result as T;
    }

    if (isArbitraryType && props.options) {
      const option = props.options.find(
        (option) =>
          option.text.toLowerCase() ===
          (unreviewedAIResponse as string).toLowerCase(),
      );
      if (option) return option.id as T;
    }
    return unreviewedAIResponse;
  };

  const handleAccept = async () => {
    scribe.reviewResponse(props.id, true);
    // only update if the value is arbitrary
    const val = value();
    if (isArbitraryType) props.onUpdate(val, val);
  };

  //_.pick(item, props.updatableFields)

  const calculateActions = async (aiResponse: typeof unreviewedAIResponse) => {
    const val = await props.value();
    if (isArbitraryType) return;

    // perform complex updates if the value is an array of objects
    if ("onAdd" in props && Array.isArray(val) && Array.isArray(aiResponse)) {
      let actions: ScribeActions<(typeof val)[number]> = {
        updates: [],
        deletes: [],
        creates: [],
      };
      const coveredItems: (typeof aiResponse)[number][] = [];
      for (const item of aiResponse) {
        const existingItem = val.find((d) => props.comparer(d, item));
        // Check if item is altered or added
        if (!_.isEqual(item, existingItem)) {
          if (existingItem) {
            // item was altered
            actions.updates.push(item);
          } else {
            // symptom does not exist, so must be added
            actions.creates.push(item);
          }
        }
        coveredItems.push(item);
      }
      // check for deleted items
      const deletedItems =
        val.filter((s) => !coveredItems.find((c) => props.comparer(c, s))) ||
        [];
      for (const item of deletedItems) {
        //item was deleted
        actions.deletes.push(item);
      }
      console.log(actions);
      setActions(actions as any);
    }
  };

  const handleDecline = () => {
    scribe.reviewResponse(props.id, false);
  };

  useEffect(() => {
    if (unreviewedAIResponse) {
      calculateActions(unreviewedAIResponse);
    } else {
      setActions(undefined);
    }
  }, [unreviewedAIResponse]);

  return (
    <div
      ref={ref}
      data-scribe-input={otherProps.id}
      className={`relative ${!!unreviewedAIResponse ? "z-10" : ""}`}
    >
      {!!unreviewedAIResponse && (
        <div className="bg-primary-500/10 backdrop-blur rounded-t-lg -inset-x-2 -top-2 bottom-0 absolute -z-10" />
      )}
      {children({ value, aiResponse: unreviewedAIResponse, actions } as any)}
      {!!unreviewedAIResponse && (
        <div className="absolute top-full bg-primary-500/20 backdrop-blur rounded-b-lg -inset-x-2">
          {actions && "onAdd" in props && (
            <div className="px-2 pt-2 flex flex-col gap-2">
              {Object.entries(actions).map(([action, items]) =>
                items.map((item, i) => (
                  <ActionBlock
                    item={
                      action !== "creates"
                        ? _.pick(item, props.updatableFields)
                        : item
                    }
                    key={i}
                    type={action as any}
                  />
                )),
              )}
            </div>
          )}
          <div className="px-2 py-2 flex justify-between gap-2 flex-wrap items-center">
            <div className="text-green-800 text-sm font-semibold">
              <CareIcon icon="l-heart-medical" /> Copilot Suggestion
            </div>
            <div className="flex gap-2 items-center justify-end">
              <ButtonV2 onClick={handleDecline} variant="secondary">
                Decline
              </ButtonV2>
              <ButtonV2 onClick={handleAccept}>Accept</ButtonV2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBlock<T extends any[]>(props: {
  type: keyof ScribeActions<T>;
  item: T[number];
}) {
  const { type, item } = props;

  const typeMap = [
    {
      type: "creates",
      icon: "l-plus",
      text: "Add",
      bg: "bg-green-500/50",
    },
    {
      type: "updates",
      icon: "l-pen",
      text: "Update",
      bg: "bg-yellow-500/50",
    },
    {
      type: "deletes",
      icon: "l-minus",
      text: "Remove",
      bg: "bg-red-500/50",
    },
  ] as const;

  const typeInfo = typeMap.find((t) => t.type === type);

  return (
    <div
      className={`${typeInfo?.bg} text-white rounded-md flex flex-wrap gap-2 items-stretch overflow-hidden`}
    >
      <div className="font-semibold bg-black/5 flex items-center justify-center p-2">
        <CareIcon icon={typeInfo?.icon || "l-circle"} className="text-xl" />
        {typeInfo?.text}
      </div>
      {Object.entries(item).map(([key, value], i) => (
        <div key={i} className="p-2">
          <div className="text-sm opacity-70 capitalize">
            {key.replaceAll("_", " ")}
          </div>
          <div>
            {typeof value === "number" || typeof value === "string"
              ? value
              : "Object"}
          </div>
        </div>
      ))}
    </div>
  );
}
