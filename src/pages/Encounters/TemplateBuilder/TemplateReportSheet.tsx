import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { TemplateType } from "@/types/emr/template/template";
import { navigate } from "raviger";
import TemplateList from "./TemplateList";

interface TemplateReportSheetProps {
  facilityId: string;
  encounterId?: string;
  patientId?: string;
  associatingId: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
  permissions: string[];
  reportType?: TemplateType;
}

export default function TemplateReportSheet({
  facilityId,
  associatingId,
  trigger,
  permissions,
  reportType,
  onSuccess,
}: TemplateReportSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { canWriteTemplate } = getPermissions(hasPermission, permissions);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent size="md" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{t("available_templates")}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <div className="flex flex-col gap-2 mb-4">
            {canWriteTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/facility/${facilityId}/template/builder/`)
                }
              >
                {t("create_template")}
              </Button>
            )}
          </div>
          <TemplateList
            facilityId={facilityId}
            associatingId={associatingId}
            permissions={permissions}
            enabled={open}
            onSuccess={handleSuccess}
            showFilters={false}
            reportType={reportType}
            className="flex flex-col"
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
