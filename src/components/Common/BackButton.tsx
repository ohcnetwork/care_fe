import { Link } from "raviger";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";
import { t } from "i18next";

type BackButtonProps = {
  to?: string;
} & React.ComponentProps<typeof Button>;

export default function BackButton({ to, ...props }: BackButtonProps) {
  const { history } = useAppHistory();

  const backUrl = history[1] || to;

  if (!backUrl) {
    return null;
  }

  return (
    <Button
      variant="outline"
      data-shortcut-id="go-back"
      asChild
      {...props}
      aria-label={t("back_button")}
    >
      <Link basePath="/" href={backUrl}>
        {props.children}
      </Link>
    </Button>
  );
}
