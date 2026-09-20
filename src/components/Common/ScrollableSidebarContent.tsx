import { ChevronDown } from "lucide-react";
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-neutral-100 via-neutral-100/95 to-transparent pt-4 pb-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-auto h-7 gap-1 rounded-full bg-white text-xs"
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
            {t("more_navigation")}
            <ChevronDown aria-hidden className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
