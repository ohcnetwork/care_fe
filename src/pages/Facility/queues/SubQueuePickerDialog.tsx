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
import RadioInput from "@/components/ui/RadioInput";
import useBreakpoints from "@/hooks/useBreakpoints";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";

export const SubQueuePickerDialog = ({
  open,
  onOpenChange,
  title,
  description,
  subQueues,
  value,
  onValueChange,
  disabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  subQueues: TokenSubQueueRead[];
  value: string;
  onValueChange: (subQueueId: string) => void;
  disabled?: boolean;
}) => {
  const isMobile = useBreakpoints({ default: true, sm: false });

  const radio = (
    <RadioInput
      options={subQueues.map((subQueue) => ({
        label: subQueue.name,
        value: subQueue.id,
      }))}
      required
      onValueChange={onValueChange}
      value={value}
      className="flex flex-col gap-3"
      classNameInput="p-2"
      disabled={disabled}
    />
  );

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
          <div className="overflow-y-auto max-h-[70vh] p-3 pb-6">{radio}</div>
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
        <div className="overflow-y-auto max-h-[70vh] p-3">{radio}</div>
      </DialogContent>
    </Dialog>
  );
};
