import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SubsectionTitle } from "@/components/ui/typography";
import {
  UserLanguageSelect,
  useUserLanguages,
} from "@/components/Users/UserLanguageSelect";
import {
  CEFR_LEVELS,
  USER_LANGUAGE_SYSTEM,
  UserCommunication,
} from "@/types/user/user";

interface CommunicationFields {
  communication: UserCommunication[];
}

export function UserCommunicationFields() {
  const { t } = useTranslation();
  const { control } = useFormContext<CommunicationFields>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "communication",
  });
  const { isError, refetch } = useUserLanguages();

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div>
        <SubsectionTitle>{t("profile_communication")}</SubsectionTitle>
        <p className="text-sm text-muted-foreground">
          {t("profile_communication_description")}
        </p>
      </div>
      {isError && (
        <div role="alert" className="text-sm text-destructive">
          {t("profile_languages_load_error")}
          <Button type="button" variant="link" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}
      {fields.map((item, index) => (
        <fieldset
          key={item.id}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <legend className="px-1 text-sm font-medium">
            {t("profile_language_number", { number: index + 1 })}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={control}
              name={`communication.${index}.language.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("language")}</FormLabel>
                  <FormControl>
                    <UserLanguageSelect {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`communication.${index}.proficiency`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profile_proficiency")}</FormLabel>
                  <Select
                    value={field.value || "unspecified"}
                    onValueChange={(value) =>
                      field.onChange(value === "unspecified" ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger ref={field.ref}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unspecified">
                        {t("not_specified")}
                      </SelectItem>
                      {CEFR_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {t(`profile_cefr_${level}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <FormField
              control={control}
              name={`communication.${index}.preferred`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>{t("profile_preferred_language")}</FormLabel>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("profile_remove_language", { number: index + 1 })}
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            language: { code: "", system: USER_LANGUAGE_SYSTEM },
            preferred: false,
            proficiency: null,
          })
        }
      >
        <Plus className="size-4" />
        {t("profile_add_language")}
      </Button>
    </section>
  );
}
