import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
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

import NoActiveAccountWarningDialog from "@/pages/Facility/billing/account/components/NoActiveAccountWarningDialog";
import { PatientListRead } from "@/types/emr/patient/patient";
import {
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import mutate from "@/Utils/request/mutate";

const medicationReturnSchema = z.object({
  name: z.string().min(1, "Name is required"),
  note: z.string().optional(),
});

interface MedicationReturnSheetProps {
  facilityId: string;
  locationId: string;
  patient: PatientListRead;
  trigger?: React.ReactNode;
  onSuccess?: (deliveryOrder: DeliveryOrderRetrieve) => void;
}

export function MedicationReturnSheet({
  facilityId,
  locationId,
  patient,
  trigger,
  onSuccess,
}: MedicationReturnSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  type FormValues = z.infer<typeof medicationReturnSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(medicationReturnSchema),
    defaultValues: {
      name: "",
      note: "",
    },
  });

  const { mutate: createDeliveryOrder, isPending: isCreating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.createDeliveryOrder, {
      pathParams: { facilityId },
    }),
    onSuccess: (deliveryOrder: DeliveryOrderRetrieve) => {
      queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
      toast.success("Medication return created successfully");
      setIsOpen(false);
      form.reset();
      onSuccess?.(deliveryOrder);
    },
    onError: () => {
      toast.error("Error creating medication return");
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: `Medication Return - ${patient.name}`,
        note: "",
      });
    }
  }, [isOpen, patient.name, form]);

  function onSubmit(data: FormValues) {
    createDeliveryOrder({
      name: data.name,
      note: data.note,
      destination: locationId, // Return TO current location
      patient: patient.id,
      status: DeliveryOrderStatus.draft,
      extensions: {},
    });
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <RotateCcw className="size-4" />
            {t("medication_return")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("create_medication_return")}</SheetTitle>
          <SheetDescription>
            {t("create_medication_return_description", {
              patientName: patient.name,
            })}
          </SheetDescription>
        </SheetHeader>

        <NoActiveAccountWarningDialog
          patientId={patient.id}
          facilityId={facilityId}
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
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
      </SheetContent>
    </Sheet>
  );
}
