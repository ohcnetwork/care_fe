import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { Download, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import PDFViewer from "@/components/Common/PDFViewer";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import { FileUploadModel } from "@/components/Patient/models";

import useAuthUser from "@/hooks/useAuthUser";
import useFileManager from "@/hooks/useFileManager";
import useFileUpload from "@/hooks/useFileUpload";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  CONSENT_CATEGORIES,
  CONSENT_CATEGORY_TYPES,
  CONSENT_DECISIONS,
  CONSENT_DECISION_TYPES,
  CONSENT_STATUSES,
  CONSENT_STATUS_TYPES,
  ConsentModel,
  CreateConsentRequest,
  VERIFICATION_TYPES,
  VERIFICATION_TYPE_TYPES,
} from "@/types/consent/consent";
import { UserBase } from "@/types/user/user";

const consentFormSchema = z
  .object({
    option: z.enum(["existing", "new"]).default("new"),
    existingConsent: z.string().optional(),
    existingConsentSearchQuery: z.string().optional(),
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
    if (data.option === "existing" && !data.existingConsent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("please_select_a_consent"),
        path: ["existingConsent"],
      });
    }

    if (data.option === "new" && data.source_attachments.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("please_upload_a_file"),
        path: ["source_attachments"],
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
  });

  useEffect(() => {
    if (!openUploadDialog) {
      fileUpload.clearFiles();
    }
  }, [openUploadDialog]);

  const { data: existingConsents } = useQuery({
    queryKey: ["consents", patientId],
    queryFn: query(routes.consent.list, {
      pathParams: { patientId },
    }),
    enabled: isOpen,
  });

  const { mutate: createConsent, isPending } = useMutation({
    mutationFn: (data: CreateConsentRequest) =>
      mutate(routes.consent.create, {
        pathParams: { patientId },
      })(data),
    onSuccess: async (response) => {
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
      option: "new",
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

  const onSubmit = (values: ConsentFormValues) => {
    if (values.option === "existing") {
      // TODO: Add API endpoint for linking existing consent
      return;
    }

    const verifier: UserBase = {
      id: authUser.external_id,
      first_name: authUser.first_name,
      last_name: authUser.last_name,
      phone_number: authUser.phone_number || "",
      user_type: authUser.user_type,
      gender: authUser.gender || "non_binary",
      username: authUser.username,
      email: authUser.email || "",
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
      toast.success(t("consent_and_files_uploaded"));
      queryClient.invalidateQueries({ queryKey: ["consents", patientId] });
      setIsOpen(false);
      onSuccess?.();
      form.reset();
      fileUpload.clearFiles();
    }
  };

  const hasExistingConsents = Boolean(existingConsents?.results?.length);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
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
            className="mt-4 space-y-4"
          >
            <div className="flex gap-2 flex-col">
              {hasExistingConsents && (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full",
                    form.watch("option") === "existing" &&
                      "bg-primary/5 border-primary",
                  )}
                  onClick={() => {
                    form.setValue("option", "existing");
                    form.setValue("existingConsent", undefined);
                  }}
                >
                  {t("use_existing_consent")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full",
                  form.watch("option") === "new" &&
                    "bg-primary/5 border-primary",
                )}
                onClick={() => {
                  form.setValue("option", "new");
                  form.setValue("existingConsent", undefined);
                }}
              >
                {t("create_new_consent")}
              </Button>
            </div>

            {form.watch("option") === "existing" && hasExistingConsents && (
              <FormField
                control={form.control}
                name="existingConsent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("select_consent")}</FormLabel>
                    <FormControl>
                      <div className="container">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder={t("search_existing_consent")}
                            className="pl-10"
                            value={form.watch("existingConsentSearchQuery")}
                            onChange={(e) =>
                              form.setValue(
                                "existingConsentSearchQuery",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <RadioGroup
                          {...field}
                          value={form.watch("existingConsent")}
                          onValueChange={(value) =>
                            form.setValue("existingConsent", value)
                          }
                        >
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {existingConsents?.results?.map((consent) => (
                              <ConsentRadioItem
                                key={consent.id}
                                consent={consent}
                                selected={
                                  consent.id === form.watch("existingConsent")
                                }
                              />
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("option") === "new" && (
              <>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel required>{t("consent_date")}</FormLabel>
                      <DatePicker
                        date={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period.start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("consent_start_date")}</FormLabel>
                      <DatePicker
                        date={field.value}
                        onChange={field.onChange}
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
                      <FormLabel>{t("consent_end_date")}</FormLabel>
                      <DatePicker
                        date={field.value}
                        onChange={field.onChange}
                      />
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
                          {CONSENT_DECISION_TYPES.map((decision) => (
                            <SelectItem key={decision.id} value={decision.id}>
                              {decision.label}
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
                          {CONSENT_CATEGORY_TYPES.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <p>{category.label}</p>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        <div className="text-xs text-blue-600 bg-blue-100 rounded-md p-2">
                          {
                            CONSENT_CATEGORY_TYPES.find(
                              (category) =>
                                category.id === form.watch("category"),
                            )?.desc
                          }
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
                          {CONSENT_STATUS_TYPES.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.label}
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
                          {VERIFICATION_TYPE_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label}
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
                            className="w-full inline-flex items-center justify-center px-4 py-2 cursor-pointer border rounded-md hover:bg-accent hover:text-accent-foreground"
                          >
                            <CareIcon
                              icon="l-file-upload-alt"
                              className="mr-1"
                            />
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
            )}

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

type ConsentRadioItemProps = {
  consent: ConsentModel;
  selected?: boolean;
};

function ConsentRadioItem({ consent, selected }: ConsentRadioItemProps) {
  const [loadPreview, setLoadPreview] = useState(false);

  const { data: consentFile, isPending } = useQuery({
    queryKey: ["file_upload", consent.source_attachments[0]?.id],
    queryFn: query(routes.retrieveUpload, {
      pathParams: { id: consent.source_attachments[0].id! },
    }),
    enabled: loadPreview && !!consent.source_attachments[0]?.id,
  });

  const fileManager = useFileManager({
    type: "patient",
    uploadedFiles: consentFile ? [consentFile] : [],
  });

  return (
    <div className="relative">
      <Card
        className={cn(
          "overflow-hidden transition-all",
          selected && "ring-2 ring-primary",
        )}
      >
        <div className="absolute top-3 left-3 z-10">
          <RadioGroupItem
            value={consent.id}
            id={consent.id}
            checked={selected}
            className="h-5 w-5"
          />
        </div>
        <CardContent className="p-0 group">
          <div className="aspect-video relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-3 -translate-y-3">
              {!consentFile && loadPreview === false && (
                <Download
                  onClick={() => setLoadPreview(true)}
                  className="text-secondary-800 hidden group-hover:block cursor-pointer animate-bounce"
                />
              )}
              {!consentFile && loadPreview === true && isPending && (
                <Loader2 className="text-secondary-800 cursor-pointer animate-spin" />
              )}
            </div>
            {consentFile ? (
              <div className="h-full w-full object-cover">
                <div className="h-full w-full opacity-30 hover:opacity-100 transition-opacity">
                  <PreviewFile file={consentFile} />
                </div>
                {fileManager.isPreviewable(consentFile) && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 z-20"
                    onClick={() =>
                      fileManager.viewFile(
                        consentFile,
                        consentFile.associating_id!,
                      )
                    }
                  >
                    <CareIcon icon="l-eye" />
                  </Button>
                )}
              </div>
            ) : (
              <img
                src="/images/placeholder.svg"
                alt={consent.category}
                className="object-cover w-full h-full"
              />
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 flex items-center justify-between">
          <Label htmlFor={consent.id} className="font-medium cursor-pointer">
            {t(`consent_category__${consent.category}`)} -{" "}
            {new Date(consent.date).toLocaleDateString()}
          </Label>
        </CardFooter>
      </Card>

      {fileManager.Dialogues}
    </div>
  );
}

type PreviewFileProps = {
  file: FileUploadModel;
};

function PreviewFile({ file }: PreviewFileProps) {
  if (!file.read_signed_url) {
    return null;
  }

  if (file.mime_type === "application/pdf") {
    return (
      <PDFViewer
        url={file.read_signed_url}
        pageNumber={1}
        onDocumentLoadSuccess={() => {}}
        scale={1}
        className="object-cover w-full h-full !overflow-hidden"
      />
    );
  }

  if (file.mime_type?.startsWith("image")) {
    return (
      <img
        src={file.read_signed_url}
        alt={file.name}
        className="object-cover w-full h-full"
      />
    );
  }

  return (
    <iframe
      src={file.read_signed_url}
      title={file.name}
      className="object-cover w-full h-full"
    />
  );
}
