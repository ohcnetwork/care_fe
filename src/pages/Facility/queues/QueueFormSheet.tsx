import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SchedulableResourceType } from "@/types/scheduling/schedule";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import dayjs from "dayjs";

const createQueueFormSchema = z.object({
  name: z.string().min(1, "Queue name is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  set_is_primary: z.boolean(),
});

const editQueueFormSchema = z.object({
  name: z.string().min(1, "Queue name is required"),
  date: z.date().optional(),
  set_is_primary: z.boolean().optional(),
});

type CreateQueueFormData = z.infer<typeof createQueueFormSchema>;
type EditQueueFormData = z.infer<typeof editQueueFormSchema>;
type QueueFormData = CreateQueueFormData | EditQueueFormData;

interface QueueFormSheetProps {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  queueId?: string; // If provided, we're in edit mode
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  initialDate?: Date;
}

export default function QueueFormSheet({
  facilityId,
  resourceType,
  resourceId,
  queueId,
  trigger,
  onSuccess,
  initialDate,
}: QueueFormSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const isEditMode = Boolean(queueId);

  const form = useForm<QueueFormData>({
    resolver: zodResolver(
      isEditMode ? editQueueFormSchema : createQueueFormSchema,
    ),
    defaultValues: {
      name: "",
      date: initialDate,
      set_is_primary: false,
    },
  });

  // Fetch queue data for editing
  const { data: queue, isLoading } = useQuery({
    queryKey: ["tokenQueue", facilityId, queueId],
    queryFn: query(tokenQueueApi.get, {
      pathParams: { facility_id: facilityId, id: queueId! },
    }),
    enabled: isEditMode && isOpen,
  });

  // Update form when queue data is loaded (edit mode)
  useEffect(() => {
    if (queue && isEditMode) {
      form.reset({
        name: queue.name,
        date: new Date(queue.date),
        set_is_primary: queue.is_primary,
      });
    }
  }, [queue, isEditMode, form]);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: "",
        date: initialDate,
        set_is_primary: false,
      });
    }
  }, [isOpen, form, initialDate]);

  const { mutate: createQueue, isPending: isCreating } = useMutation({
    mutationFn: mutate(tokenQueueApi.create, {
      pathParams: { facility_id: facilityId },
    }),
    onSuccess: () => {
      toast.success(t("queue_created_successfully"));
      setIsOpen(false);
      onSuccess?.();
      queryClient.invalidateQueries({
        queryKey: ["tokenQueues", facilityId],
      });
    },
  });

  const { mutate: updateQueue, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenQueueApi.update, {
      pathParams: { facility_id: facilityId, id: queueId! },
    }),
    onSuccess: () => {
      toast.success(t("queue_updated_successfully"));
      setIsOpen(false);
      onSuccess?.();
      queryClient.invalidateQueries({
        queryKey: ["tokenQueues", facilityId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tokenQueue", facilityId, queueId],
      });
    },
  });

  const onSubmit = (data: QueueFormData) => {
    if (isEditMode) {
      updateQueue({ name: data.name });
    } else {
      createQueue({
        name: data.name,
        date: dateQueryString(data.date),
        resource_type: resourceType,
        resource_id: resourceId,
        set_is_primary: data.set_is_primary ?? false,
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const isPending = isCreating || isUpdating;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="size-4 mr-2" />
            {isEditMode ? t("edit") : t("create_queue")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? t("edit_queue") : t("create_queue")}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? t("edit_queue_description")
              : t("create_queue_description")}
          </SheetDescription>
        </SheetHeader>

        {isEditMode && isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.error("Form validation errors:", errors);
              })}
              className="space-y-6 mt-6"
            >
              {/* Queue Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("queue_name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("enter_queue_name")}
                        {...field}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date - Only show in create mode */}
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("date")}</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onChange={field.onChange}
                          disabled={(date) =>
                            dayjs(date).isBefore(dayjs(), "day")
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Set as Primary - Only show in create mode */}
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="set_is_primary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t("set_as_primary")}</FormLabel>
                        <p className="text-sm text-gray-600">
                          {t("set_as_primary_description")}
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditMode ? t("updating") : t("creating")}
                  </>
                ) : isEditMode ? (
                  t("update_queue")
                ) : (
                  t("create_queue")
                )}
              </Button>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
