// CareUI registry source: ohcnetwork/careui (d5cff874). Semantic color utilities
// are namespaced cui-* to coexist with CARE 3.1's existing theme.
/**
 * @name typography
 * @description App-shell heading components (h1-h6) tuned for clinical UI density.
 * @type registry:ui
 */
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Care UI app heading scale.
 *
 * Compressed scale built for clinical product surfaces — patient records,
 * encounter forms, dashboards, dialogs. It is intentionally smaller than the
 * shadcn/ui documentation scale so data stays above the fold and hierarchy
 * is carried by weight and rhythm, not visual drama.
 *
 *   Element  Component         Tailwind     px    Line     Weight           Typical use
 *   H1       <PageTitle>       text-3xl     30    36       font-bold        Page title
 *   H2       <SectionTitle>    text-2xl     24    32       font-semibold    Main section
 *   H3       <SubsectionTitle> text-xl      20    28       font-semibold    Card / section title
 *   H4       <GroupTitle>      text-lg      18    28       font-medium      Subsection
 *   H5       <DenseTitle>      text-base    16    24       font-medium      Dense heading
 *   H6       <EyebrowTitle>    text-sm      14    20       font-medium      Table / card heading
 *
 * Headings ship with **no spacing baked in** — apply margin in the consumer
 * so the same heading can be used flush in a dialog, in a list row, or with
 * generous breathing room on a page. HMIS-tuned rhythm (default targets a
 * dense clinical surface, not a marketing page):
 *
 *   Heading top margin             Body top margin (heading → p)
 *   ────────────────────────   ─────────────────────────────
 *   H1  —  (page entry)            H1 → p:  mt-2
 *   H2  mt-8                       H2 → p:  mt-2
 *   H3  mt-6                       H3 → p:  mt-1
 *   H4  mt-5                       H4 → p:  mt-1
 *   H5  mt-4                       H5 → p:  mt-1
 *   H6  mt-4                       H6 → p:  mt-1
 *
 * Body always sits close to its heading — the breathing room comes from
 * the heading's own top margin, not from a gap below it. Sibling
 * paragraphs use `mt-3` (or `mt-2` on tight surfaces) between each other.
 *
 * Mobile (<sm, 640px) and tight surfaces (cards, dialogs, popovers, side
 * panels) drop one notch: H2 mt-6, H3 mt-4, H4 mt-3, H5/H6 mt-3. Use the
 * mobile-first pattern in JSX:
 *
 *   <SectionTitle className="mt-6 sm:mt-8">Active orders</SectionTitle>
 *
 * Heading sizes do not need to scale on mobile — the scale tops out at
 * 30 px (H1) and is mobile-safe at every breakpoint.
 *
 * If a heading is also an anchor target under a sticky header, add
 * `scroll-m-20` (or your offset) on the consumer side.
 *
 * Use these in product code. Reserve the larger shadcn docs scale for the
 * documentation site, marketing pages, and empty / sign-in screens.
 *
 * ---
 *
 * Text utilities (named after the shadcn typography conventions, sized for
 * the compressed app scale and aligned with Apple HIG — no Thin/Light
 * weights, body sits at 16px with comfortable leading):
 *
 *   Component       Tailwind                                  Typical use
 *   <Lead>          text-lg text-cui-muted-foreground             Intro / sub-title
 *   <Large>         text-base font-semibold                   Strong-emphasis body (Apple “Headline”)
 *   <Small>         text-sm font-medium leading-none          Form labels, captions, meta
 *   <Muted>         text-sm text-cui-muted-foreground             Helper / secondary text
 *   <InlineCode>    bg-cui-muted px-1.5 py-0.5 font-mono text-sm  Inline identifier / value
 */

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;

export function CareUIPageTitle({ className, ...props }: HeadingProps) {
  return (
    <h1
      data-slot="page-title"
      className={cn(
        "text-3xl leading-9 font-bold tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({ className, ...props }: HeadingProps) {
  return (
    <h2
      data-slot="section-title"
      className={cn(
        "text-2xl leading-8 font-semibold tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  );
}

export function SubsectionTitle({ className, ...props }: HeadingProps) {
  return (
    <h3
      data-slot="subsection-title"
      className={cn(
        "text-xl leading-7 font-semibold tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  );
}

export function GroupTitle({ className, ...props }: HeadingProps) {
  return (
    <h4
      data-slot="group-title"
      className={cn("text-lg leading-7 font-medium", className)}
      {...props}
    />
  );
}

export function DenseTitle({ className, ...props }: HeadingProps) {
  return (
    <h5
      data-slot="dense-title"
      className={cn("text-base leading-6 font-medium", className)}
      {...props}
    />
  );
}

export function EyebrowTitle({ className, ...props }: HeadingProps) {
  return (
    <h6
      data-slot="eyebrow-title"
      className={cn("text-sm leading-5 font-medium", className)}
      {...props}
    />
  );
}

// --- Text utilities -------------------------------------------------------
// Naming follows the shadcn typography conventions; sizing is tuned for the
// Care UI compressed app scale and follows Apple HIG guidance (no Thin/Light
// weights, body at 16px with comfortable leading).

type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>;

export function Lead({ className, ...props }: ParagraphProps) {
  return (
    <p
      data-slot="lead"
      className={cn(
        "text-cui-muted-foreground text-lg leading-7 text-balance",
        className,
      )}
      {...props}
    />
  );
}

export function Large({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="large"
      className={cn("text-base leading-6 font-semibold", className)}
      {...props}
    />
  );
}

export function Small({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <small
      data-slot="small"
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  );
}

export function Muted({ className, ...props }: ParagraphProps) {
  return (
    <p
      data-slot="muted"
      className={cn("text-cui-muted-foreground text-sm leading-5", className)}
      {...props}
    />
  );
}

export function InlineCode({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      data-slot="inline-code"
      className={cn(
        "bg-cui-muted relative rounded px-1.5 py-0.5 font-mono text-sm font-medium",
        className,
      )}
      {...props}
    />
  );
}
