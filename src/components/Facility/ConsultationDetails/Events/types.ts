import { UserBareMinimum } from "@/components/Users/models";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

export type Type = {
  id: number;
  parent: number | null;
  name: string;
  description: string | null;
  model: string;
  fields: string[];
};

export type CausedBy = UserBareMinimum;

export type EventGeneric = {
  id: string;
  event_type: Type;
  created_date: string;
  object_model: string;
  object_id: number;
  is_latest: boolean;
  meta: {
    external_id: string;
  };
  value: Record<string, unknown>;
  change_type: "CREATED" | "UPDATED" | "DELETED";
  consultation: number;
  caused_by: UserBareMinimum;
};

// TODO: Once event types are finalized, define specific types for each event

let cachedEventTypes: Type[] | null = null;

export const fetchEventTypeByName = async (name: Type["name"]) => {
  if (!cachedEventTypes) {
    const { data } = await request(routes.listEventTypes, {
      query: { limit: 100 },
    });

    if (data?.results) {
      cachedEventTypes = data.results;
    }
  }

  return cachedEventTypes?.find((t) => t.name === name);
};
