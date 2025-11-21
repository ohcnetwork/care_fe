import { Trans, useTranslation } from "react-i18next";

// Variable for test completeness
const selectedQuestions = 3;

export function AllKeysExample() {
  const { t } = useTranslation();
  const status = "cancelled";

  return (
    <div>
      {/* Static key */}
      <h1>{t("field_required")}</h1>

      {/* Plural key with t() */}
      <p>{t("encounter_tag_count", { count: 3 })}</p>

      {/* Multiline plural key */}
      <p>
        {t("entity_count", {
          count: 4,
          entity: "User",
        })}
      </p>

      {/* Plural key with t() - multiline */}
      <p>{t("patient_count", { count: 10 })}</p>

      {/* Trans component without count */}
      <Trans i18nKey="page_title">
        <span>Hello</span>
      </Trans>

      {/* Trans component WITH count in values prop - THIS IS THE MISSING CASE */}
      <Trans
        i18nKey="found_patient_with_this"
        values={{ count: 5, identifier: "phone" }}
      />

      {/* Trans component with count - multiline format */}
      <Trans
        i18nKey="remove_questions_confirmation"
        values={{ count: selectedQuestions }}
        components={{
          strong: <strong />,
        }}
      />

      {/* Dynamic template keys */}
      <div>{t(`encounter_status__${status}`)}</div>

      {/* Edge case: Trans with values but no count */}
      <Trans i18nKey="welcome_message" values={{ name: "John" }} />

      {/* Edge case: Trans with i18nKey as expression */}
      <Trans i18nKey={"static_key"}>
        <span>Content</span>
      </Trans>

      {/* Edge case: t() with count = 0 */}
      <p>{t("no_items", { count: 0 })}</p>

      {/* Edge case: t() with multiline and count */}
      <p>
        {t("multiline_key", {
          count: 1,
          name: "Test",
        })}
      </p>

      {/* Edge case: Nested template literal */}
      <div>{t(`prefix__${status}__suffix`)}</div>
    </div>
  );
}
