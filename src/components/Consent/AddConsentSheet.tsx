import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { Edit, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import {
  CONSENT_CATEGORIES,
  CONSENT_DECISIONS,
  CONSENT_STATUSES,
  ConsentModel,
  CreateConsentRequest,
} from "@/types/consent/consent";
import consentApi from "@/types/consent/consentApi";

const consentFormSchema = z
  .object({
    decision: z.enum(CONSENT_DECISIONS).default("permit"),
    category: z.enum(CONSENT_CATEGORIES).default("treatment"),
    status: z.enum(CONSENT_STATUSES).default("active"),
    date: z.date(),
    period: z.object({
      start: z.date().optional(),
      end: z.date().optional(),
    }),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.period.end && data.date > data.period.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("consent_after_end"),
        path: ["date"],
      });
    }
  });

type ConsentFormValues = z.infer<typeof consentFormSchema>;

interface AddConsentSheetProps {
  patientId: string;
  encounterId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  existingConsent?: ConsentModel;
}

export default function AddConsentSheet({
  patientId,
  encounterId,
  trigger,
  onSuccess,
  existingConsent,
}: AddConsentSheetProps) {
  const { t } = useTranslation();
  const isEdit = !!existingConsent;

  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["consents", patientId, encounterId],
    });
    if (isEdit) {
      queryClient.invalidateQueries({
        queryKey: ["consent", existingConsent?.id],
      });
    }
    setIsOpen(false);
    onSuccess?.();
    toast.success(
      isEdit
        ? t("consent_updated_successfully")
        : t("consent_created_successfully"),
    );
  };

  const { mutate: createConsent, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateConsentRequest) =>
      mutate(consentApi.create, {
        pathParams: { patientId },
      })(data),
    onSuccess: async () => {
      handleSuccess();
    },
    onError: () => {
      toast.error(t("error_creating_consent"));
    },
  });

  const { mutate: updateConsent, isPending: isUpdating } = useMutation({
    mutationFn: (data: CreateConsentRequest) =>
      mutate(consentApi.update, {
        pathParams: { patientId, id: existingConsent?.id ?? "" },
      })(data),
    onSuccess: () => {
      handleSuccess();
    },
    onError: () => {
      toast.error(t("error_updating_consent"));
    },
  });

  const isPending = isCreating || isUpdating;

  const form = useForm<ConsentFormValues>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: {
      decision: "permit",
      category: "treatment",
      status: "active",
      date: new Date(),
      period: {
        start: new Date(),
        end: undefined,
      },
      note: "",
    },
  });

  // Prefill the form with existing consent data when in edit mode
  useEffect(() => {
    if (isEdit && existingConsent) {
      form.reset({
        decision: existingConsent.decision,
        category: existingConsent.category,
        status: existingConsent.status,
        date: new Date(existingConsent.date),
        period: {
          start: existingConsent.period.start
            ? new Date(existingConsent.period.start)
            : undefined,
          end: existingConsent.period.end
            ? new Date(existingConsent.period.end)
            : undefined,
        },
        note: existingConsent.note || "",
      });
    }
  }, [isEdit, existingConsent, form]);

  const onSubmit = (values: ConsentFormValues) => {
    const consentData = {
      status: values.status,
      category: values.category,
      date: values.date,
      decision: values.decision,
      period: {
        start: values.period.start,
        end: values.period.end,
      },
      encounter: encounterId,
      source_attachments: [],
      verification_details: [],
      note: values.note,
    };

    if (isEdit && existingConsent) {
      updateConsent(consentData);
    } else {
      createConsent(consentData);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            {isEdit ? (
              <>
                <Edit className="size-4" />
                {t("edit_consent")}
              </>
            ) : (
              <>
                <Plus className="size-4" />
                {t("add")} {t("consent")}
              </>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {isEdit
              ? t("edit") + " " + t("consent")
              : t("add") + " " + t("consent")}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? t("edit_consent_description")
              : t("add_consent_description")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel aria-required>{t("consent_given_on")}</FormLabel>
                  <DatePicker date={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period.start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("consent_valid_from")}</FormLabel>
                    <DatePicker date={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period.end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("consent_valid_until")}</FormLabel>
                    <DatePicker date={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t("consent_decision")}</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="permit" id="permit" />
                      <Label htmlFor="permit">
                        {t("consent_decision__permit")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="deny" id="deny" />
                      <Label htmlFor="deny">
                        {t("consent_decision__deny")}
                      </Label>
                    </div>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("select_category")}
                          className="flex justify-start items-center w-full"
                        >
                          {field.value
                            ? t(`consent_category__${field.value}`)
                            : t("select_category")}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-w-[var(--radix-select-trigger-width)] w-full">
                      {CONSENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex flex-col gap-1">
                            <p className="font-medium">
                              {t(`consent_category__${category}`)}
                            </p>
                            <p className="text-xs text-gray-500 whitespace-normal">
                              {t(`consent_category__${category}_description`)}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <div className="text-xs text-blue-600 bg-blue-100 rounded-md p-2">
                      {t(
                        `consent_category__${form.watch("category")}_description`,
                      )}
                    </div>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONSENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`consent_status__${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("note")}</FormLabel>
                  <FormControl>
                    <textarea
                      className="w-full field-sizing-content border border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-md"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end mt-6 space-x-2">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700"
                disabled={isPending}
              >
                {isPending ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
