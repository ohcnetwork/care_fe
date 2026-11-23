import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Field, FieldSeparator } from "@/components/ui/field";
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
import {
  UserFormList,
  UserFormListHeader,
  UserFormListHeaderCell,
  UserFormListRow,
} from "@/components/Users/UserFormRow";
import {
  UserFormItem,
  useMobileAddUser,
} from "@/components/Users/UserFormSection";
import {
  UserLanguageSelect,
  useUserLanguages,
} from "@/components/Users/UserLanguageSelect";
import {
  CEFR_LEVELS,
  USER_LANGUAGE_SYSTEM,
  UserCommunication,
} from "@/types/user/user";

const COLUMNS = "sm:grid-cols-[1fr_1fr_--spacing(26)_var(--row-action)]";

interface CommunicationFields {
  communication: UserCommunication[];
}

export function UserCommunicationFields() {
  const { t } = useTranslation();
  const mobile = useMobileAddUser();
  const { control } = useFormContext<CommunicationFields>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "communication",
  });
  const { isError, refetch } = useUserLanguages();

  return (
    <UserFormList
      title={t("profile_communication")}
      description={t("profile_communication_description")}
      count={fields.length}
      addLabel={t("profile_add_language")}
      onAdd={() =>
        append(
          {
            language: { code: "", system: USER_LANGUAGE_SYSTEM },
            preferred: false,
            proficiency: null,
          },
          { shouldFocus: !mobile },
        )
      }
      onRemove={remove}
      notice={
        isError && (
          <div role="alert" className="text-sm text-destructive">
            {t("profile_languages_load_error")}
            <Button type="button" variant="link" onClick={() => refetch()}>
              {t("retry")}
            </Button>
          </div>
        )
      }
      headers={
        <UserFormListHeader columns={COLUMNS}>
          <UserFormListHeaderCell required>
            {t("language")}
          </UserFormListHeaderCell>
          <UserFormListHeaderCell>
            {t("profile_proficiency")}
          </UserFormListHeaderCell>
          <UserFormListHeaderCell>
            {t("profile_preferred")}
          </UserFormListHeaderCell>
          <span />
        </UserFormListHeader>
      }
    >
      {(removeAt) =>
        fields.map((item, index) => (
          <UserFormListRow
            key={item.id}
            columns={COLUMNS}
            title={t("profile_language_number", { number: index + 1 })}
            removeLabel={t("profile_remove_language", { number: index + 1 })}
            onRemove={() => removeAt(index)}
          >
            <FormField
              control={control}
              name={`communication.${index}.language.code`}
              render={({ field }) => (
                <UserFormItem>
                  <FormLabel aria-required className="sm:sr-only">
                    {t("language")}
                  </FormLabel>
                  <FormControl>
                    <UserLanguageSelect {...field} />
                  </FormControl>
                  <FormMessage />
                </UserFormItem>
              )}
            />
            <FormField
              control={control}
              name={`communication.${index}.proficiency`}
              render={({ field }) => (
                <UserFormItem>
                  <FormLabel className="sm:sr-only">
                    {t("profile_proficiency")}
                  </FormLabel>
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
                </UserFormItem>
              )}
            />
            {mobile && <FieldSeparator />}
            <FormField
              control={control}
              name={`communication.${index}.preferred`}
              render={({ field }) => {
                const toggle = (
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                );
                const label = (
                  <FormLabel className="sm:sr-only">
                    {t("profile_preferred_language")}
                  </FormLabel>
                );
                return mobile ? (
                  <FormItem>
                    <Field orientation="horizontal" className="justify-between">
                      {label}
                      {toggle}
                    </Field>
                  </FormItem>
                ) : (
                  <FormItem className="flex h-12 flex-row items-center gap-2 md:h-10">
                    {toggle}
                    {label}
                  </FormItem>
                );
              }}
            />
          </UserFormListRow>
        ))
      }
    </UserFormList>
  );
}
