import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { Edit, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { tzAwareDateTime } from "@/lib/validators";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { DateTimeInput } from "@/components/Common/DateTimeInput";
import RadioInput from "@/components/Questionnaire/RadioInput";

import useFileUpload from "@/hooks/useFileUpload";

import mutate from "@/Utils/request/mutate";
import {
  CONSENT_CATEGORIES,
  CONSENT_DECISIONS,
  CONSENT_STATUSES,
  ConsentModel,
  CreateConsentRequest,
} from "@/types/consent/consent";
import consentApi from "@/types/consent/consentApi";

interface FileEntry {
  file: File;
  name: string;
}

const consentFormSchema = (isEdit: boolean) =>
  z
    .object({
      decision: z.enum(CONSENT_DECISIONS).default("permit"),
      category: z.enum(CONSENT_CATEGORIES).default("treatment"),
      status: z.enum(CONSENT_STATUSES).default("active"),
      date: tzAwareDateTime,
      period: z.object({
        start: tzAwareDateTime.optional(),
        end: tzAwareDateTime.optional(),
      }),
      note: z.string().optional(),
      fileEntries: z
        .array(
          z.object({
            file: z.instanceof(File),
            name: z.string().min(1, { message: t("enter_file_name") }),
          }),
        )
        .default([]),
    })
    .superRefine((data, ctx) => {
      if (isEdit) return;
      if (
        data.period.start &&
        data.period.end &&
        data.period.start > data.period.end
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("valid_from_after_valid_untill"),
          path: ["period.end"],
        });
      }

      if (
        data.period.start &&
        new Date(data.period.start) < new Date(data.date)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("consent_period_start_before_consent_date_validation"),
          path: ["period.start"],
        });
      }
    });

type ConsentFormValues = z.infer<ReturnType<typeof consentFormSchema>>;

interface ConsentFormSheetProps {
  patientId: string;
  encounterId: string;
  existingConsent?: ConsentModel;
}

