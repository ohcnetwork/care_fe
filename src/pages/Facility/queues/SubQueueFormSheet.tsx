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
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  name: z.string().min(1, "Service point name is required"),
  status: z.nativeEnum(TokenSubQueueStatus),
});

const editSubQueueFormSchema = z.object({
  name: z.string().min(1, "Service point name is required"),
  status: z.nativeEnum(TokenSubQueueStatus),
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
  }, [isOpen, form]);

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
      <SheetContent className="overflow-y-auto">
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

        {isEditMode && isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending
                    ? t("saving")
                    : isEditMode
                      ? t("update")
                      : t("create")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
