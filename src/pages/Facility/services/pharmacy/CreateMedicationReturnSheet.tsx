import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { PatientIdentifierSelector } from "@/components/Patient/PatientIdentifierSelector";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import NoActiveAccountWarningDialog from "@/pages/Facility/billing/account/components/NoActiveAccountWarningDialog";
import {
  PartialPatientModel,
  PatientListRead,
} from "@/types/emr/patient/patient";
import {
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

const medicationReturnSchema = z.object({
  name: z.string().min(1, "Name is required"),
  note: z.string().optional(),
});

interface CreateMedicationReturnSheetProps {
  facilityId: string;
  locationId: string;
  trigger?: React.ReactNode;
}

export function CreateMedicationReturnSheet({
  facilityId,
  locationId,
  trigger,
}: CreateMedicationReturnSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    PatientListRead | PartialPatientModel | null
  >(null);

  type FormValues = z.infer<typeof medicationReturnSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(medicationReturnSchema),
    defaultValues: {
      name: "",
      note: "",
    },
  });

  useShortcutSubContext("facility:pharmacy");

  const { mutate: createDeliveryOrder, isPending: isCreating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.createDeliveryOrder, {
      pathParams: { facilityId },
    }),
    onSuccess: (deliveryOrder: DeliveryOrderRetrieve) => {
      queryClient.invalidateQueries({ queryKey: ["medicationReturns"] });
      toast.success(t("medication_return_created"));
      setIsOpen(false);
      resetState();
      // Navigate to the new medication return
      navigate(
        `/facility/${facilityId}/locations/${locationId}/medication_return/order/${deliveryOrder.id}`,
      );
    },
    onError: () => {
      toast.error(t("error_creating_medication_return"));
    },
  });

  const resetState = () => {
    setSelectedPatient(null);
    form.reset();
  };

  const handlePatientSelect = useCallback(
    (patient: PatientListRead | PartialPatientModel) => {
      setSelectedPatient(patient);
      form.reset({
        name: `${t("medication_return")} - ${patient.name}`,
        note: "",
      });
    },
    [form, t],
  );

  const handleClearPatient = useCallback(() => {
    setSelectedPatient(null);
    form.reset({ name: "", note: "" });
  }, [form]);

  function onSubmit(data: FormValues) {
    if (!selectedPatient) {
      toast.error(t("select_patient_first"));
      return;
    }
    createDeliveryOrder({
      name: data.name,
      note: data.note,
      destination: locationId,
      patient: selectedPatient.id,
      status: DeliveryOrderStatus.draft,
      extensions: {},
    });
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetState();
      }}
    >
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="size-4 mr-1" />
            {t("create_medication_return")}
            <ShortcutBadge actionId="medication-return" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("create_medication_return")}</SheetTitle>
          <SheetDescription>
            {selectedPatient
              ? t("create_medication_return_description", {
                  patientName: selectedPatient.name,
                })
              : t("select_patient_to_create_return")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <PatientIdentifierSelector
            facilityId={facilityId}
            selectedPatient={selectedPatient}
            onPatientSelect={handlePatientSelect}
            onClearPatient={handleClearPatient}
          />

          {selectedPatient && (
            <>
              <NoActiveAccountWarningDialog
                patientId={selectedPatient.id}
                facilityId={facilityId}
              />
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <Card className="p-0 bg-gray-50">
                    <CardContent className="space-y-4 p-4 rounded-md">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("name")}</FormLabel>
                            <FormControl>
                              <Input
                                className="h-9"
                                placeholder={t("enter_return_name")}
                                {...field}
                                autoFocus
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("note")}
                              <span className="text-gray-500 text-sm italic">
                                {" "}
                                ({t("optional")})
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder={t("enter_return_note")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <SheetFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? t("creating") : t("create_return")}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
