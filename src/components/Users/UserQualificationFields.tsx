import { useQuery } from "@tanstack/react-query";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { UserQualification } from "@/types/user/user";
import userApi from "@/types/user/userApi";
import query from "@/Utils/request/query";

const COLUMNS = "sm:grid-cols-[--spacing(36)_1.3fr_1fr_var(--row-action)]";

interface QualificationFields {
  qualification: UserQualification[];
}

export function UserQualificationFields() {
  const { t } = useTranslation();
  const mobile = useMobileAddUser();
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
    <UserFormList
      title={t("profile_qualifications")}
      description={t("profile_qualifications_description")}
      addLabel={t("profile_add_qualification")}
      addDisabled={isLoading || isError || !degrees?.length}
      count={fields.length}
      onRemove={remove}
      onAdd={() =>
        append(
          {
            degree: { code: "", system: "" },
            issuer: "",
            registration_number: "",
            meta: {},
          },
          { shouldFocus: !mobile },
        )
      }
      notice={
        <>
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
        </>
      }
      headers={
        <UserFormListHeader columns={COLUMNS}>
          <UserFormListHeaderCell required>
            {t("profile_degree")}
          </UserFormListHeaderCell>
          <UserFormListHeaderCell>{t("profile_issuer")}</UserFormListHeaderCell>
          <UserFormListHeaderCell>
            {t("registration_number")}
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
            title={t("profile_qualification_number", { number: index + 1 })}
            removeLabel={t("profile_remove_qualification", {
              number: index + 1,
            })}
            onRemove={() => removeAt(index)}
          >
            <FormField
              control={control}
              name={`qualification.${index}.degree`}
              render={({ field, fieldState }) => {
                const options = (degrees || []).map((degree) => ({
                  value: degreeKey(degree),
                  label: degree.display || degree.code,
                }));
                const unavailable =
                  degrees &&
                  field.value.code &&
                  !options.some(
                    (option) => option.value === degreeKey(field.value),
                  );
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
                  <UserFormItem>
                    <FormLabel aria-required className="sm:sr-only">
                      {t("profile_degree")}
                    </FormLabel>
                    <FormControl>
                      <Autocomplete
                        ref={field.ref}
                        options={options}
                        value={field.value.code ? degreeKey(field.value) : ""}
                        onChange={(value) => {
                          if (!value) {
                            field.onChange({ code: "", system: "" });
                            return;
                          }
                          if (value === degreeKey(field.value)) return;
                          const degree = degrees?.find(
                            (degree) => degreeKey(degree) === value,
                          );
                          if (degree) {
                            field.onChange({
                              code: degree.code,
                              system: degree.system,
                            });
                          }
                        }}
                        isLoading={isLoading}
                        disabled={isError}
                        placeholder={t("profile_select_degree")}
                        inputPlaceholder={t("profile_search_degrees")}
                        className="w-full"
                      />
                    </FormControl>
                    {unavailable && !fieldState.error && (
                      <FormDescription>
                        {t("profile_degree_unavailable")}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </UserFormItem>
                );
              }}
            />
            <FormField
              control={control}
              name={`qualification.${index}.issuer`}
              render={({ field }) => (
                <UserFormItem>
                  <FormLabel className="sm:sr-only">
                    {t("profile_issuer")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </UserFormItem>
              )}
            />
            <FormField
              control={control}
              name={`qualification.${index}.registration_number`}
              render={({ field }) => (
                <UserFormItem>
                  <FormLabel className="sm:sr-only">
                    {t("registration_number")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </UserFormItem>
              )}
            />
          </UserFormListRow>
        ))
      }
    </UserFormList>
  );
}
