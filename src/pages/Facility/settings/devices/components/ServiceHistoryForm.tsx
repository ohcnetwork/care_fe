import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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

interface Props {
  facilityId: string;
  deviceId: string;
  serviceRecord?: ServiceHistory | null;
  onSubmitSuccess?: (serviceRecord: ServiceHistory) => void;
}

export default function ServiceHistoryForm({
  facilityId,
  deviceId,
  serviceRecord,
  onSubmitSuccess,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = !!serviceRecord;

  const formSchema = z.object({
    note: z.string().min(1, { message: t("notes_required") }),
    serviced_on: z.date({ required_error: t("date_required") }),
  });

  type FormValues = z.infer<typeof formSchema>;

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
    }
  }, [serviceRecord, form]);

  const { mutate: createServiceRecord, isPending: createPending } = useMutation(
    {
      mutationKey: ["create_service_record"],
      mutationFn: mutate(deviceApi.createServiceHistory, {
        pathParams: {
          facilityId,
          deviceId,
        },
      }),
      onSuccess: (resp: ServiceHistory) => {
        toast.success(t("service_record_added_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["deviceServiceHistory", facilityId, deviceId],
        });
        form.reset();
        onSubmitSuccess?.(resp);
      },
      onError: (error) => {
        toast.error(error?.message ?? t("service_record_add_error"));
      },
    },
  );

  const { mutate: updateServiceRecord, isPending: updatePending } = useMutation(
    {
      mutationKey: ["update_service_record"],
      mutationFn: mutate(deviceApi.updateServiceHistory, {
        pathParams: {
          facilityId,
          deviceId,
          id: serviceRecord?.id,
        },
      }),
      onSuccess: (resp: ServiceHistory) => {
        toast.success(t("service_record_updated_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["deviceServiceHistory", facilityId, deviceId],
        });
        form.reset();
        onSubmitSuccess?.(resp);
      },
      onError: (error) => {
        toast.error(error?.message ?? t("service_record_update_error"));
      },
    },
  );

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      serviced_on: values.serviced_on.toISOString(),
      meta: serviceRecord?.meta || {},
    };

    if (isEditMode) {
      updateServiceRecord(payload);
    } else {
      createServiceRecord(payload);
    }
  };

  const isPending = createPending || updatePending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviced_on"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel required>{t("service_date")}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                      data-cy="service-date-select"
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
              <FormLabel required>{t("service_notes")}</FormLabel>
              <FormControl>
                <Textarea
                  data-cy="service-notes-input"
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
            onClick={() => onSubmitSuccess?.(serviceRecord as ServiceHistory)}
            data-cy="cancel-button"
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending} data-cy="submit-button">
            {isPending
              ? isEditMode
                ? t("updating")
                : t("saving")
              : isEditMode
                ? t("update")
                : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
