import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { MedicationRequestItem } from "@/components/Questionnaire/QuestionTypes/MedicationQuestion";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import {
  MEDICATION_REQUEST_STATUS_REASON,
  MedicationRequest,
} from "@/types/emr/medicationRequest";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Props {
  prescription: MedicationRequest;
  onClose: (success: boolean) => void;
}

export default function DiscontinueMedication({
  prescription,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const patientId = useSlug("patient");

  const formSchema = z.object({
    reason: z.enum(MEDICATION_REQUEST_STATUS_REASON),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { res } = await request(routes.medicationRequest.discontinue, {
      pathParams: { patientId, id: prescription.id! },
      body: {
        status_reason: values.reason,
      },
    });

    if (res?.ok) {
      onClose(true);
      return;
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="flex gap-2 items-center w-full"
          variant="destructive"
        >
          <CareIcon icon="l-ban" className="text-lg" />
          {t("discontinue")}
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
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discontinuation Reason</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEDICATION_REQUEST_STATUS_REASON.map((reason) => (
                          <SelectItem value={reason} key={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button onClick={() => onClose(false)} variant="secondary">
                  {t("cancel")}
                </Button>
                <Button type="submit" variant="destructive">
                  {t("discontinue")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
