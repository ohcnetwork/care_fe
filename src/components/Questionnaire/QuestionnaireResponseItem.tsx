import { Link } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionnaireResponseItemProps {
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  title: string;
  editLink?: string;
  actionButton?: ReactNode;
}

export function QuestionnaireResponseItem({
  children,
  className,
  readOnly = false,
  actionButton,
  title,
  editLink,
}: QuestionnaireResponseItemProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn("border-none rounded-sm", className)}>
      <div>
        <div className="p-4 py-2 flex items-center">
          <CardHeader className="w-full flex flex-row justify-between p-0 m-0 translate-y-0.5">
            <CardTitle className="text-base font-semibold">
              {t(title)}
            </CardTitle>
            {!readOnly && editLink ? (
              <Button variant="outline" size="xs">
                <Link
                  href={editLink}
                  className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
                >
                  <CareIcon icon="l-pen" className="size-4" />
                  {t("edit")}
                </Link>
              </Button>
            ) : (
              actionButton && actionButton
            )}
          </CardHeader>
        </div>
        <div>
          <CardContent className="px-2 pb-2">{children}</CardContent>
        </div>
      </div>
    </Card>
  );
}
