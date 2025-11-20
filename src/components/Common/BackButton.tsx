import { Button } from "@/components/ui/button";

import useAppHistory from "@/hooks/useAppHistory";

export default function BackButton(props: React.ComponentProps<typeof Button>) {
  const { goBack } = useAppHistory();

  return (
    <Button
      variant="outline"
      data-shortcut-id="go-back"
      onClick={() => goBack()}
      {...props}
    />
  );
}
