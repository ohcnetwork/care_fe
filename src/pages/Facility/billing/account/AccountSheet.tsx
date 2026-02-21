import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import {
  ExtensionEntityType,
  getCombinedExtensionProps,
  NamespacedExtensionData,
  useEntityExtensions,
  useExtensionSchemas,
} from "@/hooks/useExtensions";
import {
  ACCOUNT_STATUS_COLORS,
  AccountBillingStatus,
  type AccountRead,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { EncounterListRead, Period } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PatientRead } from "@/types/emr/patient/patient";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

const createBaseSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("name_is_required")),
    description: z.string().optional().nullable(),
    status: z.nativeEnum(AccountStatus),
    billing_status: z.nativeEnum(AccountBillingStatus),
    id: z.string().optional(),
    patient: z.custom<PatientRead>().optional(),
    service_period: z.custom<Period>().optional(),
    primary_encounter: z.string().optional(),
  });

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId: string;
  initialValues?: AccountRead;
  isEdit?: boolean;
}

export function AccountSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  initialValues,
  isEdit,
}: AccountSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { getExtensions } = useExtensionSchemas();

  // Fetch patient encounters
  const { data: encounters, isLoading: isLoadingEncounters } = useQuery({
    queryKey: ["encounters", patientId, facilityId],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
        facility: facilityId,
        ordering: "-created_date",
        limit: 10,
      },
    }),
    select(data: PaginatedResponse<EncounterListRead>) {
      return data.results;
    },
    enabled: open,
  });

  const ext = useMemo(
    () =>
      getCombinedExtensionProps(
        getExtensions(ExtensionEntityType.account, "write"),
      ),
    [getExtensions],
  );

  const formSchema = useMemo(
    () =>
      createBaseSchema(t).extend({
        extensions: ext.validation.optional(),
      }),
    [t, ext.validation],
  );

  type FormValues = z.infer<typeof formSchema>;

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues
      ? {
          ...initialValues,
          primary_encounter: initialValues.primary_encounter?.id,
        }
      : {
          name: "",
          description: "",
          status: AccountStatus.active,
          billing_status: AccountBillingStatus.open,
          extensions: ext.defaults,
          primary_encounter: undefined,
        },
  });

  const extensions = useEntityExtensions({
    entityType: ExtensionEntityType.account,
    schemaType: "write",
    form: methods,
    existingData: initialValues?.extensions,
  });

  // Reset form when initialValues changes
  React.useEffect(() => {
    methods.reset(
      initialValues
        ? {
            ...initialValues,
            primary_encounter: initialValues.primary_encounter?.id,
          }
        : {
            name: "",
            description: "",
            status: AccountStatus.active,
            billing_status: AccountBillingStatus.open,
            extensions: ext.defaults,
            primary_encounter: undefined,
          },
    );
  }, [initialValues, methods, ext.defaults]);

  const { mutate: createAccount, isPending: isCreating } = useMutation({
    mutationFn: mutate(accountApi.createAccount, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const updateMutation = useMutation<AccountRead, unknown, FormValues>({
    mutationFn: (data) =>
      query(accountApi.updateAccount, {
        pathParams: { facilityId, accountId: data.id! },
        body: {
          id: data.id!,
          name: data.name,
          description: data.description,
          status: data.status,
          billing_status: data.billing_status,
          service_period: data.service_period || {
            start: new Date().toISOString(),
          },
          patient: data.patient?.id || patientId!,
          primary_encounter: data.primary_encounter,
          extensions: extensions.prepareForSubmit(
            data.extensions as NamespacedExtensionData,
          ),
        },
      })({ signal: new AbortController().signal }),
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["account", initialValues?.id],
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    const { extensions: formExtensions, ...restData } = values;
    const cleanedExtensions = extensions.prepareForSubmit(
      formExtensions as NamespacedExtensionData,
    );

    if (isEdit && initialValues?.id) {
      updateMutation.mutate({ ...values, id: initialValues.id });
    } else {
      createAccount({
        ...restData,
        patient: patientId!,
        billing_status: values.billing_status,
        service_period: {
          start: new Date().toISOString(),
        },
        description: values.description,
        extensions: cleanedExtensions,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isEdit ? t("edit_account") : t("create_account")}
          </SheetTitle>
        </SheetHeader>
        <FormProvider {...methods}>
          <Form {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-6 py-6"
            >
              <FormField
                name="name"
                control={methods.control}
                rules={{ required: t("name_is_required") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isCreating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="description"
                control={methods.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isCreating}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="status"
                control={methods.control}
                rules={{ required: t("required") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("status")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isCreating}
                      >
                        <SelectTrigger ref={field.ref}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(ACCOUNT_STATUS_COLORS).map((key) => (
                            <SelectItem key={key} value={key}>
                              {t(key)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="billing_status"
                control={methods.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("billing_status")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger ref={field.ref}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            AccountBillingStatus.open,
                            AccountBillingStatus.carecomplete_notbilled,
                            AccountBillingStatus.billing,
                          ].map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEdit && (
                <FormField
                  name="primary_encounter"
                  control={methods.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("primary_encounter")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          disabled={isCreating || isLoadingEncounters}
                        >
                          <SelectTrigger ref={field.ref}>
                            <SelectValue
                              placeholder={t("select_primary_encounter")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {encounters?.map((encounter) => (
                              <SelectItem
                                key={encounter.id}
                                value={encounter.id}
                              >
                                {`${t(encounter.encounter_class)} - ${t(encounter.status)} (${new Date(encounter.period.start || "").toLocaleDateString("en-IN")})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {extensions.fields}

              <SheetFooter>
                <Button
                  type="submit"
                  disabled={
                    isCreating ||
                    updateMutation.isPending ||
                    !methods.formState.isDirty
                  }
                >
                  {isEdit ? t("update") : t("create")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}

export default AccountSheet;
