/**
 * @name spinner
 * @description A loading spinner component to indicate activity.
 * @dependencies class-variance-authority
 * @type registry:ui
 */
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { t } = useTranslation();
  return (
    <Loader2Icon
      role="status"
      aria-label={t("loading")}
      className={cn(
        "size-4 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]",
        className,
      )}
      {...props}
    />
  );
}

const BARS = Array(12).fill(0);

function RadialSpinner({ className, ...props }: React.ComponentProps<"span">) {
  const { t } = useTranslation();
  return (
    <span
      role="status"
      aria-label={t("loading")}
      data-slot="radial-spinner"
      className={cn("inline-flex size-4", className)}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-full animate-spin [animation-timing-function:steps(12,end)]"
        aria-hidden="true"
      >
        {BARS.map((_, i) => (
          <rect
            key={i}
            x="11"
            y="1"
            width="2"
            height="6"
            rx="1"
            fill="currentColor"
            opacity={(i + 1) / 12}
            transform={`rotate(${i * 30} 12 12)`}
          />
        ))}
      </svg>
      <span className="sr-only">{t("loading")}</span>
    </span>
  );
}

export { RadialSpinner, Spinner };
