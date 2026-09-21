import { ComponentProps } from "react";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PrintPreviewDialogProps extends ComponentProps<typeof PrintPreview> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintPreviewDialog({
  open,
  onOpenChange,
  ...props
}: PrintPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[95vw] max-h-[95vh] overflow-auto"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{props.title}</DialogTitle>
        <PrintPreview {...props} showBackButton={false} autoPrint={false} />
      </DialogContent>
    </Dialog>
  );
}
