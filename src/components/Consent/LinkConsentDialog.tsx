import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const consentFormSchema = z.object({
  option: z.enum(["existing", "new"] as const).optional(),
  existingConsent: z.string().optional(),
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
  const [isNewConsent, setIsNewConsent] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const queryClient = useQueryClient();
  const authUser = useAuthUser();

  const fileUpload = useFileUpload({
    type: "consent",
    category: "consent_attachment",
    multiple: true,
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
      option: "existing",
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
      // Handle linking existing consent
      if (!values.existingConsent) {
        toast.error(t("please_select_a_consent"));
        return;
      }
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
      ...values,
      decision: "permit",
      encounter: encounterId,
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
      // When dialog is closed, we're done with the whole flow
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
                  className="w-full peer-aria-checked:border-primary peer-aria-checked:bg-primary/5"
                  onClick={() => {
                    setIsNewConsent(false);
                    form.setValue("option", "existing");
                    form.setValue("existingConsent", "");
                  }}
                >
                  {t("use_existing_consent")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full peer-aria-checked:border-primary peer-aria-checked:bg-primary/5"
                onClick={() => {
                  setIsNewConsent(true);
                  form.setValue("option", "new");
                  form.setValue("existingConsent", "");
                }}
              >
                {t("create_new_consent")}
              </Button>
            </div>

            {!isNewConsent && hasExistingConsents && (
              <FormField
                control={form.control}
                name="existingConsent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("select_consent")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("select_existing_consent")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingConsents?.results?.map(
                          (consent: ConsentModel) => (
                            <SelectItem key={consent.id} value={consent.id}>
                              {t(`consent_category__${consent.category}`)} -{" "}
                              {new Date(consent.date).toLocaleDateString()}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isNewConsent && (
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
                      <FormLabel required>{t("consent_start_date")}</FormLabel>
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
                      <FormLabel required>{t("consent_end_date")}</FormLabel>
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
                      <FormLabel>{t("consent_decision")}</FormLabel>
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
                            <SelectValue placeholder={t("select_category")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONSENT_CATEGORY_TYPES.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-xs text-blue-600 bg-blue-100 rounded-md p-2">
                  {
                    CONSENT_CATEGORY_TYPES.find(
                      (category) => category.id === form.watch("category"),
                    )?.desc
                  }
                </div>

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

                <Label
                  htmlFor={`file_upload_consent`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 cursor-pointer border rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  <CareIcon icon="l-file-upload-alt" className="mr-1" />
                  <span
                    className="truncate"
                    title={fileUpload.files.map((file) => file.name).join(", ")}
                  >
                    {fileUpload.files.length > 0
                      ? fileUpload.files.map((file) => file.name).join(", ")
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
