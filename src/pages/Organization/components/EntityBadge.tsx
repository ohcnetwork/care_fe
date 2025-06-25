import React from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

interface EntityBadgeProps {
  title: string;
  count?: number | null | undefined;
  isFetching: boolean;
  translationParams?: Record<string, string>;
  customTranslation?: string;
}

const EntityBadge: React.FC<EntityBadgeProps> = ({
  title,
  count,
  isFetching,
  translationParams,
  customTranslation,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Badge className="bg-purple-50 text-purple-700 ml-2 rounded-xl px-3 py-0.5 m-3 w-max border-gray-200">
        {isFetching
          ? t("loading")
          : t(customTranslation || "entity_count", {
              count: count ?? 0,
              ...translationParams,
            })}
      </Badge>
    </div>
  );
};

export default EntityBadge;
