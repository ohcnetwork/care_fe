import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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

import useAuthUser from "@/hooks/useAuthUser";
import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { displayDoseRange } from "@/Utils/utils";
import { MedicationAdministration } from "@/types/emr/medicationAdministration";
import { MedicationRequest } from "@/types/emr/medicationRequest";

import { useEncounter } from "../Facility/ConsultationDetails/EncounterContext";
import { MedicationRequestItem } from "../Questionnaire/QuestionTypes/MedicationRequestQuestion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

interface Props {
  prescription: MedicationRequest;
  onClose: (success: boolean) => void;
}

export default function AdministerMedicine({ prescription, onClose }: Props) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();

  const doseAndRate = prescription.dosage_instruction[0].dose_and_rate!;
  const requiresDosage = doseAndRate.type === "calculated";

  const formSchema = z
    .object({
      dosageValue: z.number().optional(),
      allowCustomTime: z.boolean(),
      time: z.date().optional(),
      note: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (requiresDosage) {
        if (data.dosageValue === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Dosage value is required in this case",
            path: ["dosageValue"],
          });

          return data;
        }

        if (
          data.dosageValue > doseAndRate.dose_range!.high.value! ||
          data.dosageValue < doseAndRate.dose_range!.low.value!
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Dosage value is out of range",
            path: ["dosageValue"],
          });

          return data;
        }
      }

      if (data.allowCustomTime) {
        if (!data.time) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Time is required when custom time is enabled",
            path: ["time"],
          });
          return data;
        }

        if (data.time > new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "The time of administration can't be in future",
            path: ["time"],
          });
          return data;
        }
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: new Date(),
      note: "",
      dosageValue: undefined,
      allowCustomTime: false,
    },
  });

  const { mutate: administerMedication } = useMutation({
    mutationFn: async (body: MedicationAdministration) =>
      mutate(routes.medicationAdministration.create, {
        pathParams: { patientId: patient!.id },
        body,
      }),
    onSuccess: () => onClose(true),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const time = values.time ?? new Date();
    const doseValue = values.dosageValue ?? doseAndRate.dose_quantity?.value;
    const doseUnit =
      doseAndRate.dose_quantity?.unit ?? doseAndRate.dose_range?.low.unit;

    administerMedication({
      encounter: encounterId,
      request: prescription.id!,
      status: "completed",
      category: "inpatient",
      medication: prescription.medication!,
      authored_on: prescription.authored_on!,
      recorded: new Date().toISOString(),
      performer: [
        {
          actor: authUser.external_id,
          function: "performer",
        },
      ],
      occurrence_period_start: time.toISOString(),
      occurrence_period_end: time.toISOString(),
      note: values.note,
      dosage: {
        text: prescription.dosage_instruction[0].text,
        site: prescription.dosage_instruction[0].site,
        route: prescription.dosage_instruction[0].route,
        method: prescription.dosage_instruction[0].method,
        dose: {
          value: doseValue!,
          unit: doseUnit!,
        },
      },
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white flex gap-2 items-center w-full">
          <CareIcon icon="l-syringe" className="text-lg" />
          {t("administer")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("administer_medicine")}</DialogTitle>
          <DialogDescription>
            {/* <div className="text-sm font-semibold leading-relaxed text-secondary-600">
              <CareIcon icon="l-history-alt" className="pr-1" /> Last
              administered
              <span className="whitespace-nowrap pl-2">
                <CareIcon icon="l-clock" />{" "}
                {prescription.last_administration?.administered_date
                  ? formatDateTime(
                      prescription.last_administration.administered_date,
                    )
                  : t("never")}
              </span>
              {prescription.dosage_type === "TITRATED" && (
                <span className="whitespace-nowrap pl-2">
                  <CareIcon icon="l-syringe" /> {t("dosage")}
                  {":"} {prescription.last_administration?.dosage ?? "NA"}
                </span>
              )}
              <span className="whitespace-nowrap pl-2">
                <CareIcon icon="l-user" /> Administered by:{" "}
                {prescription.last_administration?.administered_by?.username ??
                  "NA"}
              </span>
            </div> */}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-8">
          <Card>
            <CardContent>
              <MedicationRequestItem medication={prescription} disabled />
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="dosageValue"
                render={({ field }) => (
                  <FormItem hidden={!requiresDosage}>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Dosage (in ${doseAndRate.dose_range?.low.unit})`}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Dosage should be within the range of{" "}
                      {displayDoseRange(doseAndRate.dose_range!)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormField
                  disabled={!form.getValues("allowCustomTime")}
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Administration Time</FormLabel>
                      <FormControl>
                        <DateTimePicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowCustomTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              form.setValue("time", new Date());
                            }

                            field.onChange(!field.value);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Administer in the past</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button onClick={() => onClose(false)} variant="secondary">
                  {t("cancel")}
                </Button>
                <Button type="submit" className="bg-primary">
                  {t("administer")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
