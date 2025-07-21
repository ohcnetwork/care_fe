import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

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

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  ACCOUNT_BILLING_STATUS_COLORS,
  ACCOUNT_STATUS_COLORS,
  AccountBillingStatus,
  type AccountRead,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { Period } from "@/types/emr/encounter/encounter";
import { Patient } from "@/types/emr/patient/patient";

interface AccountFormValues {
  name: string;
  description?: string;
  status: AccountStatus;
  billing_status: AccountBillingStatus;
  id?: string;
  patient?: Patient;
  service_period?: Period;
}

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId?: string;
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

  const methods = useForm<AccountFormValues>({
    defaultValues: initialValues || {
      name: "",
      description: "",
      status: AccountStatus.active,
      billing_status: AccountBillingStatus.open,
    },
  });

  const accountBillingStatus = methods.watch("billing_status");
  const accountStatus = methods.watch("status");

  // Reset form when initialValues changes
  React.useEffect(() => {
    methods.reset(
      initialValues || {
        name: "",
        description: "",
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    );
  }, [initialValues, methods]);

  const { mutate: createAccount, isPending: isCreating } = useMutation({
    mutationFn: mutate(accountApi.createAccount, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const isAccountBillingStatusClosed = (
    billingStatus: AccountBillingStatus,
  ) => {
    return (
      billingStatus === AccountBillingStatus.closed_baddebt ||
      billingStatus === AccountBillingStatus.closed_voided ||
      billingStatus === AccountBillingStatus.closed_completed ||
      billingStatus === AccountBillingStatus.closed_combined
    );
  };

  const updateMutation = useMutation<AccountRead, unknown, AccountFormValues>({
    mutationFn: (data) =>
      query(accountApi.updateAccount, {
        pathParams: { facilityId, accountId: data.id! },
        body: {
          id: data.id!,
          name: data.name,
          description: data.description,
          status:
            isAccountBillingStatusClosed(data.billing_status) &&
            data.status === AccountStatus.active
              ? AccountStatus.inactive
              : data.status,
          billing_status: data.billing_status,
          service_period: {
            start: data.service_period?.start || new Date().toISOString(),
            end: isAccountBillingStatusClosed(data.billing_status)
              ? new Date().toISOString()
              : data.service_period?.end || undefined,
          },
          patient: data.patient?.id || patientId!,
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

  const onSubmit = (values: AccountFormValues) => {
    if (isEdit && initialValues?.id) {
      updateMutation.mutate({ ...values, id: initialValues.id });
    } else {
      createAccount({
        ...values,
        patient: patientId!,
        billing_status: values.billing_status,
        service_period: {
          start: new Date().toISOString(),
        },
        description: values.description,
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
                      <Textarea {...field} disabled={isCreating} />
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
                        <SelectTrigger>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(ACCOUNT_BILLING_STATUS_COLORS).map(
                            (key) => (
                              <SelectItem key={key} value={key}>
                                {t(key)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isAccountBillingStatusClosed(accountBillingStatus) &&
                accountStatus === AccountStatus.active && (
                  <p className="text-red-500 bg-red-50 text-xs -mt-2 p-2">
                    {t("billing_status_inactive_warning")}
                  </p>
                )}

              <SheetFooter>
                <Button
                  type="submit"
                  disabled={isCreating || updateMutation.isPending}
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
