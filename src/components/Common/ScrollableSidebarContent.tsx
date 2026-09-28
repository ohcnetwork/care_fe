import { ChevronsDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { SidebarContent } from "@/components/ui/sidebar";

interface ScrollableSidebarContentProps {
  children: ReactNode;
}

export function ScrollableSidebarContent({
  children,
}: ScrollableSidebarContentProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateOverflow = () => {
      setHasMore(
        container.scrollHeight - container.scrollTop - container.clientHeight >
          2,
      );
    };
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(container);
    observer.observe(content);
    container.addEventListener("scroll", updateOverflow, { passive: true });
    updateOverflow();
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", updateOverflow);
    };
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <SidebarContent
        ref={containerRef}
        className="gap-2 bg-neutral-100 text-neutral-950"
      >
        <div ref={contentRef} className="flex flex-col gap-2 pb-9">
          {children}
        </div>
      </SidebarContent>
      {hasMore && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-neutral-100 via-neutral-100/95 to-transparent pt-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("more_navigation")}
            className="pointer-events-auto size-10 rounded-md bg-transparent text-neutral-500 shadow-none hover:bg-transparent hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 [&_svg]:size-5"
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey
              ) {
                // Keep native activation from being intercepted by global Enter.
                event.stopPropagation();
              }
            }}
            onClick={() =>
              containerRef.current?.scrollBy({
                top: Math.max(120, containerRef.current.clientHeight * 0.6),
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            <ChevronsDown aria-hidden="true" strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  );
}