export default function ConsentFormSheet({
  patientId,
  encounterId,
  existingConsent,
}: ConsentFormSheetProps) {
  const { t } = useTranslation();
  const isEdit = !!existingConsent;

  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUpload = useFileUpload({
    type: "consent",
    category: "consent_attachment",
    multiple: true,
    allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
    allowNameFallback: false,
    compress: false,
  });

  const form = useForm({
    resolver: zodResolver(consentFormSchema(isEdit)),
    mode: "onChange",
    defaultValues: {
      decision: "permit",
      category: "treatment",
      status: "active",
      date: new Date().toISOString(),
      period: {
        start: new Date().toISOString(),
        end: undefined,
      },
      note: "",
      fileEntries: [],
    },
  });

  useEffect(() => {
    const fileEntries: FileEntry[] = fileUpload.files.map((file, index) => ({
      file,
      name: fileUpload.fileNames[index] || "",
    }));
    form.setValue("fileEntries", fileEntries, {
      shouldValidate: fileEntries.length > 0,
    });
  }, [fileUpload.files, fileUpload.fileNames, form]);

  const handleSuccess = async (consentId?: string) => {
    if (fileUpload.files.length > 0 && consentId) {
      try {
        await fileUpload.handleFileUpload(consentId);
      } catch (_error) {
        toast.error(t("error_uploading_files"));
      }
    }

    queryClient.invalidateQueries({
      queryKey: ["consents", patientId, encounterId],
    });
    if (isEdit) {
      queryClient.invalidateQueries({
        queryKey: ["consent", existingConsent!.id],
      });
    }

    form.reset();

    setIsOpen(false);

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
    onSuccess: async (response) => {
      handleSuccess(response.id);
    },
    onError: () => {
      toast.error(t("error_creating_consent"));
    },
  });

  const { mutate: updateConsent, isPending: isUpdating } = useMutation({
    mutationFn: (data: CreateConsentRequest) =>
      mutate(consentApi.update, {
        pathParams: { patientId, id: existingConsent!.id },
      })(data),
    onSuccess: () => {
      handleSuccess(existingConsent!.id);
    },
    onError: () => {
      toast.error(t("error_updating_consent"));
    },
  });

  const isPending = isCreating || isUpdating || fileUpload.uploading;

  useEffect(() => {
    if (isEdit) {
      form.reset({
        decision: existingConsent!.decision,
        category: existingConsent!.category,
        status: existingConsent!.status,
        date: new Date(existingConsent!.date).toISOString(),
        period: {
          start: existingConsent!.period.start
            ? new Date(existingConsent!.period.start).toISOString()
            : undefined,
          end: existingConsent!.period.end
            ? new Date(existingConsent!.period.end).toISOString()
            : undefined,
        },
        note: existingConsent!.note || "",
        fileEntries: [],
      });
    }
  }, [existingConsent]);

  useEffect(() => {
    if (!isOpen) {
      fileUpload.clearFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const onSubmit = (values: ConsentFormValues) => {
    const consentData: CreateConsentRequest = {
      status: values.status,
      category: isEdit ? existingConsent!.category : values.category,
      date: isEdit ? new Date(existingConsent!.date) : new Date(values.date),
      decision: isEdit ? existingConsent!.decision : values.decision,
      period: isEdit
        ? {
            start: existingConsent!.period.start
              ? new Date(existingConsent!.period.start)
              : null,
            end: existingConsent!.period.end
              ? new Date(existingConsent!.period.end)
              : null,
          }
        : {
            start: values.period.start ? new Date(values.period.start) : null,
            end: values.period.end ? new Date(values.period.end) : null,
          },
      encounter: encounterId,
      source_attachments: [],
      verification_details: [],
      note: values.note,
    };

    if (isEdit) {
      updateConsent(consentData);
    } else {
      createConsent(consentData);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant={isEdit ? "outline" : "primary"} className="gap-2">
          {isEdit ? (
            <>
              <Edit className="size-4" />
              {t("edit")}
            </>
          ) : (
            <>
              <Plus className="size-4" />
              {t("add")} {t("consent")}
            </>
          )}
        </Button>
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
            {!isEdit && (
              <>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel aria-required>
                        {t("consent_given_on")}
                      </FormLabel>
                      <DateTimeInput
                        {...field}
                        value={field.value}
                        onDateChange={(val) => field.onChange(val)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="period.start"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("consent_valid_from")}</FormLabel>
                        <DateTimeInput
                          {...field}
                          value={field.value ?? ""}
                          onDateChange={(val) => {
                            field.onChange(val ?? null);
                          }}
                        />
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
                        <DateTimeInput
                          {...field}
                          value={field.value ?? ""}
                          onDateChange={(val) => {
                            field.onChange(val ?? null);
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="decision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("consent_decision")}</FormLabel>
                      <RadioInput
                        {...field}
                        options={CONSENT_DECISIONS.map((decision) => ({
                          label: t(`consent_decision__${decision}`),
                          value: decision,
                        }))}
                        onValueChange={field.onChange}
                      />
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
                                  {t(
                                    `consent_category__${category}_description`,
                                  )}
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
              </>
            )}

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
                      className="w-full field-sizing-content focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-md"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <div>
                <FormLabel>{t("supporting_documents")}</FormLabel>
                <div className="flex flex-col gap-2 mt-2">
                  {fileUpload.files.map((file, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`fileEntries.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <div className="flex items-stretch gap-2">
                            <FormControl>
                              <Input
                                placeholder={t("file_name")}
                                className="flex-1"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  fileUpload.setFileName(e.target.value, index);
                                }}
                              />
                            </FormControl>
                            <div className="bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 flex items-center gap-2 max-w-[150px]">
                              <span className="text-sm truncate">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="border border-secondary-300"
                              onClick={() => {
                                fileUpload.removeFile(index);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                            >
                              <CareIcon icon="l-trash" className="size-4" />
                            </Button>
                          </div>
                          <FormMessage className="mt-1" />
                        </FormItem>
                      )}
                    />
                  ))}
                  <Label
                    htmlFor="file_upload_consent"
                    className="w-full inline-flex items-center justify-center px-4 py-2 cursor-pointer border border-gray-200 rounded-md hover:bg-accent hover:text-accent-foreground"
                  >
                    <CareIcon icon="l-file-upload-alt" className="mr-1" />
                    <span>
                      {t("select")} {t("files")}
                    </span>
                    {fileUpload.Input({
                      className: "hidden",
                      ref: fileInputRef,
                    })}
                  </Label>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
                disabled={isPending}
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
      {fileUpload.Dialogues}
    </Sheet>
  );
}
