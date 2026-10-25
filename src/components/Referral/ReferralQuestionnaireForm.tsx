import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useStore } from "jotai";
import { AlertCircle, Loader2 } from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/careui/button";
import { FieldError } from "@/components/careui/field";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
} from "@/components/careui/item";
import { Muted } from "@/components/careui/typography";

import { sessionEditSignature } from "@/components/QuestionnaireV2/fill/draft/fillDraftStore";
import { QuestionnaireFormCanvas } from "@/components/QuestionnaireV2/form/FormCanvas";
import {
  QuestionnaireFormProvider,
  errorsAtom,
  responsesAtom,
  structuredRenderFailedAtom,
  useFormRenderer,
} from "@/components/QuestionnaireV2/form/FormContext";
import { collectQuestionErrors } from "@/components/QuestionnaireV2/form/validation";
import { ReferralQuestionnaireResult } from "@/types/emr/referral/referral";
import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";

import {
  hasUnsupportedReferralQuestions,
  pinReferralValueSets,
  referralValueSetSlugs,
  serializeReferralResponses,
} from "./referralQuestionnaireUtils";

interface ReferralQuestionnaireFormProps {
  questionnaire: QuestionnaireRead;
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  formId: string;
  disabled?: boolean;
  hideHeader?: boolean;
  children?: ReactNode;
  onSubmit: (results: ReferralQuestionnaireResult[]) => void;
  onReadyChange?: (ready: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function ReferralQuestionnaireForm({
  questionnaire,
  patientId,
  encounterId,
  facilityId,
  onReadyChange,
  ...props
}: ReferralQuestionnaireFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const unsupported = hasUnsupportedReferralQuestions(questionnaire.questions);
  const slugs = useMemo(
    () => referralValueSetSlugs(questionnaire.questions),
    [questionnaire.questions],
  );
  const resolution = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ["referral-valuesets", "instance", slug],
      // Referral validation resolves slug references only at instance level.
      // Omitting facility prevents the origin URL's local override/preference
      // from offering codes that the referral endpoint would reject.
      queryFn: query(valueSetApi.expandSlug, {
        body: { slug, search: "", count: 1 },
        silent: true,
      }),
      enabled: !unsupported,
      staleTime: 5 * 60 * 1000,
    })),
    combine: (results) => ({
      ids: results.map((result) => result.data?.valueset?.id ?? ""),
      isPending: results.some((result) => result.isPending),
      isFetching: results.some((result) => result.isFetching),
      hasError: results.some(
        (result) => !result.isPending && !result.data?.valueset?.id,
      ),
    }),
  });
  const ready = !unsupported && !resolution.isPending && !resolution.hasError;
  const rendererQuestionnaire = useMemo(
    () =>
      slugs.length
        ? {
            ...questionnaire,
            questions: pinReferralValueSets(
              questionnaire.questions,
              new Map(
                slugs.map((slug, index) => [slug, resolution.ids[index]]),
              ),
            ),
          }
        : questionnaire,
    [questionnaire, slugs, resolution.ids],
  );

  useEffect(() => {
    onReadyChange?.(ready);
    return () => onReadyChange?.(false);
  }, [onReadyChange, ready]);

  if (!ready) {
    return (
      <div className="space-y-6">
        {props.children}
        {unsupported ? (
          <Item variant="muted" role="alert" size="sm">
            <ItemMedia variant="icon">
              <AlertCircle />
            </ItemMedia>
            <ItemDescription>{t("referral_form_unsupported")}</ItemDescription>
          </Item>
        ) : resolution.hasError ? (
          <Item
            variant="outline"
            size="sm"
            className="border-cui-destructive/30"
          >
            <ItemContent className="items-start gap-3">
              <FieldError>{t("referral_form_choices_unavailable")}</FieldError>
              <Muted>
                {t("referral_form_choices_unavailable_description")}
              </Muted>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resolution.isFetching}
                onClick={() =>
                  Promise.all(
                    slugs.map((slug) =>
                      queryClient.refetchQueries({
                        queryKey: ["referral-valuesets", "instance", slug],
                        exact: true,
                      }),
                    ),
                  )
                }
              >
                {resolution.isFetching && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {t("try_again")}
              </Button>
            </ItemContent>
          </Item>
        ) : (
          <div
            className="flex items-center justify-center gap-2 py-8 text-sm text-cui-muted-foreground"
            role="status"
          >
            <Loader2 className="size-4 animate-spin" />
            {t("referral_loading_form_choices")}
          </div>
        )}
      </div>
    );
  }

  return (
    <QuestionnaireFormProvider
      questionnaire={rendererQuestionnaire}
      mode="fill"
      subject={{ patientId, encounterId, facilityId }}
      frozen={props.disabled}
    >
      <ReferralFormBody {...props} />
    </QuestionnaireFormProvider>
  );
}

type ReferralFormBodyProps = Pick<
  ReferralQuestionnaireFormProps,
  | "formId"
  | "disabled"
  | "hideHeader"
  | "children"
  | "onSubmit"
  | "onDirtyChange"
>;

function ReferralFormBody({
  formId,
  disabled,
  hideHeader,
  children,
  onSubmit,
  onDirtyChange,
}: ReferralFormBodyProps) {
  const { t } = useTranslation();
  const { questionnaire, subject } = useFormRenderer();
  const store = useStore();
  const errors = useAtomValue(errorsAtom);
  const formRef = useRef<HTMLFormElement>(null);
  const initialSignature = useRef<string | null>(null);
  const unsupported = hasUnsupportedReferralQuestions(questionnaire.questions);

  useEffect(() => {
    if (!onDirtyChange) return;
    const signature = () =>
      sessionEditSignature([
        { questionnaire, responses: store.get(responsesAtom) },
      ]);
    initialSignature.current ??= signature();
    const reportDirty = () =>
      onDirtyChange(signature() !== initialSignature.current);
    reportDirty();
    return store.sub(responsesAtom, reportDirty);
  }, [onDirtyChange, questionnaire, store]);

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || unsupported) return;
    const responses = store.get(responsesAtom);
    const validationErrors = collectQuestionErrors(
      questionnaire.questions,
      responses,
      t,
      {
        questionnaire,
        subject,
        renderFailed: store.get(structuredRenderFailedAtom),
      },
    );
    store.set(errorsAtom, validationErrors);
    if (validationErrors.length > 0) {
      const first = validationErrors[0];
      requestAnimationFrame(() => {
        const block = Array.from(
          formRef.current?.querySelectorAll<HTMLElement>(
            "[data-question-id]",
          ) ?? [],
        ).find(
          (element) =>
            element.dataset.questionId === first.question_id &&
            (!first.response_path?.length ||
              element.dataset.responsePath ===
                JSON.stringify(first.response_path)),
        );
        block?.scrollIntoView({ block: "center" });
        const input = block?.querySelector<HTMLElement>(
          "input, textarea, button, [tabindex]",
        );
        input?.focus({ preventScroll: true });
      });
      return;
    }
    onSubmit(serializeReferralResponses(questionnaire.questions, responses));
  };

  return (
    <form
      ref={formRef}
      id={formId}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {children}
      {unsupported ? (
        <Item variant="muted" role="alert" size="sm">
          <ItemMedia variant="icon">
            <AlertCircle />
          </ItemMedia>
          <ItemDescription>{t("referral_form_unsupported")}</ItemDescription>
        </Item>
      ) : (
        <div className="space-y-4 border-t border-cui-border pt-5">
          {errors.length > 0 && (
            <FieldError>{t("referral_check_required_answers")}</FieldError>
          )}
          <QuestionnaireFormCanvas
            className="max-w-none"
            hideHeader={hideHeader}
          />
        </div>
      )}
    </form>
  );
}
