import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

type BackButtonProps = {
  to?: string;
} & React.ComponentProps<typeof Button>;

export default function BackButton({ to, ...props }: BackButtonProps) {
  const { t } = useTranslation();
  const { history } = useAppHistory();

  const backUrl = history[1] || to;

  if (!backUrl) {
    return null;
  }

  return (
    <Button variant="outline" data-shortcut-id="go-back" asChild {...props}>
      <Link basePath="/" href={backUrl} aria-label={t("back_to_previous_page")}>
        {props.children}
      </Link>
    </Button>
  );
}
