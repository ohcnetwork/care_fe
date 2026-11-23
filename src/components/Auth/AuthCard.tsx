import { ArrowLeft } from "lucide-react";
import { ReactNode, useId } from "react";

import { Button } from "@/components/ui/button";

interface AuthCardProps {
  title: ReactNode;
  description?: ReactNode;
  back?: { label: string; onClick: () => void };
  children: ReactNode;
}

// Faint Care-cross pixels tucked into the card's top-right corner.
const CORNER_PIXELS = [
  {
    fill: "#a7f3d0",
    opacity: 0.2,
    cells: [
      [12, 0],
      [72, 0],
      [120, 12],
      [36, 24],
      [84, 24],
      [0, 36],
      [60, 36],
      [108, 48],
      [24, 60],
      [84, 60],
      [132, 72],
      [48, 84],
    ],
  },
  {
    fill: "#10b981",
    opacity: 0.1,
    cells: [
      [108, 0],
      [24, 12],
      [132, 24],
      [96, 36],
      [48, 48],
      [120, 60],
    ],
  },
  {
    fill: "#065f46",
    opacity: 0.15,
    cells: [
      [132, 0],
      [72, 24],
      [108, 72],
    ],
  },
];

/**
 * The sign-in card from the careui staff-sign-in-01 block. Screens with a
 * `back` action (password reset steps) drop the Care icon from the header.
 */
export function AuthCard({
  title,
  description,
  back,
  children,
}: AuthCardProps) {
  const titleId = useId();

  return (
    <div className="w-full md:rounded-4xl md:border md:bg-soft-background md:p-2">
      <section
        aria-labelledby={titleId}
        className="relative isolate w-full overflow-clip rounded-2xl border border-border bg-card shadow-lg ring-1 ring-foreground/5"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 144 96"
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-0 right-0 z-0 h-24 w-36 mask-[radial-gradient(ellipse_at_top_right,black_15%,transparent_45%)] opacity-50"
        >
          {CORNER_PIXELS.map(({ fill, opacity, cells }) => (
            <g key={fill} fill={fill} opacity={opacity}>
              {cells.map(([x, y]) => (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="11"
                  height="11"
                  rx="1.25"
                />
              ))}
            </g>
          ))}
        </svg>
        <div className="relative z-10 flex flex-col gap-4 p-4 pt-6 md:p-6 md:pb-4">
          {back && (
            <Button
              type="button"
              variant="tertiary"
              className="self-start"
              onClick={back.onClick}
            >
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              {back.label}
            </Button>
          )}
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h1 id={titleId} className="text-xl font-semibold">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {!back && (
              <>
                <img
                  src="/images/care_icon_on_light.svg"
                  alt=""
                  aria-hidden="true"
                  className="mt-1 size-8 shrink-0 object-contain dark:hidden"
                />
                <img
                  src="/images/care_icon_on_dark.svg"
                  alt=""
                  aria-hidden="true"
                  className="mt-1 hidden size-8 shrink-0 object-contain dark:block"
                />
              </>
            )}
          </header>
          {children}
        </div>
      </section>
    </div>
  );
}
