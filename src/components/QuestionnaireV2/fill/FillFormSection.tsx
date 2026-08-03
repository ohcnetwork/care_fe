import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { QuestionnaireFormProvider } from "@/components/QuestionnaireV2/form/FormContext";

import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

import { FillCanvas } from "./FillCanvas";
import { FillOutline } from "./FillOutline";
import { FillOutlineRail } from "./FillOutlineRail";
import type { FormStore } from "./StoreRegistrar";
import { StoreRegistrar } from "./StoreRegistrar";
import type { FillFormEntry } from "./formSession";

/**
 * One questionnaire of the session: its own provider (one store), its
 * canvas block in the shared scroll, and its outline pieces PORTALED
 * into the overlay's shared hosts (panel rows + rail ticks) — they must
 * live inside this provider to read this form's store.
 */
export function FillFormSection({
  form,
  subject,
  outlineHost,
  railHost,
  outlineLabel,
  onStore,
  onRemove,
  frozen = false,
}: {
  form: FillFormEntry;
  subject: RendererSubject;
  outlineHost: HTMLElement | null;
  railHost: HTMLElement | null;
  /** Accessible name for this form's outline landmark. The host passes
   *  the questionnaire title once a session holds more than one form, so
   *  the stacked navs stay distinguishable. */
  outlineLabel?: string;
  onStore: (key: string, store: FormStore | null) => void;
  onRemove?: (key: string) => void;
  /** The session is mid-submit — forwarded into this form's renderer
   *  context (freezes every question) and disables the Remove affordance
   *  below, so a click during flight can't drop a form the in-flight
   *  batch already accounts for. */
  frozen?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <QuestionnaireFormProvider
      questionnaire={form.questionnaire}
      mode="fill"
      subject={subject}
      initialResponses={form.initialResponses}
      frozen={frozen}
    >
      <StoreRegistrar formKey={form.key} onStore={onStore} />
      {outlineHost &&
        createPortal(
          <div className="flex flex-col gap-3">
            <p className="truncate pl-2 text-base font-semibold text-gray-950">
              {form.questionnaire.title}
            </p>
            <FillOutline ariaLabel={outlineLabel} />
          </div>,
          outlineHost,
        )}
      {railHost && createPortal(<FillOutlineRail />, railHost)}
      {/* The divider keys off `isPrimary`, not `:first-child` — the
          restore bar and the error panel share this scroll, so DOM
          position is not a reliable "first form" signal. */}
      <section
        data-form-key={form.key}
        className={cn(!form.isPrimary && "border-t border-gray-200 pt-6")}
      >
        {/* The canvas header already names the questionnaire — legacy
            parity here is only the drop affordance, and only the added
            forms get one. */}
        {onRemove && !form.isPrimary && (
          <div className="mx-auto mb-2 flex w-full max-w-3xl justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              // The button sits ABOVE its own form's header, so in reading
              // order it follows the PREVIOUS form's last question — a
              // session with two added forms would otherwise expose two
              // buttons both named just "Remove", and activating the wrong
              // one drops that questionnaire and its answers from the
              // session and from the persisted draft.
              aria-label={t("remove_questionnaire", {
                title: form.questionnaire.title,
              })}
              disabled={frozen}
              onClick={() => onRemove(form.key)}
            >
              <Trash2 className="size-4" />
              {t("remove")}
            </Button>
          </div>
        )}
        <FillCanvas />
      </section>
    </QuestionnaireFormProvider>
  );
}
