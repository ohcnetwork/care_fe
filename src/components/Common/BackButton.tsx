import { navigate } from "raviger";

import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

type BackButtonProps = {
  to?: string;
} & React.ComponentProps<typeof Button>;

export default function BackButton({ to, ...props }: BackButtonProps) {
  const { goBack } = useAppHistory();

  return (
    <Button
      variant="outline"
      data-shortcut-id="go-back"
      onClick={() => {
        if (to) {
          navigate(to);
        } else {
          goBack();
        }
      }}
      {...props}
    />
  );
}
