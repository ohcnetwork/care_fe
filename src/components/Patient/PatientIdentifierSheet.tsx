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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import patientIdentifierConfigApi from "@/types/patient/patientIdentifierConfig/patientIdentifierConfigApi";

const identifierSchema = z.object({
  config: z.string().min(1, "Please select a config"),
  value: z.string().min(1, "Value is required"),
});

interface PatientIdentifierSheetProps {
  patientId: string;
  trigger: React.ReactNode;
  canWrite?: boolean;
}

export default function PatientIdentifierSheet({
  patientId,
  trigger,
  canWrite = false,
}: PatientIdentifierSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: configs } = useQuery({
    queryKey: ["patientIdentifierConfig"],
    queryFn: query(patientIdentifierConfigApi.listPatientIdentifierConfig),
  });

  const form = useForm<z.infer<typeof identifierSchema>>({
    resolver: zodResolver(identifierSchema),
    defaultValues: {
      config: "",
      value: "",
    },
  });

  const { mutate: updateIdentifier, isPending } = useMutation({
    mutationFn: mutate(patientIdentifierConfigApi.updatePatientIdentifier, {
      pathParams: { external_id: patientId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      form.reset();
    },
  });

  const onSubmit = (values: z.infer<typeof identifierSchema>) => {
    updateIdentifier(values);
  };

  if (!canWrite) {
    return <div>{trigger}</div>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("manage_patient_identifiers")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="config"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("identifier_config")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_config")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {configs?.results?.map(
                          (config: PatientIdentifierConfig) => (
                            <SelectItem key={config.id} value={config.id || ""}>
                              {config.config.display}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("identifier_value")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("enter_identifier_value")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("updating") : t("update_identifier")}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
