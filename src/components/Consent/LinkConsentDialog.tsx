import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FileUploadDialog from "@/components/Files/FileUploadDialog";

import useAuthUser from "@/hooks/useAuthUser";
import useFileUpload from "@/hooks/useFileUpload";

import mutate from "@/Utils/request/mutate";
import {
  CONSENT_CATEGORIES,
  CONSENT_DECISIONS,
  CONSENT_STATUSES,
  CreateConsentRequest,
  VERIFICATION_TYPES,
} from "@/types/consent/consent";
import consentApi from "@/types/consent/consentApi";
import { UserBase } from "@/types/user/user";

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

interface LinkConsentDialogProps {
  patientId: string;
  encounterId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function LinkConsentDialog({
  patientId,
  encounterId,
  trigger,
  onSuccess,
}: LinkConsentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

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
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["consents", patientId, encounterId],
    });
    setIsOpen(false);
    onSuccess?.();
    form.reset();
    fileUpload.clearFiles();
  };

  const { mutate: createConsent, isPending } = useMutation({
    mutationFn: (data: CreateConsentRequest) =>
      mutate(consentApi.create, {
        pathParams: { patientId },
      })(data),
    onSuccess: async (response) => {
      if (form.getValues("source_attachments")?.length === 0) {
        handleSuccess();
        toast.success(t("consent_created_successfully"));
        return;
      }

      setAssociatingId(response.id);
      setOpenUploadDialog(true);
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
    },
  });

  useEffect(() => {
    form.setValue("source_attachments", fileUpload.files);
  }, [fileUpload.files, form]);

  const onSubmit = (values: ConsentFormValues) => {
    const verifier: UserBase = {
      id: authUser.external_id,
      first_name: authUser.first_name,
      last_name: authUser.last_name,
      phone_number: authUser.phone_number || "",
      user_type: authUser.user_type,
      gender: authUser.gender || "non_binary",
      username: authUser.username,
      email: authUser.email || "",
      prefix: authUser.prefix || "",
      suffix: authUser.suffix || "",
      mfa_enabled: authUser.mfa_enabled || false,
      last_login: authUser.last_login || new Date().toISOString(),
      profile_picture_url: authUser.read_profile_picture_url || "",
    };

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
      verification_details: [
        {
          verified: true,
          verified_by: verifier,
          verification_date: new Date().toISOString(),
          verification_type: values.verification_type,
        },
      ],
    });
  };

  const handleUploadDialogClose = (open: boolean) => {
    setOpenUploadDialog(open);

    if (!open) {
      handleSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Plus className="size-4" />
            {t("link_consent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("link_consent")}</DialogTitle>
          <DialogDescription>{t("link_consent_description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-2 space-y-4"
          >
            <>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel required>{t("consent_date")}</FormLabel>
                    <DatePicker date={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period.start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("consent_period_start_date")}</FormLabel>
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
                    <FormLabel>{t("consent_period_end_date")}</FormLabel>
                    <DatePicker date={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="decision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("consent_decision")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("select_consent_decision")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONSENT_DECISIONS.map((decision) => (
                          <SelectItem key={decision} value={decision}>
                            {t(`consent_decision__${decision}`)}
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
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONSENT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            <p>{t(`consent_category__${category}`)}</p>
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
                  <FormItem>
                    <FormLabel>{t("consent_verification_type")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("select_verification_type")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VERIFICATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`consent_verification_type__${type}`)}
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
                            className="w-full"
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
            </>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </form>
        </Form>
      </DialogContent>
      {fileUpload.Dialogues}
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={handleUploadDialogClose}
        fileUpload={fileUpload}
        associatingId={associatingId!}
        type="consent"
      />
    </Dialog>
  );
}
