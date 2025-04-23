import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

import FileUploadDialog from "@/components/Files/FileUploadDialog";

import useFileUpload from "@/hooks/useFileUpload";

import mutate from "@/Utils/request/mutate";
import {
  CONSENT_CATEGORIES,
  CONSENT_DECISIONS,
  CONSENT_STATUSES,
  CreateConsentRequest,
  VERIFICATION_TYPES,
  VerificationType,
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
    verification_type: z.enum(VERIFICATION_TYPES).default("validation"),
    source_attachments: z.array(z.instanceof(File)).default([]),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.source_attachments.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("please_upload_a_file"),
        path: ["source_attachments"],
      });
    }

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
}

export default function AddConsentSheet({
  patientId,
  encounterId,
  trigger,
  onSuccess,
}: AddConsentSheetProps) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const queryClient = useQueryClient();

  const fileUpload = useFileUpload({
    type: "consent",
    category: "consent_attachment",
    multiple: false,
    allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
    allowNameFallback: false,
    compress: false,
    onUpload: () => {
      queryClient.invalidateQueries({
        queryKey: ["consents", patientId, encounterId],
      });
      setOpenUploadDialog(false);
      setIsOpen(false);
      form.reset();
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["consents", patientId, encounterId],
    });
    setIsOpen(false);
    onSuccess?.();
    fileUpload.clearFiles();
  };

  const { mutate: addVerification } = useMutation({
    mutationFn: (params: {
      id: string;
      verificationType: VerificationType;
      note?: string;
    }) =>
      mutate(consentApi.addVerification, {
        pathParams: { patientId, id: params.id },
      })({
        verification_type: params.verificationType,
        verified: true,
        note: params.note,
      }),
    onSuccess: () => {
      if (form.getValues("source_attachments")?.length === 0) {
        handleSuccess();
        toast.success(t("consent_created_successfully"));
        return;
      }

      setOpenUploadDialog(true);
    },
    onError: () => {
      toast.error(t("error_adding_verification"));
    },
  });

  const { mutate: createConsent, isPending } = useMutation({
    mutationFn: (data: CreateConsentRequest) =>
      mutate(consentApi.create, {
        pathParams: { patientId },
      })(data),
    onSuccess: async (response) => {
      setAssociatingId(response.id);
      // After consent is created, add verification as a separate call
      addVerification({
        id: response.id,
        verificationType: form.getValues("verification_type"),
        note: form.getValues("note"),
      });
    },
    onError: () => {
      toast.error(t("error_creating_consent"));
    },
  });
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
      verification_type: "validation",
      source_attachments: [],
      note: "",
    },
  });

  useEffect(() => {
    form.setValue("source_attachments", fileUpload.files);
  }, [fileUpload.files, form]);

  const onSubmit = (values: ConsentFormValues) => {
    createConsent({
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
    });
  };

  const handleUploadDialogClose = (open: boolean) => {
    setOpenUploadDialog(open);

    if (!open) {
      handleSuccess();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Plus className="size-4" />
            {t("add_consent")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>{t("add_consent")}</SheetTitle>
          <SheetDescription>{t("add_consent_description")}</SheetDescription>
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
              name="verification_type"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>{t("consent_verification_type")}</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="family"
                      className={cn(
                        "flex flex-col space-y-1 rounded-md border border-gray-200 p-4 cursor-pointer items-start justify-center",
                        field.value === "family" &&
                          "border-2 border-green-500 bg-green-50",
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="family" id="family" />
                        <Label
                          htmlFor="family"
                          className="font-medium cursor-pointer"
                        >
                          {t("consent_verification_type__family")}
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 ps-6">
                        {t("consent_verification_type__family_description")}
                      </p>
                    </Label>
                    <Label
                      htmlFor="validation"
                      className={cn(
                        "flex flex-col space-y-1 rounded-md border border-gray-200 p-4 cursor-pointer items-start justify-center",
                        field.value === "validation" &&
                          "border-2 border-green-500 bg-green-50",
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="validation" id="validation" />
                        <Label
                          htmlFor="validation"
                          className="font-medium cursor-pointer"
                        >
                          {t("consent_verification_type__validation")}
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 ps-6">
                        {t("consent_verification_type__validation_description")}
                      </p>
                    </Label>
                  </RadioGroup>
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

            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                {t("uploaded")} {t("files")} ({fileUpload.files.length || 0})
              </h3>

              <FormField
                control={form.control}
                name="source_attachments"
                render={({ field }) => (
                  <FormItem>
                    <FormControl {...field}>
                      <>
                        <Label
                          htmlFor={`file_upload_consent`}
                          className="w-full inline-flex items-center justify-center px-4 py-2 cursor-pointer border border-gray-200 rounded-md hover:bg-accent hover:text-accent-foreground"
                        >
                          <CareIcon icon="l-file-upload-alt" className="mr-1" />
                          <span
                            className="truncate"
                            title={fileUpload.files
                              .map((file) => file.name)
                              .join(", ")}
                          >
                            {fileUpload.files.length > 0
                              ? fileUpload.files
                                  .map((file) => file.name)
                                  .join(", ")
                              : t("upload")}
                          </span>
                          {fileUpload.Input({ className: "hidden" })}
                        </Label>

                        {fileUpload.files.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => fileUpload.clearFiles()}
                          >
                            {t("clear")}
                          </Button>
                        )}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
      {fileUpload.Dialogues}
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={handleUploadDialogClose}
        fileUpload={fileUpload}
        associatingId={associatingId!}
        type="consent"
      />
    </Sheet>
  );
}
