import { ArrowLeft } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

export default function BackButton({ to }: { to?: string }) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  return (
    <Button
      variant="outline"
      className="border border-gray-400 text-gray-950 gap-1 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
      onClick={() => {
        if (to) {
          navigate(to);
        } else {
          goBack();
        }
      }}
    >
      <ArrowLeft className="size-5 text-gray-700" />
      <span className="underline text-gray-950">{t("back")}</span>
    </Button>
  );
}
