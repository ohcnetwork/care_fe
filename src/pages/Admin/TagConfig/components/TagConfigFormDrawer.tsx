import React from "react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import useBreakpoints from "@/hooks/useBreakpoints";
import TagConfigForm from "@/pages/Admin/TagConfig/TagConfigForm";
import { isAppleDevice } from "@/Utils/utils";

interface TagConfigFormDrawerProps {
  title: string;
  configId?: string;
  parentId?: string;
  facilityId?: string;
  onSuccess?: () => void;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function TagConfigFormDrawer({
  title,
  configId,
  parentId,
  facilityId,
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TagConfigFormDrawerProps) {
  const isMobile = useBreakpoints({ default: true, sm: false });

  const [internalOpen, setInternalOpen] = React.useState(false);

  // Determine if we're using controlled or uncontrolled state
  const isControlled =
    controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled
    ? controlledOnOpenChange
    : (value: boolean) => setInternalOpen(value);

  const handleSuccess = () => {
    onSuccess?.();
    if (!isControlled) {
      setInternalOpen(false);
    }
  };

  return (
    <>
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          repositionInputs={!isAppleDevice}
        >
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent className="min-h-[65vh] max-h-[100vh]">
            <DrawerHeader className="flex flex-row items-center justify-between">
              <DrawerTitle className="text-xl font-semibold">
                {title}
              </DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto flex-1 px-3 pb-2">
              <TagConfigForm
                configId={configId}
                parentId={parentId}
                facilityId={facilityId}
                onSuccess={handleSuccess}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader className="flex flex-row items-center justify-between">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 pb-6">
              <TagConfigForm
                configId={configId}
                parentId={parentId}
                facilityId={facilityId}
                onSuccess={handleSuccess}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
