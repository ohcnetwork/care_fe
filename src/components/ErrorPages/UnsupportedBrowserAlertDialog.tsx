import { Dispatch, SetStateAction } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnsupportedBrowserDialogProps {
  showUnsupportedBrowserDialog: boolean;
  setShowUnsupportedBrowserDialog: Dispatch<SetStateAction<boolean>>;
}

const UnsupportedBrowserDialog = ({
  showUnsupportedBrowserDialog,
  setShowUnsupportedBrowserDialog,
}: UnsupportedBrowserDialogProps) => {
  return (
    <AlertDialog
      open={showUnsupportedBrowserDialog}
      onOpenChange={setShowUnsupportedBrowserDialog}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsupported Browser</AlertDialogTitle>
          <AlertDialogDescription>
            Your browser is unsupported. Please switch to a supported browser
            for the best experience.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => setShowUnsupportedBrowserDialog(false)}
          >
            Dismiss
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UnsupportedBrowserDialog;
