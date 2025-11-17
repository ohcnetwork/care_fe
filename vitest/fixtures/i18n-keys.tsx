import { Trans, useTranslation } from "react-i18next";

export function AllKeysExample() {
  const { t } = useTranslation();
  const status = "cancelled";

  return (
    <div>
      {/* Static key */}
      <h1>{t("field_required")}</h1>

      {/* Plural key */}
      <p>{t("encounter_tag_count", { count: 3 })}</p>

      {/* Multiline plural key */}
      <p>
        {t("entity_count", {
          count: 4,
          entity: "User",
        })}
      </p>

      {/* Trans component */}
      <Trans i18nKey="page_title">
        <span>Hello</span>
      </Trans>

      {/* Dynamic template keys */}
      <div>{t(`encounter_status__${status}`)}</div>
    </div>
  );
}
