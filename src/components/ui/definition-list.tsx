import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface DefinitionListProps {
  children: ReactNode;
  className?: string;
}

interface DefinitionListItemProps {
  term: ReactNode;
  description: ReactNode;
}

export function DefinitionList({ children, className }: DefinitionListProps) {
  return (
    <dl className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className || ""}`}>
      {children}
    </dl>
  );
}

export function DefinitionListItem({
  term,
  description,
}: DefinitionListItemProps) {
  const { t } = useTranslation();

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{term}</dt>
      {description ? (
        <dd className="mt-1">{description}</dd>
      ) : (
        <dd className="mt-1 text-gray-500">{t("not_specified")}</dd>
      )}
    </div>
  );
}
