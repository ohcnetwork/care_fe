import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import RadioInput from "@/components/ui/RadioInput";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import {
  TokenSubQueueStatus,
  TokenSubQueueUpdate,
} from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

const createSubQueueFormSchema = z.object({
  name: z.string().trim().min(1, "Service point name is required"),
  status: z.enum(TokenSubQueueStatus),
});

const editSubQueueFormSchema = z.object({
  name: z.string().trim().min(1, "Service point name is required"),
  status: z.enum(TokenSubQueueStatus),
});

type CreateSubQueueFormData = z.infer<typeof createSubQueueFormSchema>;
type EditSubQueueFormData = z.infer<typeof editSubQueueFormSchema>;
type SubQueueFormData = CreateSubQueueFormData | EditSubQueueFormData;

interface SubQueueFormSheetProps {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  subQueueId?: string; // If provided, we're in edit mode
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function SubQueueFormSheet({
  facilityId,
  resourceType,
  resourceId,
  subQueueId,
  trigger,
  onSuccess,
}: SubQueueFormSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const isEditMode = Boolean(subQueueId);

  const form = useForm<SubQueueFormData>({
    resolver: zodResolver(
      isEditMode ? editSubQueueFormSchema : createSubQueueFormSchema,
    ),
    defaultValues: {
      name: "",
      status: TokenSubQueueStatus.ACTIVE,
    },
  });

  // Fetch sub-queue data for editing
  const { data: subQueue, isLoading } = useQuery({
    queryKey: ["tokenSubQueue", facilityId, subQueueId],
    queryFn: query(tokenSubQueueApi.get, {
      pathParams: { facility_id: facilityId, id: subQueueId! },
    }),
    enabled: isEditMode && isOpen,
  });

  // Update form when sub-queue data is loaded (edit mode)
  useEffect(() => {
    if (subQueue && isEditMode) {
      form.reset({
        name: subQueue.name,
        status: subQueue.status,
      });
    }
  }, [subQueue, isEditMode, form]);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (!isOpen && !isEditMode) {
      form.reset({
        name: "",
        status: TokenSubQueueStatus.ACTIVE,
      });
    }
  }, [isOpen, form, isEditMode]);

  const { mutate: createSubQueue, isPending: isCreating } = useMutation({
    mutationFn: mutate(tokenSubQueueApi.create, {
      pathParams: { facility_id: facilityId },
    }),
    onSuccess: () => {
      toast.success(t("service_point_created_successfully"));
      setIsOpen(false);
      onSuccess?.();
      queryClient.invalidateQueries({
        queryKey: ["tokenSubQueues", facilityId],
      });
    },
  });

  const { mutate: updateSubQueue, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenSubQueueApi.update, {
      pathParams: { facility_id: facilityId, id: subQueueId! },
    }),
    onSuccess: () => {
      toast.success(t("service_point_updated_successfully"));
      setIsOpen(false);
      onSuccess?.();
      queryClient.invalidateQueries({
        queryKey: ["tokenSubQueues", facilityId],
      });
    },
    onError: (error) => {
      toast.error(error?.message || t("failed_to_update_service_point"));
    },
  });

  const isPending = isCreating || isUpdating;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const onSubmit = (data: SubQueueFormData) => {
    if (isEditMode) {
      updateSubQueue(data as TokenSubQueueUpdate);
    } else {
      createSubQueue({
        ...data,
        resource_type: resourceType,
        resource_id: resourceId,
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="size-4 mr-2" />
            {isEditMode ? t("edit") : t("add_service_point")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? t("edit_service_point") : t("add_service_point")}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? t("edit_service_point_description")
              : t("add_service_point_description")}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {isEditMode && isLoading ? (
            <FormSkeleton rows={2} />
          ) : (
            <Form {...form}>
              <form id="sub-queue-form" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("service_point_name")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("enter_service_point_name")}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("status")}</FormLabel>
                        <RadioInput
                          {...field}
                          options={Object.values(TokenSubQueueStatus).map(
                            (status) => ({
                              label: t(status),
                              value: status,
                            }),
                          )}
                          onValueChange={field.onChange}
                          value={field.value}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="sub-queue-form"
            disabled={
              isLoading || isPending || (isEditMode && !form.formState.isDirty)
            }
          >
            {isPending ? t("saving") : isEditMode ? t("update") : t("create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
