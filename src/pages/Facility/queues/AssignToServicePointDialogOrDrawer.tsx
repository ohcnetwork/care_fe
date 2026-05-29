import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useBreakpoints from "@/hooks/useBreakpoints";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
  TokenUpdate,
} from "@/types/tokens/token/token";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import { UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const AssignToServicePointDialogOrDrawer = ({
  open,
  onOpenChange,
  token,
  subQueues,
  onUpdate,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  token: TokenRead;

  subQueues: TokenSubQueueRead[];
  onUpdate: (data: TokenUpdate) => void;
  isPending: boolean;
}) => {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });

  const [selectedSubQueueId, setSelectedSubQueueId] = useState<string>(
    token.sub_queue?.id ?? "",
  );

  useEffect(() => {
    if (open) {
      setSelectedSubQueueId(token.sub_queue?.id ?? "");
    }
  }, [open, token.sub_queue?.id]);

  const handleConfirm = () => {
    if (selectedSubQueueId) {
      onUpdate({
        sub_queue: selectedSubQueueId,
        status: TokenStatus.IN_PROGRESS,
        note: token.note,
      });
    }
  };

  const title = t("select_service_point");
  const description = t("choose_service_point_to_call_patient", {
    patientName: token.patient?.name,
    tokenNumber: renderTokenNumber(token),
  });

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-base text-left">{title}</DrawerTitle>
            <DrawerDescription className="text-sm text-gray-600 text-left">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-3">
            <ServicePointList
              subQueues={subQueues}
              selectedSubQueueId={selectedSubQueueId}
              setSelectedSubQueueId={setSelectedSubQueueId}
              handleConfirm={handleConfirm}
              isPending={isPending}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <ServicePointList
          subQueues={subQueues}
          selectedSubQueueId={selectedSubQueueId}
          setSelectedSubQueueId={setSelectedSubQueueId}
          handleConfirm={handleConfirm}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

const ServicePointList = ({
  subQueues,
  selectedSubQueueId,
  setSelectedSubQueueId,
  handleConfirm,
  isPending,
}: {
  subQueues: TokenSubQueueRead[];
  selectedSubQueueId: string;
  setSelectedSubQueueId: (id: string) => void;
  handleConfirm: () => void;
  isPending: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <>
      {subQueues.length === 0 ? (
        <span className="text-sm text-gray-500">
          {t("no_active_service_points_present")}
        </span>
      ) : (
        <RadioGroup
          value={selectedSubQueueId}
          onValueChange={setSelectedSubQueueId}
        >
          {subQueues.map((subQueue) => (
            <div
              key={subQueue.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedSubQueueId(subQueue.id)}
            >
              <RadioGroupItem
                value={subQueue.id}
                id={subQueue.id}
                key={subQueue.id}
              />
              <Label
                htmlFor={subQueue.id}
                className="flex-1 text-sm font-medium cursor-pointer"
              >
                {subQueue.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      <div className="flex mt-2">
        <Button
          onClick={handleConfirm}
          className="w-full"
          disabled={!selectedSubQueueId || isPending}
        >
          <UserCheck className="size-4 mr-2" />
          {t("mark_as_in_service")}
        </Button>
      </div>
    </>
  );
};
