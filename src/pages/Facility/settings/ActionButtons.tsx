import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  editPath: string;
  viewPath: string;
}

export function ActionButtons({ editPath, viewPath }: ActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => navigate(viewPath)}>
        <CareIcon icon="l-eye" className="size-5 text-xl" />
        {t("view")}
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate(editPath)}>
        <CareIcon icon="l-edit" className="size-5 text-sm" />
        {t("edit")}
      </Button>
    </>
  );
}
