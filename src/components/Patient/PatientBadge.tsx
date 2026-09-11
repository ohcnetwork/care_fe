import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The patient portal's status pill.
 *
 * The shared `Badge` primitive bottoms out at ~24px tall, which reads as a
 * button next to the 12–14px rows these pills annotate. This keeps the same
 * palette but at the 18px height the portal screens are laid out around, and
 * names the tones by meaning (`success`, `warning`) rather than by hue so a
 * status never has to pick a colour at the call site.
 */
const patientBadgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 text-[11px] font-bold leading-4 whitespace-nowrap",
  {
    variants: {
      tone: {
        primary: "border-primary-200 bg-primary-100 text-primary-800",
        solid: "border-primary-700 bg-primary-700 text-white",
        neutral: "border-gray-200 bg-gray-100 text-gray-700",
        success: "border-green-200 bg-green-100 text-green-800",
        warning: "border-yellow-200 bg-yellow-100 text-yellow-800",
        info: "border-blue-200 bg-blue-100 text-blue-800",
        danger: "border-red-200 bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type PatientBadgeTone = NonNullable<
  VariantProps<typeof patientBadgeVariants>["tone"]
>;

export function PatientBadge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof patientBadgeVariants>) {
  return (
    <span
      data-slot="patient-badge"
      className={cn(patientBadgeVariants({ tone }), className)}
      {...props}
    />
  );
}
