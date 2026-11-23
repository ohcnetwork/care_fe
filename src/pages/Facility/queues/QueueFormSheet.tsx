import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

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
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import dayjs from "dayjs";

const createQueueFormSchema = z.object({
  name: z.string().trim().min(1, "Queue name is required"),
  date: z.date({
    error: "Date is required",
  }),
});

const editQueueFormSchema = z.object({
  name: z.string().trim().min(1, "Queue name is required"),
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function QueueFormSheet({
  facilityId,
  resourceType,
  resourceId,
  queueId,
  trigger,
  onSuccess,
  initialDate,
  open,
  onOpenChange,
}: QueueFormSheetProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();

  const isEditMode = Boolean(queueId);

  const form = useForm<QueueFormData>({
    resolver: zodResolver(
      isEditMode ? editQueueFormSchema : createQueueFormSchema,
    ),
    defaultValues: {
      name: "",
      date: initialDate,
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
        date: parseISO(queue.date),
      });
    }
  }, [queue, isEditMode, form, isOpen]);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: "",
        date: initialDate,
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
    if (!isEditMode && "date" in data) {
      createQueue({
        name: data.name,
        date: dateQueryString(data.date),
        resource_type: resourceType,
        resource_id: resourceId,
      });
    }
    if (isEditMode) {
      updateQueue({ name: data.name });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const isPending = isCreating || isUpdating;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {(trigger || open === undefined) && (
        <SheetTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="size-4 mr-2" />
              {isEditMode ? t("edit") : t("create_queue")}
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent className="overflow-hidden">
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

        <SheetBody>
          {isEditMode && isLoading ? (
            <FormSkeleton rows={1} />
          ) : (
            <Form {...form}>
              <form id="queue-form" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
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
                </div>
              </form>
            </Form>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            type="submit"
            form="queue-form"
            disabled={isLoading || isPending || !form.formState.isDirty}
          >
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
