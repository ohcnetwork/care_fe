import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export function ScrollToTopButton({
  rightOffset = 20,
}: {
  rightOffset?: number;
}) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const smRight = rightOffset ? `sm:right-${rightOffset}` : "";

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-10 right-2 z-50 rounded-full shadow-md",
        smRight,
      )}
      variant="outline_primary"
      size="icon"
      aria-label={t("scroll_to_top")}
      title={t("scroll_to_top")}
    >
      <ArrowUp className="size-4" />
    </Button>
  );
}
