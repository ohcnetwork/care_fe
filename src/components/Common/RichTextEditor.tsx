import { lazy, Suspense } from "react";

import { Textarea } from "@/components/ui/textarea";

const RichTextEditorContent = lazy(
  () => import("@/components/Common/RichTextEditorContent"),
);

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense
      fallback={
        <Textarea
          aria-label={props.label}
          aria-busy="true"
          value={props.value}
          placeholder={props.placeholder}
          className="min-h-40"
          disabled
        />
      }
    >
      <RichTextEditorContent {...props} />
    </Suspense>
  );
}
