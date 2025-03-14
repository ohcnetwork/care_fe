import React from "react";
import { Trans, useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

interface EntityBadgeProps {
  title: string;
  count?: number | null | undefined;
  isFetching: boolean;
  translationParams?: Record<string, string>;
  customTranslation?: React.ReactNode;
}

const EntityBadge: React.FC<EntityBadgeProps> = ({
  title,
  count,
  isFetching,
  translationParams = {},
  customTranslation,
}) => {
  const { t } = useTranslation();
  const translationCountValue = {
    count: count ?? 0,
    ...translationParams,
  };
  return (
    <div className="flex items-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Badge
        className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 m-3 w-max"
        variant="outline"
      >
        {isFetching
          ? t("loading")
          : customTranslation ||
            (count && count == 1 ? (
              <Trans
                i18nKey={"entity_count_one"}
                values={translationCountValue}
              />
            ) : (
              <Trans
                i18nKey={"entity_count_other"}
                values={translationCountValue}
              />
            ))}
      </Badge>
    </div>
  );
};

export default EntityBadge;
