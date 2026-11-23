import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ActionConfigurationRetrieve,
  SUPPORTED_ACTION_CONFIGURATION_CONTEXTS,
  isSupportedActionConfigurationContext,
} from "@/types/actions/actionConfiguration";
import { formatDateTime } from "@/Utils/utils";

import { ActionConfigurationFormValues } from "./actionConfigurationFormSchema";
import { actionContextHint, actionContextLabel } from "./labels";

interface ActionConfigurationFieldsProps {
  isEditing: boolean;
  existing?: ActionConfigurationRetrieve;
  onContextChange: () => void;
}

/** Identity and creation-only context fields. The parent owns the action
 * draft and decides how to reset it when this form's context changes. */
export function ActionConfigurationFields({
  isEditing,
  existing,
  onContextChange,
}: ActionConfigurationFieldsProps) {
  const { t } = useTranslation();
  const form = useFormContext<ActionConfigurationFormValues>();
  const [context, performable] = useWatch({
    control: form.control,
    name: ["action_context", "performable"],
  });
  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("name")}</FormLabel>
            <FormControl>
              <Input {...field} autoFocus={!isEditing} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("description")}</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isEditing ? (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-900">
            {t("action_configuration_context")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{actionContextLabel(context, t)}</Badge>
            {performable && (
              <Badge variant="secondary">
                {t("action_configuration_on_demand")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {actionContextHint(context, t)}
          </p>
          <p className="text-xs text-gray-500">
            {t("action_configuration_context_locked")}
          </p>
        </div>
      ) : (
        <>
          <FormField
            control={form.control}
            name="action_context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("action_configuration_context")}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value === field.value) return;
                    if (!isSupportedActionConfigurationContext(value)) return;
                    field.onChange(value);
                    // Conditions and steps were authored against
                    // the previous context's fields; they cannot
                    // resolve under the new one, so they go.
                    onContextChange();
                  }}
                >
                  <FormControl>
                    <SelectTrigger
                      className="w-full"
                      aria-label={t("action_configuration_context")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPORTED_ACTION_CONFIGURATION_CONTEXTS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {actionContextLabel(option, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {actionContextHint(field.value, t)}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="performable"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label={t("action_configuration_performable")}
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel>{t("action_configuration_performable")}</FormLabel>
                  <FormDescription>
                    {t("action_configuration_performable_hint")}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </>
      )}
      {existing && (
        <dl className="space-y-3 border-t border-gray-200 pt-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-gray-500">
              {t("created_by")}
            </dt>
            <dd className="text-gray-900">
              {existing.created_by?.username ?? t("unknown")}
              <time
                dateTime={existing.created_date}
                className="block text-xs text-gray-500"
              >
                {formatDateTime(existing.created_date, "DD/MM/YYYY hh:mm A")}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">
              {t("last_updated_by")}
            </dt>
            <dd className="text-gray-900">
              {existing.updated_by?.username ?? t("unknown")}
              <time
                dateTime={existing.modified_date}
                className="block text-xs text-gray-500"
              >
                {formatDateTime(existing.modified_date, "DD/MM/YYYY hh:mm A")}
              </time>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
