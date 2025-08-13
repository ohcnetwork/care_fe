import { CheckIcon, NotebookPen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export const SummaryPanelActionsTab = () => {
  const { t } = useTranslation();

  const actions = [
    {
      label: t("manage_consents"),
      href: "",
    },
    {
      label: t("manage_care_team"),
      href: "",
    },
    {
      label: t("update_location"),
      href: "",
    },
    {
      label: t("update_department"),
      href: "",
    },
  ] as const satisfies { label: string; href: string }[];

  return (
    <div className="flex flex-col gap-2 bg-gray-100 @sm:bg-white p-2 @sm:p-3 rounded-lg border border-gray-200 @sm:shadow @sm:overflow-x-auto">
      <div className="flex pl-1 @xs:hidden">
        <h6 className="text-gray-950 font-semibold">{t("actions")}</h6>
      </div>
      <div className="flex flex-col sm:@sm:flex-row gap-3 sm:@sm:gap-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="justify-start sm:@sm:justify-center sm:@sm:flex-1"
            asChild
          >
            <Link href={action.href}>
              <NotebookPen />
              {action.label}
            </Link>
          </Button>
        ))}

        <div className="sm:@sm:flex-1 flex flex-col gap-2 border-t border-gray-300 border-dashed sm:@sm:border-none pt-3 sm:@sm:pt-0">
          <Button
            variant="outline_primary"
            className="justify-start sm:@sm:justify-center"
            asChild
          >
            <Link href="">
              <CheckIcon />
              {t("mark_as_completed")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
