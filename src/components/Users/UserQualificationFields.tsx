import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SubsectionTitle } from "@/components/ui/typography";
import { UserQualification } from "@/types/user/user";
import userApi from "@/types/user/userApi";
import query from "@/Utils/request/query";

interface QualificationFields {
  qualification: UserQualification[];
}

export function UserQualificationFields() {
  const { t } = useTranslation();
  const { control } = useFormContext<QualificationFields>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "qualification",
  });
  const {
    data: degrees,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["userDegrees"],
    queryFn: query(userApi.degrees),
    staleTime: 5 * 60 * 1000,
  });
  const degreeKey = (degree: UserQualification["degree"]) =>
    JSON.stringify([degree.system, degree.code]);

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <div>
        <SubsectionTitle>{t("profile_qualifications")}</SubsectionTitle>
        <p className="text-sm text-muted-foreground">
          {t("profile_qualifications_description")}
        </p>
      </div>
      {isError && (
        <div role="alert" className="text-sm text-destructive">
          {t("profile_degrees_load_error")}
          <Button type="button" variant="link" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}
      {degrees?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("profile_no_degrees_available")}
        </p>
      )}
      {fields.map((item, index) => (
        <fieldset
          key={item.id}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <legend className="px-1 text-sm font-medium">
            {t("profile_qualification_number", { number: index + 1 })}
          </legend>
          <FormField
            control={control}
            name={`qualification.${index}.degree`}
            render={({ field }) => {
              const options = (degrees || []).map((degree) => ({
                value: degreeKey(degree),
                label: degree.display || degree.code,
              }));
              // Existing credentials can refer to degrees removed from the catalogue.
              if (
                field.value.code &&
                !options.some(
                  (option) => option.value === degreeKey(field.value),
                )
              ) {
                options.unshift({
                  value: degreeKey(field.value),
                  label: field.value.code,
                });
              }
              return (
                <FormItem>
                  <FormLabel aria-required>{t("profile_degree")}</FormLabel>
                  <FormControl>
                    <Autocomplete
                      ref={field.ref}
                      options={options}
                      value={field.value.code ? degreeKey(field.value) : ""}
                      onChange={(value) => {
                        const degree = degrees?.find(
                          (degree) => degreeKey(degree) === value,
                        );
                        field.onChange(
                          degree
                            ? { code: degree.code, system: degree.system }
                            : { code: "", system: "" },
                        );
                      }}
                      isLoading={isLoading}
                      disabled={isError}
                      placeholder={t("profile_select_degree")}
                      inputPlaceholder={t("profile_search_degrees")}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={control}
            name={`qualification.${index}.issuer`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile_issuer")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`qualification.${index}.registration_number`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("registration_number")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
              {t("profile_remove_qualification", { number: index + 1 })}
            </Button>
          </div>
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={isLoading || isError || !degrees?.length}
        onClick={() =>
          append({
            degree: { code: "", system: "" },
            issuer: "",
            registration_number: "",
            meta: {},
          })
        }
      >
        <Plus className="size-4" />
        {t("profile_add_qualification")}
      </Button>
    </section>
  );
}
