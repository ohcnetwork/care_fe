import { MapPin, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

interface LocationTreeLayoutProps {
  /** Fills the panel under its header. Leave out for no panel. */
  tree?: ReactNode;
  className?: string;
  /** Gets the button that opens and closes the panel. */
  children: (sidebarToggle: ReactNode) => ReactNode;
}

/** A location tree panel beside a page, on a wide screen. */
export function LocationTreeLayout({
  tree,
  className,
  children,
}: LocationTreeLayoutProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  const sidebarToggle = (
    <Button
      variant="ghost"
      size="icon"
      className="-ml-2 hidden size-8 md:inline-flex"
      onClick={() => setIsOpen((open) => !open)}
      aria-expanded={isOpen}
      aria-label={t(isOpen ? "close_sidebar" : "open_sidebar")}
    >
      {isOpen ? (
        <PanelLeftClose aria-hidden="true" />
      ) : (
        <PanelLeftOpen aria-hidden="true" />
      )}
    </Button>
  );

  return (
    <div className={cn("flex items-stretch", className)}>
      {tree && (
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border transition-all duration-200 motion-reduce:transition-none md:block",
            isOpen ? "w-64" : "w-0 overflow-hidden border-r-0",
          )}
          inert={!isOpen}
        >
          <div className="flex h-full w-64 flex-col">
            <h2 className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-semibold">
              <MapPin className="size-4" aria-hidden="true" />
              {t("locations")}
            </h2>
            {tree}
          </div>
        </aside>
      )}
      {children(sidebarToggle)}
    </div>
  );
}
