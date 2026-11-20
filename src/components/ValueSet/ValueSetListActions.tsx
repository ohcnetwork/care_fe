import { Copy, Eye, Pencil } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import type { ValueSetRead, ValueSetScope } from "@/types/valueSet/valueSet";

import { ValueSetPreview } from "./ValueSetPreview";

interface ValueSetListActionsProps {
  valueset: ValueSetRead;
  scope: ValueSetScope;
  isSharedCatalogue: boolean;
  canWrite: boolean;
}

export function ValueSetListActions({
  valueset,
  scope,
  isSharedCatalogue,
  canWrite,
}: ValueSetListActionsProps) {
  const { t } = useTranslation();
  if (isSharedCatalogue && scope.authContext === "facility") {
    // Instance sets are not editable from a facility (the backend
    // reserves them for superusers) — inspect, or customize a copy.
    return (
      <>
        <ValueSetPreview
          valueset={valueset}
          trigger={
            <Button variant="outline" size="sm">
              <Eye className="size-4 mr-0" />
              {t("preview")}
            </Button>
          }
        />
        {canWrite && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`${scope.basePath}/create?parent=${valueset.id}`)
            }
          >
            <Copy className="size-4 mr-0" />
            {t("customize")}
          </Button>
        )}
      </>
    );
  }
  const readOnly = !canWrite;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(`${scope.basePath}/${valueset.id}/edit`)}
      className="hover:bg-primary-50"
    >
      {readOnly ? (
        <>
          <Eye className="size-4 mr-0" />
          {t("view")}
        </>
      ) : (
        <>
          <Pencil className="size-4 mr-0" />
          {t("edit")}
        </>
      )}
    </Button>
  );
}
