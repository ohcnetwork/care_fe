import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import { ServiceHistory } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
  deviceId: string;
  serviceRecord?: ServiceHistory | null;
  onSubmitSuccess: (serviceRecord: ServiceHistory) => void;
}

export default function ServiceHistoryForm({
  facilityId,
  deviceId,
  serviceRecord,
  onSubmitSuccess,
}: Props) {
  const { t } = useTranslation();
  const isEditMode = !!serviceRecord;

  const formSchema = z.object({
    note: z.string().min(1, { message: t("field_required") }),
    serviced_on: z
      .date({ required_error: t("field_required") })
      .max(dayjs().toDate(), {
        message: t("service_date_min_date"),
      }),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm({
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

  const { mutate: createService, isPending: isCreatePending } = useMutation({
    mutationKey: ["create_service_record"],
    mutationFn: mutate(deviceApi.serviceHistory.create, {
      pathParams: {
        facilityId,
        deviceId,
      },
    }),
    onSuccess: (resp: ServiceHistory) => {
      toast.success(t("service_record_added_successfully"));
      form.reset();
      onSubmitSuccess(resp);
    },
  });

  const { mutate: updateService, isPending: isUpdatePending } = useMutation({
    mutationKey: ["update_service_record"],
    mutationFn: mutate(deviceApi.serviceHistory.update, {
      pathParams: {
        facilityId,
        deviceId,
        id: serviceRecord?.id,
      },
    }),
    onSuccess: (resp: ServiceHistory) => {
      toast.success(t("service_record_updated_successfully"));
      form.reset();
      onSubmitSuccess(resp);
    },
  });

  const isPending = isCreatePending || isUpdatePending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      serviced_on: values.serviced_on.toISOString(),
    };

    if (isEditMode) {
      updateService(payload);
    } else {
      createService(payload);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviced_on"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel aria-required>{t("service_date")}</FormLabel>
              <DatePicker date={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("service_notes")}</FormLabel>
              <FormControl>
                <Textarea
                  data-cy="service-notes-input"
                  placeholder={t("service_notes_placeholder")}
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
            type="submit"
            disabled={!form.formState.isDirty || isPending}
            data-cy="submit-button"
          >
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
