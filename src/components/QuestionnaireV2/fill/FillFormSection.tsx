import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { QuestionnaireFormProvider } from "@/components/QuestionnaireV2/form/FormContext";

import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

import { FillCanvas } from "./FillCanvas";
import { FillOutline } from "./FillOutline";
import type { FormStore } from "./StoreRegistrar";
import { StoreRegistrar } from "./StoreRegistrar";
import type { FillFormEntry } from "./formSession";

/**
 * One questionnaire of the session: its own provider (one store), its
 * canvas block in the shared scroll, and its outline section PORTALED
 * into the shared aside — the outline must live inside this provider to
 * read this form's store.
 */
export function FillFormSection({
  form,
  subject,
  outlineHost,
  outlineLabel,
  onStore,
  onRemove,
}: {
  form: FillFormEntry;
  subject: RendererSubject;
  outlineHost: HTMLElement | null;
  /** Accessible name for this form's outline landmark. The host passes
   *  the questionnaire title once a session holds more than one form, so
   *  the stacked navs stay distinguishable. */
  outlineLabel?: string;
  onStore: (key: string, store: FormStore | null) => void;
  onRemove?: (key: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <QuestionnaireFormProvider
      questionnaire={form.questionnaire}
      mode="fill"
      subject={subject}
      initialResponses={form.initialResponses}
    >
      <StoreRegistrar formKey={form.key} onStore={onStore} />
      {outlineHost &&
        createPortal(
          <div className="mb-4">
            <p className="mb-1 truncate px-2 text-xs font-semibold uppercase text-gray-500">
              {form.questionnaire.title}
            </p>
            <FillOutline ariaLabel={outlineLabel} />
          </div>,
          outlineHost,
        )}
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
