import { Layers, Sliders } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MotionPreviewProps {
  reducedMotion: boolean;
}

export function MotionPreview({ reducedMotion }: MotionPreviewProps) {
  const { t } = useTranslation();
  const description = reducedMotion
    ? t("appearance_motion_preview_reduced")
    : t("appearance_motion_preview_full");

  return (
    <div className="rounded-lg border border-border bg-soft-background p-4">
      <p className="text-xs font-semibold tracking-wider text-foreground uppercase">
        {t("appearance_motion_preview_title")}
      </p>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-md border border-dashed border-border/80 bg-background/60 p-6">
        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="secondary"
                size="sm"
                className="h-auto min-h-9 whitespace-normal"
              >
                <Layers className="size-4" />
                {t("appearance_motion_open_dialog")}
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("appearance_motion_sample_dialog")}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              {t("appearance_motion_preview_help")}
            </p>
            <DialogFooter>
              <DialogClose render={<Button>{t("close")}</Button>} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-auto min-h-9 whitespace-normal"
              >
                <Sliders className="size-4" />
                {t("appearance_motion_open_popover")}
              </Button>
            }
          />
          <PopoverContent side="top" align="center">
            <PopoverHeader>
              <PopoverTitle>
                {t("appearance_motion_sample_popover")}
              </PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
