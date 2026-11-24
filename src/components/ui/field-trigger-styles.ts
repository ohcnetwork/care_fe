export const fieldTriggerSurface =
  "rounded-md border border-input bg-background text-foreground shadow-2xs hover:bg-muted aria-expanded:bg-muted dark:bg-input/30 dark:hover:bg-input/50 dark:aria-expanded:bg-input/50";

export const fieldTriggerLayout =
  "inline-flex h-12 items-center gap-1.5 whitespace-nowrap px-3 text-sm md:h-10 md:px-2.5";

// Field triggers focus and fail validation like Input and SelectTrigger
// (border + soft ring), not with a Button-style offset outline.
export const triggerFocus =
  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

export const invalidTriggerRing =
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";
