import { TFunction } from "i18next";
import { z } from "zod";

import { SUPPORTED_ACTION_CONFIGURATION_CONTEXTS } from "@/types/actions/actionConfiguration";

export const actionConfigurationFormSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, t("field_required")).max(254),
    description: z.string().trim(),
    action_context: z.enum(SUPPORTED_ACTION_CONFIGURATION_CONTEXTS),
    performable: z.boolean(),
  });

export type ActionConfigurationFormValues = z.infer<
  ReturnType<typeof actionConfigurationFormSchema>
>;
