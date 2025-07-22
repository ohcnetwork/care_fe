import { ArrowUpFromDot } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export function ScrollToTopButton({ className }: { className?: string }) {
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
    window.scrollTo({ top: 0 });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        "rounded-full shadow-lg hover:border-primary-700 hover:text-primary-700 hover:bg-primary-100 border-gray-300",
        className,
      )}
      variant="outline"
      size="icon"
      aria-label={t("scroll_to_top")}
      title={t("scroll_to_top")}
    >
      <ArrowUpFromDot className="size-9" />
    </Button>
  );
}
