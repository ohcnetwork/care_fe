import React from "react";
import { useTranslation } from "react-i18next";

type CountComponentProps = {
  count: number;
  entity: string;
};

const Count: React.FC<CountComponentProps> = ({ count, entity }) => {
  const { t } = useTranslation();

  return (
    <>
      {count == 1
        ? t("entity_count_one", {
            count: count,
            entity: entity,
          })
        : t("entity_count_other", {
            count: count,
            entity: entity,
          })}
    </>
  );
};

export default Count;
