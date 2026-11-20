import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { HrefLink } from "@/lib/router/HrefLink";

interface ActionButtonsProps {
  editPath?: string;
  viewPath: string;
}

export function ActionButtons({ editPath, viewPath }: ActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Button variant="outline" size="sm" asChild className="w-19 h-9 lg:h-8">
        <HrefLink href={viewPath}>
          <CareIcon icon="l-eye" className="size-5 text-xl" />
          {t("view")}
        </HrefLink>
      </Button>
      {editPath && (
        <Button variant="outline" size="sm" asChild className="w-19 h-9 lg:h-8">
          <HrefLink href={editPath}>
            <CareIcon icon="l-edit" className="size-5 text-sm" />
            {t("edit")}
          </HrefLink>
        </Button>
      )}
    </>
  );
}
