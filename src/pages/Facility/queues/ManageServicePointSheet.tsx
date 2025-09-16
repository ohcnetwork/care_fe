import { Check, Edit, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SchedulableResourceType } from "@/types/scheduling/schedule";
import {
  TokenSubQueueRead,
  TokenSubQueueStatus,
} from "@/types/tokens/tokenSubQueue/tokenSubQueue";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RadioInput from "@/components/ui/RadioInput";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SubQueueFormSheet from "./SubQueueFormSheet";

interface ManageServicePointSheetProps {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  trigger?: React.ReactNode;
  subQueues: TokenSubQueueRead[];
  onSuccess?: () => void;
}

export default function ManageServicePointSheet({
  facilityId,
  resourceType,
  resourceId,
  trigger,
  subQueues,
  onSuccess,
}: ManageServicePointSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    onSuccess?.();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="size-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("manage_service_points")}</SheetTitle>
        </SheetHeader>
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-950 font-medium">
            {subQueues.length} {t("service_points_available")}
          </div>
          <SubQueueFormSheet
            facilityId={facilityId}
            resourceType={resourceType}
            resourceId={resourceId}
            onSuccess={handleSuccess}
            trigger={
              <Button size="sm" className="h-8">
                <Plus className="size-4 mr-2" />
                {t("add_service_point")}
              </Button>
            }
          />
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-4">
          <div className="space-y-3">
            {subQueues.map((subQueue) => (
              <SubQueueCard
                key={subQueue.id}
                facilityId={facilityId}
                subQueue={subQueue}
              />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SubQueueCard({
  facilityId,
  subQueue,
}: {
  facilityId: string;
  subQueue: TokenSubQueueRead;
}) {
  const { t } = useTranslation();
  const [editSubQueue, setEditSubQueue] = useState(false);
  const [subQueueName, setSubQueueName] = useState(subQueue.name);
  const [subQueueStatus, setSubQueueStatus] = useState(subQueue.status);
  const queryClient = useQueryClient();
  const { mutate: updateSubQueue } = useMutation({
    mutationFn: mutate(tokenSubQueueApi.update, {
      pathParams: { facility_id: facilityId, id: subQueue.id },
    }),
    onSuccess: () => {
      toast.success(t("service_point_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["tokenSubQueues", facilityId],
      });
    },
  });

  const handleUpdateSubQueue = () => {
    updateSubQueue({
      name: subQueueName,
      status: subQueueStatus,
    });
    setEditSubQueue(false);
  };

  return (
    <Card
      className={cn(
        "bg-gray-50 duration-200 border-gray-200 shadow-none rounded-sm",
        editSubQueue && "border border-dashed",
      )}
    >
      <CardContent className="py-1 px-3">
        {!editSubQueue ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 truncate">
                  {subQueue.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  subQueue.status === TokenSubQueueStatus.ACTIVE
                    ? "primary"
                    : "outline"
                }
                className="text-xs"
              >
                {t(subQueue.status)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditSubQueue(true)}
              >
                <Edit className="size-4" strokeWidth={1} />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="pt-3 space-y-6">
              <div>
                <Label className="mb-2">{t("service_point_name")}</Label>
                <Input
                  value={subQueueName}
                  onChange={(e) => setSubQueueName(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2">{t("status")}</Label>
                <RadioInput
                  options={Object.values(TokenSubQueueStatus).map((status) => ({
                    label: t(status),
                    value: status,
                  }))}
                  value={subQueueStatus}
                  onValueChange={(value) =>
                    setSubQueueStatus(value as TokenSubQueueStatus)
                  }
                />
              </div>
            </div>

            <Separator className="my-2" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEditSubQueue(false)}>
                {t("cancel")}
              </Button>
              <Button variant="primary" onClick={handleUpdateSubQueue}>
                <Check />
                {t("save_changes")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
