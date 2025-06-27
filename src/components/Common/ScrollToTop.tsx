import { ArrowUpFromDot } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function ScrollToTopButton({
  rightOffset = 24,
  bottomOffset = 24,
}: {
  rightOffset?: number;
  bottomOffset?: number;
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

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className="fixed z-50 rounded-full shadow-md  hover:border-primary-700 hover:text-primary-700 hover:bg-primary-100"
      style={{ right: rightOffset, bottom: bottomOffset }}
      variant="outline"
      size="icon"
      aria-label={t("scroll_to_top")}
      title={t("scroll_to_top")}
    >
      <ArrowUpFromDot className="size-9" />
    </Button>
  );
}
