import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import { ServiceHistory } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

interface ServiceHistoryFormProps {
  facilityId: string;
  deviceId: string;
  serviceRecord?: ServiceHistory | null;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  note: z.string().min(1, { message: "Notes are required" }),
  serviced_on: z.date({ required_error: "Service date is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ServiceHistoryForm({
  facilityId,
  deviceId,
  serviceRecord,
  onOpenChange,
}: ServiceHistoryFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      serviced_on: new Date(),
    },
  });

  useEffect(() => {
    if (serviceRecord) {
      form.reset({
        note: serviceRecord.note,
        serviced_on: new Date(serviceRecord.serviced_on),
      });
    } else {
      form.reset({
        note: "",
        serviced_on: new Date(),
      });
    }
  }, [serviceRecord, form]);

  const createMutation = useMutation({
    mutationFn: mutate(deviceApi.serviceHistory.create, {
      pathParams: {
        facility_external_id: facilityId,
        device_external_id: deviceId,
      },
    }),
    onError: (error) => {
      console.error("Failed to create service record:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["device", facilityId, deviceId],
      });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: mutate(deviceApi.serviceHistory.update, {
      pathParams: {
        facility_external_id: facilityId,
        device_external_id: deviceId,
        external_id: serviceRecord?.id,
      },
    }),
    onError: (error) => {
      console.error("Failed to update service record:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["device", facilityId, deviceId],
      });
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      serviced_on: values.serviced_on.toISOString(),
      meta: serviceRecord?.meta || {},
    };

    if (serviceRecord) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviced_on"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("service_date")}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t("select_date")}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("service_notes")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("service_notes_enter")}
                  {...field}
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? serviceRecord
                ? t("updating")
                : t("saving")
              : serviceRecord
                ? t("update")
                : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
