import { Link } from "raviger";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

type BackButtonProps = {
  to?: string;
  fallbackUrl?: string;
} & React.ComponentProps<typeof Button>;

export default function BackButton({
  to,
  fallbackUrl,
  ...props
}: BackButtonProps) {
  const { history } = useAppHistory();

  to ??= history[1] ?? fallbackUrl;

  if (!to) {
    return null;
  }

  return (
    <Button variant="outline" data-shortcut-id="go-back" asChild {...props}>
      <Link basePath="/" href={to}>
        {props.children}
      </Link>
    </Button>
  );
}
