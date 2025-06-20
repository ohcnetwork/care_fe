import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function ScrollToTopButton() {
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
      className="fixed bottom-10 right-20 z-50 rounded-full shadow-md"
      variant="outline_primary"
      size="icon"
      aria-label={t("scroll_to_top")}
      title={t("scroll_to_top")}
    >
      <ArrowUp className="size-4" />
    </Button>
  );
}
