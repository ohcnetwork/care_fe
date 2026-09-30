import React from "react";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

import { useTranslation } from "react-i18next";

import TagConfigForm from "@/pages/Admin/TagConfig/TagConfigForm";
import { isIOSDevice } from "@/Utils/utils";

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
  const { t } = useTranslation();

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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      mobile="drawer"
      desktop="sheet"
      breakpoint="sm"
      repositionInputs={!isIOSDevice}
      trigger={trigger}
      title={title}
      titleClassName="text-xl"
      description={
        configId ? t("edit_tag_config") : t("manage_tag_config_description")
      }
      descriptionClassName="sr-only"
      headerClassName="flex flex-row items-center justify-between"
      mobileClassName="min-h-[65vh] max-h-[100vh]"
      desktopClassName="overflow-y-auto"
      mobileBodyClassName="overflow-y-auto flex-1 px-3 pb-2"
      desktopBodyClassName="mt-6 pb-6"
    >
      <TagConfigForm
        configId={configId}
        parentId={parentId}
        facilityId={facilityId}
        onSuccess={handleSuccess}
      />
    </ResponsiveDialog>
  );
}
