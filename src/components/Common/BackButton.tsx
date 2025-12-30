import { Link } from "raviger";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

type BackButtonProps = {
  to?: string;
} & React.ComponentProps<typeof Button>;

export default function BackButton({ to, ...props }: BackButtonProps) {
  const { history } = useAppHistory();

  to ??= history[1];

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
