import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

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
import { Switch } from "@/components/ui/switch";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  PatientIdentifierConfigCreate,
  PatientIdentifierConfigStatus,
  PatientIdentifierConfigUpdate,
  PatientIdentifierUse,
} from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import patientIdentifierConfigApi from "@/types/patient/patientIdentifierConfig/patientIdentifierConfigApi";

const formSchema = z.object({
  config: z.object({
    use: z.nativeEnum(PatientIdentifierUse),
    description: z.string().min(1, "Description is required"),
    system: z.string().min(1, "System is required"),
    required: z.boolean(),
    unique: z.boolean(),
    regex: z.string(),
    display: z.string().min(1, "Display is required"),
    retrieve_config: z.object({
      retrieve_with_dob: z.boolean(),
      retrieve_with_year_of_birth: z.boolean(),
      retrieve_with_otp: z.boolean(),
      retrieve_without_extra: z.boolean(),
    }),
  }),
  status: z.nativeEnum(PatientIdentifierConfigStatus),
  facility: z.string().nullable(),
});

interface PatientIdentifierConfigFormProps {
  facilityId?: string;
  configId?: string;
  onSuccess?: () => void;
}

export default function PatientIdentifierConfigForm({
  facilityId,
  configId,
  onSuccess,
}: PatientIdentifierConfigFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["patientIdentifierConfig", configId, facilityId],
    queryFn: query(patientIdentifierConfigApi.retrievePatientIdentifierConfig, {
      pathParams: { external_id: configId || "" },
    }),
    enabled: !!configId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: config
      ? {
          config: config.config,
          status: config.status,
          facility: config.facility,
        }
      : {
          config: {
            use: PatientIdentifierUse.usual,
            description: "",
            system: "",
            required: false,
            unique: false,
            regex: "",
            display: "",
            retrieve_config: {
              retrieve_with_dob: false,
              retrieve_with_year_of_birth: false,
              retrieve_with_otp: false,
              retrieve_without_extra: false,
            },
          },
          status: PatientIdentifierConfigStatus.draft,
          facility: facilityId || null,
        },
  });

  const { mutate: createConfig, isPending: isCreating } = useMutation({
    mutationFn: mutate(
      patientIdentifierConfigApi.createPatientIdentifierConfig,
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientIdentifierConfig"] });
      onSuccess?.();
    },
  });

  const { mutate: updateConfig, isPending: isUpdating } = useMutation({
    mutationFn: mutate(
      patientIdentifierConfigApi.updatePatientIdentifierConfig,
      {
        pathParams: { external_id: config?.id || "" },
      },
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientIdentifierConfig"] });
      onSuccess?.();
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (config) {
      updateConfig(values as PatientIdentifierConfigUpdate);
    } else {
      createConfig(values as PatientIdentifierConfigCreate);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="config.use"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("use")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_use")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(PatientIdentifierUse).map((use) => (
                    <SelectItem key={use} value={use}>
                      {t(use)}
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
          name="config.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.system"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("system")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.regex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("regex")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config.display"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("display")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(PatientIdentifierConfigStatus).map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {t(status)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t("retrieve_config")}</h3>
          <FormField
            control={form.control}
            name="config.retrieve_config.retrieve_with_dob"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("retrieve_with_dob")}
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.retrieve_config.retrieve_with_year_of_birth"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("retrieve_with_year_of_birth")}
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.retrieve_config.retrieve_with_otp"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("retrieve_with_otp")}
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.retrieve_config.retrieve_without_extra"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("retrieve_without_extra")}
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{t("required")}</FormLabel>
          </div>
          <FormField
            control={form.control}
            name="config.required"
            render={({ field }) => (
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{t("unique")}</FormLabel>
          </div>
          <FormField
            control={form.control}
            name="config.unique"
            render={({ field }) => (
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isCreating || isUpdating}
        >
          {config ? t("update") : t("create")}
        </Button>
      </form>
    </Form>
  );
}
