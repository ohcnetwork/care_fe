import { HttpMethod, Type } from "@/Utils/request/types";

import { ActionContextField, ActionInstructionDefinition } from "./actions";

/** The action registry — what the backend can run and what a condition may
 *  reference. Process-wide and static per deployment
 *  (`ActionConfigurationViewSet` serves module-level registries). */
export default {
  instructions: {
    path: "/api/v1/action_configuration/instructions/",
    method: HttpMethod.GET,
    TRes: Type<{ instructions: ActionInstructionDefinition[] }>(),
  },
  fields: {
    path: "/api/v1/action_configuration/fields/",
    method: HttpMethod.GET,
    TRes: Type<{ fields: ActionContextField[] }>(),
  },
} as const;
