import { Link } from "raviger";
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
      <Button variant="outline" size="sm" asChild>
        <Link basePath="/" href={viewPath}>
          <CareIcon icon="l-eye" className="size-5 text-xl" />
          {t("view")}
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link basePath="/" href={editPath}>
          <CareIcon icon="l-edit" className="size-5 text-sm" />
          {t("edit")}
        </Link>
      </Button>
    </>
  );
}
